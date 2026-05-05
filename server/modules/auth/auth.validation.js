import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    mobile: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128),
    role: z.enum(['donor', 'requester', 'hospital', 'admin'], {
        errorMap: () => ({ message: 'Role must be donor, requester, hospital, or admin' }),
    }),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    deviceId: z.string().optional(),
});

export const verifyOtpSchema = z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    purpose: z.enum(['registration', 'login']).optional().default('registration'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token required'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        error.name = 'ZodError';
        next(error);
    }
};
