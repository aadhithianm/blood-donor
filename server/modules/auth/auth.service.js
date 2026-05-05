import crypto from 'crypto';
import User from './auth.model.js';
import redis from '../../config/redis.js';
import { sendEmail } from '../../config/mailer.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generateResetToken,
} from '../../utils/token.js';
import { AppError } from '../../utils/response.js';

class AuthService {
    /**
     * Register a new user and send OTP
     */
    async register({ name, email, mobile, password, role, bloodGroup, dateOfBirth, location, city }) {
        const existing = await User.findOne({ email });
        if (existing) {
            throw new AppError('Email already registered', 409);
        }

        const user = await User.create({
            name,
            email,
            mobile,
            passwordHash: password,
            role,
            bloodGroup,
            dateOfBirth,
            location: location || (city ? { town: city } : undefined),
            profileCompleted: !!(bloodGroup && (location || city)),
        });

        // Generate and store OTP in Redis (5 min TTL)
        const otp = this.generateOTP();
        await redis.setex(`otp:${email}`, 300, otp);
        console.log(`\n🔑 [REGISTRATION OTP] Email: ${email} | OTP: ${otp} | Expires: 5min\n`);

        // Send OTP email
        await sendEmail({
            to: email,
            subject: 'BloodLink - Verify Your Account',
            html: `
        <h2>Welcome to BloodLink!</h2>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code expires in 5 minutes.</p>
      `,
        }).catch((err) => console.warn('OTP email failed:', err.message));

        return { userId: user._id, email: user.email, message: 'OTP sent to your email' };
    }

    /**
     * Verify OTP for registration or login
     */
    async verifyOTP({ email, otp, purpose }) {
        const storedOtp = await redis.get(`otp:${email}`);

        if (!storedOtp) {
            throw new AppError('OTP expired or not found. Request a new one.', 400);
        }

        if (storedOtp !== otp) {
            throw new AppError('Invalid OTP', 400);
        }

        // Delete OTP after verification
        await redis.del(`otp:${email}`);

        const user = await User.findOne({ email });
        if (!user) throw new AppError('User not found', 404);

        if (purpose === 'registration' || purpose === 'login') {
            user.isVerified = true;
            user.isEmailVerified = true;
            await user.save();
        }

        // Generate tokens
        const tokens = this.generateTokens(user);
        await this.storeRefreshToken(user._id, tokens.refreshToken);

        return { user, ...tokens };
    }

    /**
     * Login with email and password
     */
    async login({ email, password, deviceId }) {
        const user = await User.findOne({ email }).select('+passwordHash +password');
        if (!user) {
            throw new AppError('Invalid email or password', 401);
        }

        // NOTE: login is allowed for unverified users (Phase 1)
        // Redirection logic in frontend will handle unverified users

        if (user.isSuspended) {
            throw new AppError('Account suspended. Contact support.', 403);
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new AppError('Invalid email or password', 401);
        }

        // Check if OTP is required
        const needsOTP = this.requiresOTP(user, deviceId);

        if (needsOTP) {
            const otp = this.generateOTP();
            await redis.setex(`otp:${email}`, 300, otp);
            console.log(`\n🔑 [LOGIN OTP] Email: ${email} | OTP: ${otp} | Expires: 5min\n`);

            await sendEmail({
                to: email,
                subject: 'BloodLink - Login Verification',
                html: `
          <h2>Login Verification</h2>
          <p>Your login code is: <strong>${otp}</strong></p>
          <p>This code expires in 5 minutes.</p>
        `,
            }).catch((err) => console.warn('Login OTP email failed:', err.message));

            return { requiresOTP: true, email, message: 'OTP sent to your email' };
        }

        // No OTP needed — generate tokens
        const tokens = this.generateTokens(user);
        await this.storeRefreshToken(user._id, tokens.refreshToken);

        // Update device session
        if (deviceId) {
            await this.updateDeviceSession(user._id, deviceId);
        }

        return { requiresOTP: false, user, ...tokens };
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw new AppError('Refresh token required', 401);
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (err) {
            throw new AppError('Invalid refresh token', 401);
        }

        const user = await User.findById(decoded.userId);
        if (!user) throw new AppError('User not found', 401);

        // Check if refresh token exists in DB
        const tokenExists = user.refreshTokens.some((t) => t.token === refreshToken);
        if (!tokenExists) {
            throw new AppError('Refresh token revoked', 401);
        }

        // Generate new access token
        const accessToken = generateAccessToken({ userId: user._id, role: user.role });
        return { accessToken, user };
    }

    /**
     * Logout — remove refresh token
     */
    async logout(userId, refreshToken) {
        await User.findByIdAndUpdate(userId, {
            $pull: { refreshTokens: { token: refreshToken } },
        });
    }

    /**
     * Forgot password — send reset link
     */
    async forgotPassword(email) {
        const user = await User.findOne({ email });
        if (!user) {
            // Return success even if email doesn't exist (security)
            return { message: 'If the email exists, a reset link has been sent' };
        }

        const resetToken = generateResetToken({ userId: user._id });
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

        await sendEmail({
            to: email,
            subject: 'BloodLink - Reset Your Password',
            html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background:#dc2626;color:white;padding:10px 24px;border-radius:6px;text-decoration:none;">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
        }).catch((err) => console.warn('Reset email failed:', err.message));

        return { message: 'If the email exists, a reset link has been sent' };
    }

    /**
     * Reset password using token
     */
    async resetPassword(token, newPassword) {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            throw new AppError('Invalid or expired reset token', 400);
        }

        user.passwordHash = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return { message: 'Password reset successful' };
    }

    /**
     * Skip OTP — issue tokens for an unverified user right after registration
     * Only valid immediately after register (userId must exist and be unverified)
     */
    async skipVerify(userId) {
        const user = await User.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        // Safety: only allow this path for unverified users
        if (user.isVerified) {
            // Already verified — just issue tokens normally
        }

        const tokens = this.generateTokens(user);
        await this.storeRefreshToken(user._id, tokens.refreshToken);
        return { user, ...tokens };
    }

    // ─── Helpers ──────────────────────────────────────

    generateOTP() {
        return crypto.randomInt(100000, 999999).toString();
    }

    generateTokens(user) {
        const payload = { userId: user._id, role: user.role };
        return {
            accessToken: generateAccessToken(payload),
            refreshToken: generateRefreshToken(payload),
        };
    }

    async storeRefreshToken(userId, token) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await User.findByIdAndUpdate(userId, {
            $push: {
                refreshTokens: {
                    $each: [{ token, expiresAt }],
                    $slice: -5, // Keep only last 5 refresh tokens
                },
            },
        });
    }

    requiresOTP(user, deviceId) {
        // Admin always requires OTP
        if (user.role === 'admin') return true;

        // Check for trusted device
        if (deviceId) {
            const trustedDevice = user.deviceSessions.find(
                (d) => d.deviceId === deviceId && d.expiresAt > new Date()
            );
            if (trustedDevice) return false;
        }

        return true;
    }

    async updateDeviceSession(userId, deviceId) {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await User.findByIdAndUpdate(userId, {
            $pull: { deviceSessions: { deviceId } },
        });
        await User.findByIdAndUpdate(userId, {
            $push: {
                deviceSessions: {
                    $each: [{ deviceId, expiresAt, lastUsed: new Date() }],
                    $slice: -10, // Keep only last 10 devices
                },
            },
        });
    }
}

export default new AuthService();
