import { verifyAccessToken } from '../utils/token.js';
import { AppError } from '../utils/response.js';
import User from '../modules/auth/auth.model.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Access token required', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);

        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (!user) {
            throw new AppError('User not found', 401);
        }

        if (user.isSuspended) {
            throw new AppError('Account suspended. Contact support.', 403);
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(new AppError('Invalid or expired token', 401));
        }
        next(error);
    }
};
