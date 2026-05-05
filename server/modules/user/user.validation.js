import { z } from 'zod';

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    mobile: z.string().optional(),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    dateOfBirth: z.any().optional(),
    availability: z.boolean().optional(),
    profileCompleted: z.boolean().optional(),
    location: z.any().optional(),
    notificationPrefs: z.object({
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
        whatsapp: z.boolean().optional(),
        inApp: z.boolean().optional(),
        categories: z.object({
            requests: z.boolean().optional(),
            updates: z.boolean().optional(),
            verification: z.boolean().optional(),
            criticalAlerts: z.boolean().optional(),
        }).optional(),
    }).optional(),
});

export const updateLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    country: z.string().optional(),
    state: z.string().optional(),
    district: z.string().optional(),
    town: z.string().optional(),
    village: z.string().optional(),
    formattedAddress: z.string().optional(),
});
