import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useTheme } from '../hooks/useTheme';
import { useGetPendingHospitalsQuery } from '../modules/admin/adminApi';
import { ToastContainer, useToast } from '../hooks/useToast';
import {
    LayoutDashboard, Users, Building2, Radio, FileBarChart2,
    ClipboardList, LogOut, Menu, Droplets, ChevronRight,
    Bell, Shield, Activity, Wifi, WifiOff, Heart, MessageSquare,
    Sun, Moon, X, CheckCheck, Trash2, AlertTriangle, Info,
    CheckCircle, Zap, Hospital, UserCheck,
} from 'lucide-react';

const NAV = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/donors', icon: Droplets, label: 'Donors' },
    { to: '/admin/requests', icon: Heart, label: 'Requests', badge: 'requests' },
    { to: '/admin/hospitals', icon: Building2, label: 'Hospitals', badge: 'pending' },
    { to: '/admin/broadcast', icon: Radio, label: 'Broadcast' },
    { to: '/admin/feedback', icon: MessageSquare, label: 'Feedback' },
    { to: '/admin/reports', icon: FileBarChart2, label: 'Reports' },
    { to: '/admin/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
];

/* ── Notification types config ─────────────────────────────── */
const NOTIF_TYPES = {
    hospital_pending: { icon: Hospital, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Hospital Verification' },
    new_request:      { icon: Zap,      color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'New Blood Request' },
    donor_verified:   { icon: UserCheck, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Donor Verified' },
    broadcast:        { icon: Radio,    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Emergency Broadcast' },
    info:             { icon: Info,     color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Info' },
    warning:          { icon: AlertTriangle, color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'Warning' },
    success:          { icon: CheckCircle, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Success' },
};

const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

/* ── Notification Panel ────────────────────────────────────── */
const NotificationPanel = ({ notifications, onMarkRead, onMarkAllRead, onClear, onClearAll, onClose }) => {
    const unread = notifications.filter(n => !n.read).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50 shadow-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--bg-ghost-border)' }}>
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" style={{ color: '#ef4444' }} />
                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</span>
                    {unread > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#ef4444' }}>{unread}</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {unread > 0 && (
                        <button onClick={onMarkAllRead} title="Mark all read"
                            className="p-1.5 rounded-lg cursor-pointer hover:opacity-70"
                            style={{ color: '#3b82f6' }}>
                            <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button onClick={onClearAll} title="Clear all"
                            className="p-1.5 rounded-lg cursor-pointer hover:opacity-70"
                            style={{ color: 'var(--text-muted)' }}>
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All caught up!</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {notifications.map((n) => {
                            const cfg = NOTIF_TYPES[n.type] || NOTIF_TYPES.info;
                            const NIcon = cfg.icon;
                            return (
                                <motion.div key={n.id}
                                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16, height: 0, padding: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                                    onClick={() => onMarkRead(n.id)}
                                    style={{
                                        background: n.read ? 'transparent' : 'rgba(239,68,68,0.03)',
                                        borderLeft: n.read ? '3px solid transparent' : '3px solid #ef4444',
                                        borderBottom: '1px solid var(--bg-ghost-border)',
                                    }}>
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                                        <NIcon className="w-4 h-4" style={{ color: cfg.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-primary)' }}>{n.message}</p>
                                        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{timeAgo(n.timestamp)}</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); onClear(n.id); }}
                                        className="p-1 rounded-lg shrink-0 hover:opacity-70 cursor-pointer"
                                        style={{ color: 'var(--text-muted)' }}>
                                        <X className="w-3 h-3" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="px-4 py-2 border-t text-center" style={{ borderColor: 'var(--bg-ghost-border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {unread} unread · {notifications.length} total
                    </p>
                </div>
            )}
        </motion.div>
    );
};

/* ── AdminLayout ────────────────────────────────────────────── */
const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const toast = useToast();
    const { theme, toggle, isDark } = useTheme();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [pendingBump, setPendingBump] = useState(0);
    const [liveRequests, setLiveRequests] = useState(0);
    const [socketConnected, setSocketConnected] = useState(false);

    // Notification state
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef(null);

    const { data: pendingData, refetch: refetchPending } = useGetPendingHospitalsQuery();
    const pendingCount = (pendingData?.data?.length || 0) + pendingBump;
    const unreadCount = notifications.filter(n => !n.read).length;

    // Close notification panel when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Add notification helper
    const addNotification = useCallback((type, message) => {
        const newNotif = { id: `${Date.now()}-${Math.random()}`, type, message, timestamp: new Date(), read: false };
        setNotifications(prev => [newNotif, ...prev].slice(0, 50)); // cap at 50
        return newNotif;
    }, []);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        setSocketConnected(socket.connected);

        const handleConnect = () => setSocketConnected(true);
        const handleDisconnect = () => setSocketConnected(false);
        const handleStats = (data) => setOnlineCount(data.onlineCount || 0);
        const handleHospitalPending = (data) => {
            setPendingBump(p => p + 1);
            addNotification('hospital_pending', data?.name ? `"${data.name}" submitted for verification` : 'New hospital registration awaiting review');
            toast.info('New hospital registration is waiting for review');
            refetchPending();
        };
        const handleBroadcast = (data) => {
            addNotification('broadcast', data?.message || 'Emergency broadcast activated');
            toast.warning(`Broadcast active: "${data.message?.slice(0, 60)}…"`);
        };
        const handleNewRequest = (data) => {
            setLiveRequests(c => c + 1);
            addNotification('new_request', data?.bloodGroup ? `New ${data.bloodGroup} blood request — ${data.urgency || 'normal'} urgency` : 'New blood request submitted');
        };
        const handleDonorVerified = (data) => {
            addNotification('donor_verified', data?.name ? `${data.name}'s donor profile was verified` : 'A donor profile was verified');
        };
        const handleEmergency = (data) => {
            addNotification('warning', data?.message || 'Emergency alert received');
            toast.error(data?.message || 'Emergency alert!');
        };
        const handleAudit = (data) => {
            if (data?.action?.includes('DELETE') || data?.action?.includes('SUSPEND')) {
                addNotification('warning', `Admin action: ${data.action} on ${data.targetType || 'resource'}`);
            }
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('admin:stats', handleStats);
        socket.on('admin:hospital_pending', handleHospitalPending);
        socket.on('emergency:broadcast', handleBroadcast);
        socket.on('admin:new_request', handleNewRequest);
        socket.on('admin:donor_verified', handleDonorVerified);
        socket.on('admin:emergency', handleEmergency);
        socket.on('admin:audit_entry', handleAudit);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('admin:stats', handleStats);
            socket.off('admin:hospital_pending', handleHospitalPending);
            socket.off('emergency:broadcast', handleBroadcast);
            socket.off('admin:new_request', handleNewRequest);
            socket.off('admin:donor_verified', handleDonorVerified);
            socket.off('admin:emergency', handleEmergency);
            socket.off('admin:audit_entry', handleAudit);
        };
    }, [socket, addNotification]);

    // Notification actions
    const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const clearOne = (id) => setNotifications(prev => prev.filter(n => n.id !== id));
    const clearAll = () => setNotifications([]);

    const handleLogout = () => { logout(); navigate('/login'); };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--bg-ghost-border)' }}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center shadow-lg">
                    <Droplets className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="font-bold text-sm leading-none" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>BloodLink</p>
                    <p className="text-[10px] mt-0.5 font-semibold tracking-widest uppercase" style={{ color: '#ef4444' }}>Admin Panel</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    {socketConnected
                        ? <Wifi className="w-3.5 h-3.5 text-green-400" />
                        : <WifiOff className="w-3.5 h-3.5 text-red-400" />
                    }
                </div>
            </div>

            {/* Online count */}
            {onlineCount > 0 && (
                <div className="mx-3 mt-3 px-3 py-2 rounded-xl flex items-center gap-2"
                    style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-medium text-green-400">{onlineCount} online right now</span>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {NAV.map(({ to, icon: Icon, label, badge }) => (
                    <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200`}
                        style={({ isActive }) => ({
                            background: isActive ? 'linear-gradient(135deg,#dc2626,#e11d48)' : 'transparent',
                            color: isActive ? '#fff' : 'var(--text-secondary)',
                            boxShadow: isActive ? '0 4px 12px rgba(220,38,38,0.25)' : 'none',
                        })}>
                        {({ isActive }) => (
                            <>
                                <Icon className="w-[17px] h-[17px] shrink-0" style={{ color: isActive ? '#fff' : 'var(--text-muted)' }} />
                                <span className="flex-1">{label}</span>
                                {badge === 'pending' && pendingCount > 0 && (
                                    <motion.span key={pendingCount} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                                        className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                                        style={{ background: '#f59e0b' }}>
                                        {pendingCount > 9 ? '9+' : pendingCount}
                                    </motion.span>
                                )}
                                {badge === 'requests' && liveRequests > 0 && (
                                    <motion.span key={liveRequests} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                                        className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                                        style={{ background: '#ef4444' }}>
                                        {liveRequests > 9 ? '9+' : liveRequests}
                                    </motion.span>
                                )}
                                {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Admin profile */}
            <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--bg-ghost-border)' }}>
                <div className="flex items-center gap-3 mb-3 px-1">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Administrator</p>
                    </div>
                </div>
                <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all hover:bg-red-500/10"
                    style={{ color: '#ef4444' }}>
                    <LogOut className="w-4 h-4" />Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base, var(--bg-surface))' }}>
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-ghost-border)' }}>
                <SidebarContent />
            </aside>

            {/* Mobile drawer */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
                        <motion.aside
                            initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed left-0 top-0 bottom-0 w-60 z-50 flex flex-col border-r lg:hidden"
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-ghost-border)' }}>
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* ── Header ── */}
                <header className="flex items-center gap-3 px-4 lg:px-6 py-3 border-b shrink-0"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--bg-ghost-border)' }}>
                    {/* Mobile menu toggle */}
                    <button className="lg:hidden p-2 rounded-lg cursor-pointer" style={{ color: 'var(--text-muted)' }}
                        onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex-1" />

                    {/* Pending badge */}
                    {pendingCount > 0 && (
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <Bell className="w-3.5 h-3.5" />
                            {pendingCount} pending review
                        </div>
                    )}

                    {/* Dark / Light toggle */}
                    <button onClick={toggle}
                        className="relative w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200"
                        style={{ background: 'var(--bg-ghost)', border: '1px solid var(--bg-ghost-border)', color: 'var(--text-secondary)' }}
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div key={theme}
                                initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                                transition={{ duration: 0.2 }}>
                                {isDark
                                    ? <Sun className="w-4 h-4" style={{ color: '#f59e0b' }} />
                                    : <Moon className="w-4 h-4" style={{ color: '#6366f1' }} />
                                }
                            </motion.div>
                        </AnimatePresence>
                    </button>

                    {/* Notification bell */}
                    <div ref={notifRef} className="relative">
                        <button onClick={() => setNotifOpen(v => !v)}
                            className="relative w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200"
                            style={{
                                background: notifOpen ? 'rgba(239,68,68,0.1)' : 'var(--bg-ghost)',
                                border: `1px solid ${notifOpen ? 'rgba(239,68,68,0.3)' : 'var(--bg-ghost-border)'}`,
                                color: notifOpen ? '#ef4444' : 'var(--text-secondary)',
                            }}
                            title="Notifications">
                            <Bell className="w-4 h-4" />
                            {/* Unread badge */}
                            <AnimatePresence>
                                {unreadCount > 0 && (
                                    <motion.span
                                        key={unreadCount}
                                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                                        style={{ background: '#ef4444' }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>

                        {/* Notification dropdown */}
                        <AnimatePresence>
                            {notifOpen && (
                                <NotificationPanel
                                    notifications={notifications}
                                    onMarkRead={markRead}
                                    onMarkAllRead={markAllRead}
                                    onClear={clearOne}
                                    onClearAll={clearAll}
                                    onClose={() => setNotifOpen(false)}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>

            <ToastContainer />
        </div>
    );
};

export default AdminLayout;
