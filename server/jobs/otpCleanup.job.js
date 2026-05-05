import { Worker } from 'bullmq';
import redis from '../config/redis.js';

const otpCleanupWorker = new Worker(
    'otpCleanup',
    async (job) => {
        console.log('🧹 Running OTP cleanup...');
        // Redis automatically handles TTL expiry for OTP keys
        // This worker can handle any additional cleanup like removing stale sessions
        const keys = await redis.keys('otp:*');
        console.log(`✅ OTP cleanup complete. Active OTP keys: ${keys.length}`);
    },
    { connection: redis }
);

otpCleanupWorker.on('failed', (job, err) => {
    console.error('❌ OTP cleanup failed:', err.message);
});

export default otpCleanupWorker;
