import { z } from 'zod';

export const broadcastSchema = z.object({
    message: z.string().min(1).max(500),
    scope: z.enum(['all', 'city']).optional().default('all'),
    city: z.string().optional(),
});

export const verifyHospitalSchema = z.object({
    action: z.enum(['approve', 'reject']),
});
