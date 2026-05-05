import { z } from 'zod';

export const feedbackSchema = z.object({
    requestId: z.string().min(1),
    toUserId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(500).optional(),
    reportType: z.enum(['none', 'no-show', 'fake-request', 'unsafe-behavior']).optional(),
});
