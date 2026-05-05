import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate, registerSchema, loginSchema, verifyOtpSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validation.js';
import { rateLimit } from '../../middlewares/rateLimit.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', rateLimit(10, 3600, 'register'), validate(registerSchema), authController.register);
router.post('/verify-otp', rateLimit(10, 300, 'otp'), validate(verifyOtpSchema), authController.verifyOTP);
router.post('/login', rateLimit(5, 900, 'login'), validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/skip-verify', rateLimit(3, 900, 'skip-verify'), authController.skipVerify);
router.post('/forgot-password', rateLimit(3, 3600, 'forgot'), validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, authController.logout);

export default router;
