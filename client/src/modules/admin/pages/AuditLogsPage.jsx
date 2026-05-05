import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetAuditLogsQuery } from '../adminApi';
import { useSocket } from '../../../hooks/useSocket';
import { SkeletonTableRow } from '../../../components/Skeletons';
import { ClipboardList, ChevronLeft, ChevronRight, Loader2, RefreshCw, Zap } from 'lucide-react';

const ACTION_STYLES = {
    login: { label: 'Login', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    logout: { label: 'Logout', color: '#71717a', bg: 'rgba(113,113,122,0.1)' },
    register: { label: 'Register', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    password_reset: { label: 'Pwd Reset', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    profile_update: { label: 'Profile Update', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    verification_approve: { label: 'Approved', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    verification_reject: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    user_suspend: { label: 'Suspended', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    user_activate: { label: 'Activated', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    user_delete: { label: 'Deleted', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    emergency_broadcast: { label: 'Broadcast', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    report_generated: { label: 'Report', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
};

const AuditLogsPage = () => {
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('');
    const [liveCount, setLiveCount] = useState(0);
    const [liveEntries, setLiveEntries] = useState([]);

    const { data, isLoading, refetch, isFetching } = useGetAuditLogsQuery(
        { page, limit: 25, action: actionFilter || undefined },
    );
    const { socket } = useSocket();

    // Real-time streaming via socket
    useEffect(() => {
        if (!socket) return;
        const handler = (entry) => {
            if (page === 1 && (!actionFilter || actionFilter === entry.action)) {
                setLiveEntries(prev => [entry, ...prev].slice(0, 5));
                setLiveCount(c => c + 1);
            }
        };
        socket.on('admin:audit_entry', handler);
        return () => socket.off('admin:audit_entry', handler);
    }, [socket, page, actionFilter]);

    // Clear live entries on filter/page change
    useEffect(() => { setLiveEntries([]); setLiveCount(0); }, [page, actionFilter]);

    const logs = data?.data || [];
    const pagination = data?.pagination;
    const allLog = actionFilter ? liveEntries.filter(e => e.action === actionFilter) : liveEntries;

    const LogRow = ({ log, isLive }) => {
        const style = ACTION_STYLES[log.action] || { label: log.action, color: 'var(--text-muted)', bg: 'var(--bg-ghost)' };
        const dt = new Date(log.createdAt);
        return (
            <motion.tr
                initial={{ opacity: 0, backgroundColor: isLive ? 'rgba(34,197,94,0.06)' : 'transparent' }}
                animate={{ opacity: 1, backgroundColor: 'transparent' }}
                transition={{ duration: isLive ? 1.5 : 0.2 }}
                style={{ borderBottom: '1px solid var(--bg-ghost-border)' }}
            >
                <td className="px-4 py-3 whitespace-nowrap">
                    {isLive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block mr-2 animate-pulse" />}
                    <p className="text-xs font-medium inline" style={{ color: 'var(--text-primary)' }}>
                        {dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                </td>
                <td className="px-4 py-3">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{log.userId?.name || '—'}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{log.userId?.email}</p>
                </td>
                <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ color: style.color, background: style.bg }}>
                        {style.label}
                    </span>
                </td>
                <td className="px-4 py-3 max-w-[220px]">
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }} title={log.details}>{log.details || '—'}</p>
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{log.ip || '—'}</td>
            </motion.tr>
        );
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Audit Logs</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {pagination?.total ?? '—'} total entries
                        {liveCount > 0 && <span className="ml-2 text-green-400 font-medium">· +{liveCount} live</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: 'rgba(34,197,94,0.07)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <Zap className="w-3 h-3" />Real-time stream
                    </div>
                    <button onClick={() => { refetch(); setLiveEntries([]); setLiveCount(0); }} disabled={isFetching}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
                        style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>
                        <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <button onClick={() => { setActionFilter(''); setPage(1); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                    style={{ background: !actionFilter ? 'linear-gradient(135deg,#dc2626,#e11d48)' : 'var(--bg-ghost)', color: !actionFilter ? '#fff' : 'var(--text-secondary)', border: `1px solid ${!actionFilter ? '#dc2626' : 'var(--bg-ghost-border)'}` }}>
                    All
                </button>
                {Object.entries(ACTION_STYLES).map(([a, s]) => (
                    <button key={a} onClick={() => { setActionFilter(a); setPage(1); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                        style={{ background: actionFilter === a ? s.bg : 'var(--bg-ghost)', color: actionFilter === a ? s.color : 'var(--text-muted)', border: `1px solid ${actionFilter === a ? s.color + '40' : 'var(--bg-ghost-border)'}` }}>
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--bg-ghost-border)', background: 'var(--bg-surface)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--bg-ghost-border)', background: 'var(--bg-ghost)' }}>
                                {['Timestamp', 'Admin', 'Action', 'Details', 'IP'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Live entries at top */}
                            <AnimatePresence>
                                {allLog.map(e => <LogRow key={e._id || e.createdAt} log={e} isLive={true} />)}
                            </AnimatePresence>
                            {/* Paginated historical entries */}
                            {isLoading
                                ? Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} cols={5} />)
                                : logs.map((log, i) => <LogRow key={log._id} log={log} isLive={false} />)
                            }
                            {!isLoading && logs.length === 0 && allLog.length === 0 && (
                                <tr><td colSpan={5} className="py-16 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No audit entries yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {pagination.page} of {pagination.pages}</p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                            className="p-2 rounded-lg cursor-pointer disabled:opacity-40"
                            style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.pages}
                            className="p-2 rounded-lg cursor-pointer disabled:opacity-40"
                            style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogsPage;
