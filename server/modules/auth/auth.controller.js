import authService from './auth.service.js';
import { sendSuccess, sendError, AppError } from '../../utils/response.js';
import { resetRateLimit } from '../../middlewares/rateLimit.middleware.js';

export const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        sendSuccess(res, { statusCode: 201, message: 'Registration successful. OTP sent.', data: result });
    } catch (error) {
        next(error);
    }
};

export const verifyOTP = async (req, res, next) => {
    try {
        const result = await authService.verifyOTP(req.body);

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        sendSuccess(res, {
            message: 'Verification successful',
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);

        if (result.requiresOTP) {
            return sendSuccess(res, {
                message: 'OTP sent for verification',
                data: { requiresOTP: true, email: result.email },
            });
        }

        // Reset rate limit on successful login
        await resetRateLimit(req.ip, 'login');

        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        sendSuccess(res, {
            message: 'Login successful',
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        const result = await authService.refreshToken(refreshToken);

        sendSuccess(res, {
            message: 'Token refreshed',
            data: { accessToken: result.accessToken, user: result.user },
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (req.user && refreshToken) {
            await authService.logout(req.user._id, refreshToken);
        }

        res.clearCookie('refreshToken');
        sendSuccess(res, { message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

export const skipVerify = async (req, res, next) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return next(new AppError('userId is required', 400));
        }
        const result = await authService.skipVerify(userId);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        sendSuccess(res, {
            message: 'Session created — verify your email when ready',
            data: {
                user: result.user,
                accessToken: result.accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const result = await authService.forgotPassword(req.body.email);
        sendSuccess(res, { message: result.message });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const result = await authService.resetPassword(req.body.token, req.body.password);
        sendSuccess(res, { message: result.message });
    } catch (error) {
        next(error);
    }
};
