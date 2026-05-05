import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/token.js';

let io;
let onlineCount = 0;

export const initSocketServer = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true,
        },
    });

    // JWT authentication middleware for socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication token required'));
        }
        try {
            const decoded = verifyAccessToken(token);
            socket.userId = decoded.userId;
            socket.userRole = decoded.role;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        onlineCount++;
        console.log(`🔌 Socket connected: ${socket.userId} (total: ${onlineCount})`);

        // Join user's personal room
        socket.join(`user:${socket.userId}`);

        // Admins join the admin control room
        if (socket.userRole === 'admin') {
            socket.join('admin:room');
        }

        // Broadcast updated online count to all admins
        io.to('admin:room').emit('admin:stats', {
            onlineCount,
            connectedClients: io.engine.clientsCount,
        });

        // Donor joins district room for targeted broadcasts
        socket.on('donor:join', (district) => {
            if (district) {
                socket.join(`room:${district}`);
            }
        });

        // Donor real-time location update (for request tracking)
        socket.on('donor:location', (data) => {
            const { requestId, latitude, longitude } = data;
            if (requestId) {
                io.to(`request:${requestId}`).emit('donor:location:update', {
                    donorId: socket.userId,
                    latitude,
                    longitude,
                    timestamp: new Date(),
                });
            }
        });

        // Donor accepts / leaves a request room
        socket.on('request:accept', ({ requestId }) => {
            socket.join(`request:${requestId}`);
        });

        socket.on('request:reject', (data) => {
            console.log(`Donor ${socket.userId} rejected request ${data.requestId}`);
        });

        socket.on('disconnect', () => {
            onlineCount = Math.max(0, onlineCount - 1);
            console.log(`🔌 Socket disconnected: ${socket.userId} (total: ${onlineCount})`);

            // Update admin room after disconnect
            io.to('admin:room').emit('admin:stats', {
                onlineCount,
                connectedClients: io.engine.clientsCount,
            });
        });
    });

    console.log('✅ Socket.io initialized');
    return io;
};

export const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
};

/** Emit a new blood request to the admin room (called from request service) */
export const emitAdminNewRequest = (requestData) => {
    try {
        if (io) io.to('admin:room').emit('admin:new_request', requestData);
    } catch (_) {}
};

/** Emit a new audit log entry to the admin room (called from audit middleware) */
export const emitAdminAuditEntry = (entry) => {
    try {
        if (io) io.to('admin:room').emit('admin:audit_entry', entry);
    } catch (_) {}
};

/** Emit hospital pending count bump (called after hospital profile creation) */
export const emitAdminHospitalPending = () => {
    try {
        if (io) io.to('admin:room').emit('admin:hospital_pending');
    } catch (_) {}
};
