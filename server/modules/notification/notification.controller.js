import notificationService from './notification.service.js';
import { sendSuccess } from '../../utils/response.js';

export const getNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const result = await notificationService.getNotifications(req.user._id, parseInt(page), parseInt(limit));
        sendSuccess(res, { data: result.notifications, pagination: result.pagination, meta: { unreadCount: result.unreadCount } });
    } catch (error) { next(error); }
};

export const markAsRead = async (req, res, next) => {
    try {
        const notification = await notificationService.markAsRead(req.user._id, req.params.id);
        sendSuccess(res, { message: 'Marked as read', data: notification });
    } catch (error) { next(error); }
};

export const markAllAsRead = async (req, res, next) => {
    try {
        await notificationService.markAllAsRead(req.user._id);
        sendSuccess(res, { message: 'All notifications marked as read' });
    } catch (error) { next(error); }
};

export const deleteNotification = async (req, res, next) => {
    try {
        await notificationService.deleteNotification(req.user._id, req.params.id);
        sendSuccess(res, { message: 'Notification deleted' });
    } catch (error) { next(error); }
};
