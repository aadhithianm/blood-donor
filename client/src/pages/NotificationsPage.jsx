import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation, useDeleteNotificationMutation } from '../modules/notification/notificationApi';
import { DashboardSkeleton } from './../components/Skeletons';

const NotificationsPage = () => {
    const { user } = useAuth();
    const { data: notificationsData, isLoading } = useGetNotificationsQuery();
    const [markAsRead] = useMarkAsReadMutation();
    const [markAllAsRead] = useMarkAllAsReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();

    const notifications = notificationsData?.data || [];

    const handleMarkRead = async (id) => {
        try { await markAsRead(id).unwrap(); } catch (err) { console.error(err); }
    };

    const handleMarkAllRead = async () => {
        try { await markAllAsRead().unwrap(); } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        try { await deleteNotification(id).unwrap(); } catch (err) { console.error(err); }
    };

    const typeColors = {
        request: 'text-red-400', emergency: 'text-amber-400', verification: 'text-blue-400',
        feedback: 'text-green-400', update: 'text-purple-400', system: 'text-zinc-400',
    };

    if (isLoading) return <DashboardSkeleton />;

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="w-6 h-6 text-primary-400" /> Notifications</h1>
                {notifications.some((n) => !n.isRead) && (
                    <button onClick={handleMarkAllRead} className="btn-ghost text-sm flex items-center gap-1"><CheckCheck className="w-4 h-4" /> Mark all read</button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-16 text-zinc-500"><Bell className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No notifications yet</p></div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n, i) => (
                        <motion.div
                            key={n._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={`glass-card p-4 flex items-start gap-4 ${!n.isRead ? 'border-l-2 border-l-primary-500' : ''}`}
                        >
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.isRead ? 'bg-primary-500' : 'bg-transparent'}`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium uppercase ${typeColors[n.type] || 'text-zinc-400'}`}>{n.type}</span>
                                    <span className="text-xs text-zinc-600">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                                </div>
                                <p className="font-medium mt-1">{n.title}</p>
                                <p className="text-sm text-zinc-400 mt-0.5">{n.body}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {!n.isRead && (
                                    <button onClick={() => handleMarkRead(n._id)} className="p-1.5 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer text-zinc-500 hover:text-green-400" title="Mark as read">
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => handleDelete(n._id)} className="p-1.5 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer text-zinc-500 hover:text-red-400" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
