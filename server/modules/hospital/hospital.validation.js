import { z } from 'zod';

export const hospitalProfileSchema = z.object({
    hospitalName: z.string().min(2).max(200),
});

export const verifyDonorSchema = z.object({
    action: z.enum(['approve', 'reject']),
});

export const updateInventorySchema = z.object({
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    units: z.number().int().min(0),
});

export const bulkRequestSchema = z.object({
    requests: z.array(z.object({
        bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
        unitsNeeded: z.number().int().min(1).max(50),
        urgency: z.enum(['normal', 'urgent', 'critical']).optional(),
    })).min(1).max(20),
});
