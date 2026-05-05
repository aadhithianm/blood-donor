import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSocket } from './useSocket';
import { useGetNotificationsQuery, notificationApi } from '../modules/notification/notificationApi';

export const useNotifications = () => {
    const { data } = useGetNotificationsQuery(undefined, {
        pollingInterval: 60000, // Fallback poll every 1 minute
    });
    const { socket } = useSocket();
    const dispatch = useDispatch();

    const notifications = data?.data || [];
    const unreadCount = data?.meta?.unreadCount || 0;

    useEffect(() => {
        if (!socket) return;
        
        const handleNewNotification = () => {
            // Invalidate the cache to trigger a quiet refetch
            dispatch(notificationApi.util.invalidateTags(['Notification']));
        };

        socket.on('notification:new', handleNewNotification);
        return () => socket.off('notification:new', handleNewNotification);
    }, [socket, dispatch]);

    return { notifications, unreadCount };
};
