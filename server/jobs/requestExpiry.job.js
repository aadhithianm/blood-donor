import { Worker } from 'bullmq';
import redis from '../config/redis.js';
import requestService from '../modules/request/request.service.js';

const requestExpiryWorker = new Worker(
    'requestExpiry',
    async (job) => {
        const { requestId } = job.data;
        console.log(`⏰ Processing request expiry: ${requestId}`);
        await requestService.expireRequest(requestId);
        console.log(`✅ Request ${requestId} expired`);
    },
    { connection: redis }
);

requestExpiryWorker.on('failed', (job, err) => {
    console.error(`❌ Request expiry job failed for ${job?.data?.requestId}:`, err.message);
});

export default requestExpiryWorker;
