import { z } from 'zod';

export const createRequestSchema = z.object({
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    unitsNeeded: z.number().int().min(1).max(20),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    urgency: z.enum(['normal', 'urgent', 'critical']).optional(),
    district: z.string().min(1),
    formattedAddress: z.string().optional(),
    notes: z.string().max(500).optional(),
    patientName: z.string().min(1),
    contactNumber: z.string().min(5),
    reasonForRequest: z.enum(['Surgery', 'Accident', 'Emergency', 'Other']),
    customReason: z.string().optional(),
    proofDocumentUrl: z.string().url().optional(),
});
