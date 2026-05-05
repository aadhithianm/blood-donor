import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetAdminRequestsQuery, useFindMatchingDonorsQuery, useNotifyMatchingDonorsMutation } from '../adminApi';
import { useSocket } from '../../../hooks/useSocket';
import { useToast } from '../../../hooks/useToast';
import { SkeletonTableRow } from '../../../components/Skeletons';
import { AlertTriangle, Zap, ChevronLeft, ChevronRight, Users, Bell, X, Loader2, MapPin, Phone, RefreshCw } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const BG_COLOR = { 'O+': '#ef4444', 'O-': '#dc2626', 'A+': '#3b82f6', 'A-': '#2563eb', 'B+': '#22c55e', 'B-': '#16a34a', 'AB+': '#8b5cf6', 'AB-': '#7c3aed' };

const URGENCY = {
    critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', rowBg: 'rgba(239,68,68,0.04)', border: '#ef4444' },
    urgent:   { label: 'Urgent',   color: '#f97316', bg: 'rgba(249,115,22,0.12)', rowBg: 'rgba(249,115,22,0.025)', border: '#f97316' },
    normal:   { label: 'Normal',   color: '#71717a', bg: 'rgba(113,113,122,0.08)', rowBg: 'transparent', border: 'transparent' },
};

const STATUS_STYLE = {
    pending:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    accepted:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    'in-progress': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    completed:   { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    expired:     { color: '#71717a', bg: 'rgba(113,113,122,0.1)' },
    cancelled:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const DonorMatchModal = ({ requestId, requestInfo, onClose }) => {
    const { data, isLoading } = useFindMatchingDonorsQuery(requestId);
    const [notify, { isLoading: notifying }] = useNotifyMatchingDonorsMutation();
    const toast = useToast();
    const donors = data?.data?.donors || [];

    const handleNotify = async () => {
        try {
            const res = await notify(requestId).unwrap();
            toast.success(`Notified ${res.data?.notified || donors.length} donors`);
            onClose();
        } catch { toast.error('Failed to send notifications'); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
                className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)', maxHeight: '78vh' }}>
                <div className="flex items-center justify-between p-5 shrink-0" style={{ borderBottom: '1px solid var(--bg-ghost-border)' }}>
                    <div>
                        <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Matching Donors</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {requestInfo.bloodGroup} · {requestInfo.unitsNeeded} units · {requestInfo.urgency}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="overflow-y-auto p-4 space-y-2 flex-1">
                    {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--bg-ghost)' }} />
                    )) : donors.length === 0 ? (
                        <div className="py-10 text-center">
                            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No available donors</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>No {requestInfo.bloodGroup} donors are currently available</p>
                        </div>
                    ) : donors.map((d, i) => (
                        <motion.div key={d._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: 'var(--bg-ghost)', border: '1px solid var(--bg-ghost-border)' }}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                {d.userId?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{d.userId?.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {d.userId?.mobile && <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}><Phone className="w-3 h-3" />{d.userId.mobile}</span>}
                                </div>
                            </div>
                            <span className="font-bold text-xs px-2 py-1 rounded-lg shrink-0"
                                style={{ background: BG_COLOR[d.bloodGroup] ? `${BG_COLOR[d.bloodGroup]}18` : 'var(--bg-ghost)', color: BG_COLOR[d.bloodGroup] || '#ef4444' }}>
                                {d.bloodGroup}
                            </span>
                        </motion.div>
                    ))}
                </div>
                <div className="p-4 shrink-0 flex items-center justify-between" style={{ borderTop: '1px solid var(--bg-ghost-border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{donors.length} eligible donor{donors.length !== 1 ? 's' : ''}</p>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
                            style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>Cancel</button>
                        {donors.length > 0 && (
                            <button onClick={handleNotify} disabled={notifying}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                                style={{ background: 'linear-gradient(135deg,#dc2626,#e11d48)', color: '#fff' }}>
                                {notifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                                Notify All
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
};

const RequestsPage = () => {
    const [page, setPage] = useState(1);
    const [urgency, setUrgency] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [status, setStatus] = useState('');
    const [district, setDistrict] = useState('');
    const [matchModal, setMatchModal] = useState(null);
    const [liveCount, setLiveCount] = useState(0);
    const { socket } = useSocket();
    const toast = useToast();

    const { data, isLoading, refetch, isFetching } = useGetAdminRequestsQuery({ page, limit: 15, urgency, bloodGroup, status, district });
    const requests = data?.data || [];
    const pagination = data?.pagination;

    useEffect(() => {
        if (!socket) return;
        const handler = () => setLiveCount(c => c + 1);
        socket.on('admin:new_request', handler);
        return () => socket.off('admin:new_request', handler);
    }, [socket]);

    const critCount = requests.filter(r => r.urgency === 'critical').length;
    const urgentCount = requests.filter(r => r.urgency === 'urgent').length;
    const normalCount = requests.filter(r => r.urgency === 'normal').length;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Blood Requests</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {pagination?.total ?? '—'} total
                        {liveCount > 0 && <span className="ml-2 text-green-400 font-medium">· +{liveCount} new</span>}
                    </p>
                </div>
                <button onClick={() => { refetch(); setLiveCount(0); }} disabled={isFetching}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
                    style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />Refresh
                </button>
            </div>

            {/* Urgency summary cards */}
            <div className="grid grid-cols-3 gap-3">
                {[['critical', 'Critical', '#ef4444', critCount], ['urgent', 'Urgent', '#f97316', urgentCount], ['normal', 'Normal', '#71717a', normalCount]].map(([u, label, color, count]) => (
                    <button key={u} onClick={() => setUrgency(u === urgency ? '' : u)}
                        className="p-3 rounded-xl text-left cursor-pointer transition-all"
                        style={{ background: urgency === u ? `${color}12` : 'var(--bg-ghost)', border: `1px solid ${urgency === u ? color + '30' : 'var(--bg-ghost-border)'}` }}>
                        <p className="text-xl font-bold" style={{ color: urgency === u ? color : 'var(--text-primary)' }}>{count}</p>
                        <p className="text-xs mt-0.5 font-medium" style={{ color }}>{label}</p>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <div className="flex gap-1 flex-wrap">
                    <button onClick={() => setBloodGroup('')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                        style={{ background: !bloodGroup ? 'linear-gradient(135deg,#dc2626,#e11d48)' : 'var(--bg-ghost)', color: !bloodGroup ? '#fff' : 'var(--text-muted)', border: `1px solid ${!bloodGroup ? '#dc2626' : 'var(--bg-ghost-border)'}` }}>All</button>
                    {BLOOD_GROUPS.map(bg => (
                        <button key={bg} onClick={() => setBloodGroup(bg === bloodGroup ? '' : bg)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                            style={{ background: bloodGroup === bg ? `${BG_COLOR[bg]}20` : 'var(--bg-ghost)', color: bloodGroup === bg ? BG_COLOR[bg] : 'var(--text-muted)', border: `1px solid ${bloodGroup === bg ? BG_COLOR[bg] + '40' : 'var(--bg-ghost-border)'}` }}>
                            {bg}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {['', 'pending', 'accepted', 'in-progress', 'completed', 'expired', 'cancelled'].map(s => (
                    <button key={s} onClick={() => setStatus(s === status ? '' : s)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer capitalize"
                        style={{ background: status === s && s ? 'var(--bg-ghost)' : 'transparent', color: 'var(--text-muted)', border: `1px solid ${status === s && s ? 'var(--bg-input-border)' : 'var(--bg-ghost-border)'}` }}>
                        {s || 'All Status'}
                    </button>
                ))}
                <input value={district} onChange={e => setDistrict(e.target.value)} placeholder="Filter by district…"
                    className="px-3 py-1.5 rounded-lg text-xs outline-none"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)', color: 'var(--text-primary)', minWidth: 140 }} />
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--bg-ghost-border)', background: 'var(--bg-surface)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--bg-ghost-border)', background: 'var(--bg-ghost)' }}>
                                {['Urgency', 'Blood', 'Units', 'Requester', 'District', 'Status', 'Time', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading
                                ? Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} cols={8} />)
                                : requests.map((req, i) => {
                                    const urg = URGENCY[req.urgency] || URGENCY.normal;
                                    const st = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
                                    return (
                                        <motion.tr key={req._id}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                            style={{ borderBottom: '1px solid var(--bg-ghost-border)', background: urg.rowBg, borderLeft: `3px solid ${req.urgency !== 'normal' ? urg.border : 'transparent'}` }}>
                                            <td className="px-4 py-3">
                                                <span className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg w-fit" style={{ background: urg.bg, color: urg.color }}>
                                                    {req.urgency === 'critical' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                                                    {req.urgency === 'critical' && <AlertTriangle className="w-3 h-3" />}
                                                    {req.urgency === 'urgent' && <Zap className="w-3 h-3" />}
                                                    {urg.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-sm px-2 py-1 rounded-lg"
                                                    style={{ background: BG_COLOR[req.bloodGroup] ? `${BG_COLOR[req.bloodGroup]}18` : 'var(--bg-ghost)', color: BG_COLOR[req.bloodGroup] || '#ef4444' }}>
                                                    {req.bloodGroup}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                {req.unitsFulfilled}/{req.unitsNeeded}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{req.requesterId?.name || '—'}</p>
                                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{req.requesterId?.email}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{req.location?.district || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-semibold px-2 py-1 rounded-lg capitalize" style={{ color: st.color, background: st.bg }}>{req.status}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(req.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => setMatchModal(req)}
                                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:opacity-80"
                                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                    <Users className="w-3 h-3" />Match
                                                </button>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            }
                            {!isLoading && requests.length === 0 && (
                                <tr><td colSpan={8} className="py-14 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No requests found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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

            <AnimatePresence>
                {matchModal && <DonorMatchModal requestId={matchModal._id} requestInfo={matchModal} onClose={() => setMatchModal(null)} />}
            </AnimatePresence>
        </div>
    );
};

export default RequestsPage;
