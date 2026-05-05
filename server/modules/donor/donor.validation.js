import { z } from 'zod';

export const donorProfileSchema = z.object({
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
});

export const availabilitySchema = z.object({
    availability: z.enum(['available', 'unavailable', 'on-cooldown']),
});
