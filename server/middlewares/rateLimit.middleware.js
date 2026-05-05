import redis from '../config/redis.js';
import { AppError } from '../utils/response.js';

/**
 * Rate limiting middleware using Redis
 * @param {number} maxAttempts - Max attempts allowed
 * @param {number} windowSeconds - Time window in seconds
 * @param {string} prefix - Redis key prefix
 */
export const rateLimit = (maxAttempts = 5, windowSeconds = 900, prefix = 'rl') => {
    return async (req, res, next) => {
        try {
            const key = `${prefix}:${req.ip}`;
            const current = await redis.get(key);

            if (current && parseInt(current) >= maxAttempts) {
                const ttl = await redis.ttl(key);
                throw new AppError(
                    `Too many attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`,
                    429
                );
            }

            const pipeline = redis.pipeline();
            pipeline.incr(key);
            if (!current) {
                pipeline.expire(key, windowSeconds);
            }
            await pipeline.exec();

            next();
        } catch (error) {
            if (error instanceof AppError) {
                return next(error);
            }
            // If Redis is down, allow request through
            console.warn('Rate limiter Redis error, allowing request:', error.message);
            next();
        }
    };
};

/**
 * Reset rate limit counter (e.g., after successful login)
 */
export const resetRateLimit = async (ip, prefix = 'rl') => {
    try {
        await redis.del(`${prefix}:${ip}`);
    } catch (error) {
        console.warn('Failed to reset rate limit:', error.message);
    }
};
