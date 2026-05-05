import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useTheme } from '../app/ThemeContext';
import {
    Heart, Home, User, Bell, LogOut, Menu, X,
    Droplets, MapPin, Activity, ChevronDown,
    Settings, Shield, Building2, Users, BarChart3,
    AlertTriangle, FileText, ClipboardList, Sun, Moon
} from 'lucide-react';
import VerifyBanner from '../components/VerifyBanner';

const navItems = {
    donor: [
        { to: '/donor/dashboard', label: 'Dashboard', icon: Home },
        { to: '/donor/requests', label: 'Blood Requests', icon: Droplets },
        { to: '/donor/profile', label: 'Profile', icon: User },
        { to: '/donor/history', label: 'Donation History', icon: FileText },
        { to: '/donor/badges', label: 'Badges', icon: Shield },
    ],
    requester: [
        { to: '/requester/dashboard', label: 'Dashboard', icon: Home },
        { to: '/requester/create-request', label: 'New Request', icon: Droplets },
        { to: '/requester/tracking', label: 'Live Tracking', icon: MapPin },
        { to: '/requester/history', label: 'History', icon: FileText },
    ],
    hospital: [
        { to: '/hospital/dashboard', label: 'Dashboard', icon: Home },
        { to: '/hospital/approvals', label: 'Approvals', icon: ClipboardList },
        { to: '/hospital/inventory', label: 'Inventory', icon: Droplets },
        { to: '/hospital/bulk-request', label: 'Bulk Request', icon: AlertTriangle },
    ],
    admin: [
        { to: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/hospitals', label: 'Hospitals', icon: Building2 },
        { to: '/admin/broadcast', label: 'Broadcast', icon: AlertTriangle },
        { to: '/admin/reports', label: 'Reports', icon: FileText },
        { to: '/admin/audit-logs', label: 'Audit Logs', icon: Shield },
    ],
};

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const items = navItems[user?.role] || [];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64" style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--bg-ghost-border)' }}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 h-16" style={{ borderBottom: '1px solid var(--bg-ghost-border)' }}>
                    <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg gradient-text">BloodLink</span>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {items.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-primary-600/15 text-primary-400'
                                    : 'hover:bg-[var(--bg-ghost)]'
                                }`
                            }
                            style={({ isActive }) => ({ color: isActive ? '' : 'var(--text-secondary)' })}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="p-4" style={{ borderTop: '1px solid var(--bg-ghost-border)' }}>
                    <NavLink
                        to="/notifications"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-[var(--bg-ghost)]"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <div className="relative">
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white font-bold">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                        Notifications
                    </NavLink>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm hover:text-red-400 hover:bg-red-500/10 transition-all mt-1 cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="fixed left-0 top-0 bottom-0 w-72 z-50 lg:hidden flex flex-col"
                            style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--bg-ghost-border)' }}
                        >
                            <div className="flex items-center justify-between px-6 h-16" style={{ borderBottom: '1px solid var(--bg-ghost-border)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                                        <Heart className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="font-bold text-lg gradient-text">BloodLink</span>
                                </div>
                                <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <nav className="flex-1 py-4 px-3 space-y-1">
                                {items.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setSidebarOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-primary-600/15 text-primary-400' : 'hover:bg-[var(--bg-ghost)]'
                                            }`
                                        }
                                        style={({ isActive }) => ({ color: isActive ? '' : 'var(--text-secondary)' })}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </NavLink>
                                ))}
                            </nav>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="flex items-center justify-between h-16 px-4 lg:px-8" style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--bg-ghost-border)' }}>
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden cursor-pointer p-2" style={{ color: 'var(--text-secondary)' }}>
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-2 ml-auto">
                        {/* Theme Toggle */}
                        <button onClick={toggleTheme} className="p-2 rounded-xl transition-all cursor-pointer hover:bg-[var(--bg-ghost)]" style={{ color: 'var(--text-secondary)' }}>
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Notifications bell */}
                        <NavLink to="/notifications" className="relative p-2 rounded-xl transition-all hover:bg-[var(--bg-ghost)]" style={{ color: 'var(--text-secondary)' }}>
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] flex items-center justify-center text-white font-bold"
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </motion.span>
                            )}
                        </NavLink>

                        {/* Profile menu */}
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--bg-ghost)] transition-all cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white">
                                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <span className="hidden sm:block text-sm" style={{ color: 'var(--text-primary)' }}>{user?.name}</span>
                                <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            </button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="absolute right-0 top-full mt-2 w-56 glass-card p-2 z-50"
                                    >
                                        <div className="px-3 py-2 mb-1" style={{ borderBottom: '1px solid var(--bg-ghost-border)' }}>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                                            <span className="badge badge-info mt-1 capitalize">{user?.role}</span>
                                        </div>
                                        <NavLink to="/settings" className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all hover:bg-[var(--bg-ghost)]" style={{ color: 'var(--text-secondary)' }} onClick={() => setProfileOpen(false)}>
                                            <Settings className="w-4 h-4" /> Settings
                                        </NavLink>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer">
                                            <LogOut className="w-4 h-4" /> Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Verification banner for unverified users */}
                <VerifyBanner />

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
