import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { selectAccessToken, selectIsAuthenticated, selectUser } from '../modules/auth/authSlice';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    
    const token = useSelector(selectAccessToken);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const user = useSelector(selectUser);

    useEffect(() => {
        // Disconnect if user logs out
        if (!isAuthenticated && socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
            return;
        }

        // Connect if authenticated and no socket exists
        if (isAuthenticated && token && !socket) {
            const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
            
            const newSocket = io(socketUrl, {
                auth: { token },
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            newSocket.on('connect', () => {
                console.log('🔌 [Socket] Connected to server:', newSocket.id);
                setIsConnected(true);
                
                // If user is a donor and has a city, join the corresponding room automatically
                if (user?.role === 'donor' && user?.location?.town) {
                    newSocket.emit('donor:join', user.location.town.toLowerCase());
                }
            });

            newSocket.on('disconnect', (reason) => {
                console.log('🔌 [Socket] Disconnected:', reason);
                setIsConnected(false);
            });

            newSocket.on('connect_error', (err) => {
                console.error('🔌 [Socket] Connection error:', err.message);
            });

            setSocket(newSocket);
        }

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [isAuthenticated, token, user]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
