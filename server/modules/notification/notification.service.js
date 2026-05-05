import Notification from './notification.model.js';
import User from '../auth/auth.model.js';
import { sendEmail } from '../../config/mailer.js';
import { sendSMS, sendWhatsApp } from '../../config/twilio.js';
import { getIO } from '../../sockets/index.js';
import { AppError } from '../../utils/response.js';

class NotificationService {
    /**
     * Send notification via all enabled channels
     */
    async dispatch({ userId, type, title, body, metadata, isCritical = false }) {
        const user = await User.findById(userId);
        if (!user) return;

        const prefs = user.notificationPrefs;
        const categoryKey = type === 'request' ? 'requests'
            : type === 'verification' ? 'verification'
                : type === 'emergency' ? 'criticalAlerts'
                    : 'updates';

        const categoryEnabled = prefs.categories?.[categoryKey] !== false;

        // In-app always (if enabled or critical)
        if (prefs.inApp || isCritical) {
            const notification = await Notification.create({
                userId, type, channel: 'in-app', title, body, metadata,
            });

            // Real-time delivery via socket
            try {
                const io = getIO();
                io.to(`user:${userId}`).emit('notification:new', notification);
            } catch (err) {
                // Socket not available
            }
        }

        // Email
        if ((prefs.email && categoryEnabled) || isCritical) {
            sendEmail({ to: user.email, subject: title, html: `<h3>${title}</h3><p>${body}</p>` })
                .catch((err) => console.warn('Notification email failed:', err.message));
        }

        // SMS
        if ((prefs.sms && categoryEnabled) || isCritical) {
            if (user.mobile) {
                sendSMS(user.mobile, `${title}: ${body}`)
                    .catch((err) => console.warn('Notification SMS failed:', err.message));
            }
        }

        // WhatsApp
        if ((prefs.whatsapp && categoryEnabled) || isCritical) {
            if (user.mobile) {
                sendWhatsApp(user.mobile, `*${title}*\n${body}`)
                    .catch((err) => console.warn('Notification WhatsApp failed:', err.message));
            }
        }
    }

    async getNotifications(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find({ userId, channel: 'in-app' })
                .sort({ createdAt: -1 }).skip(skip).limit(limit),
            Notification.countDocuments({ userId, channel: 'in-app' }),
            Notification.countDocuments({ userId, channel: 'in-app', isRead: false }),
        ]);

        return {
            notifications,
            unreadCount,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }

    async getRecentNotifications(userId, limit = 10) {
        return Notification.find({ userId, channel: 'in-app' })
            .sort({ createdAt: -1 }).limit(limit);
    }

    async markAsRead(userId, notificationId) {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true },
            { new: true }
        );
        if (!notification) throw new AppError('Notification not found', 404);
        return notification;
    }

    async markAllAsRead(userId) {
        await Notification.updateMany(
            { userId, isRead: false, channel: 'in-app' },
            { isRead: true }
        );
    }

    async deleteNotification(userId, notificationId) {
        const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });
        if (!notification) throw new AppError('Notification not found', 404);
    }
}

export default new NotificationService();
