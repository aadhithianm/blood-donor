import { AppError } from '../utils/response.js';

/**
 * Role guard middleware — restricts route access to specified roles
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'donor', 'hospital')
 */
export const roleGuard = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Authentication required', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AppError(`Access denied. Required role: ${roles.join(' or ')}`, 403));
        }

        next();
    };
};
