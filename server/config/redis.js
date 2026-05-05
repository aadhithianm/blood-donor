import Redis from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required for BullMQ
    retryStrategy: (times) => {
        if (times > 3) {
            console.warn('⚠️  Redis connection failed after 3 retries, continuing without Redis');
            return null;
        }
        return Math.min(times * 200, 2000);
    },
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.warn('⚠️  Redis error:', err.message));

export default redis;
