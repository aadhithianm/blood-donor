import AuditLog from '../modules/admin/auditLog.model.js';
import { emitAdminAuditEntry } from '../sockets/index.js';

/**
 * Express middleware that writes an AuditLog entry after a successful admin
 * response, then streams the entry to admin:room via socket.
 * Usage: router.patch('/users/:id/suspend', auditAction('user_suspend', ...), handler)
 */
export const auditAction = (action, getDetails = () => '') => {
    return (req, res, next) => {
        const originalJson = res.json.bind(res);

        res.json = (body) => {
            originalJson(body);

            if (res.statusCode >= 200 && res.statusCode < 300 && req.user?._id) {
                const details = typeof getDetails === 'function'
                    ? getDetails(req, body)
                    : String(getDetails);

                AuditLog.create({
                    userId: req.user._id,
                    action,
                    details,
                    ip: req.ip,
                    deviceId: req.headers['x-device-id'] || null,
                }).then((log) => {
                    // Stream new log entry to admin:room in real-time
                    emitAdminAuditEntry({
                        _id: log._id,
                        action: log.action,
                        details: log.details,
                        ip: log.ip,
                        createdAt: log.createdAt,
                        userId: {
                            _id: req.user._id,
                            name: req.user.name,
                            email: req.user.email,
                            role: req.user.role,
                        },
                    });
                }).catch((err) => console.warn('[AuditLog] write failed:', err.message));
            }

            return res;
        };

        next();
    };
};
