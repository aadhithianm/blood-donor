import { Queue } from 'bullmq';
import redis from './redis.js';

const defaultOpts = {
    connection: redis,
};

export const requestExpiryQueue = new Queue('requestExpiry', defaultOpts);
export const donorReassignQueue = new Queue('donorReassign', defaultOpts);
export const otpCleanupQueue = new Queue('otpCleanup', defaultOpts);
export const reportGenerationQueue = new Queue('reportGeneration', defaultOpts);

export default { requestExpiryQueue, donorReassignQueue, otpCleanupQueue, reportGenerationQueue };
