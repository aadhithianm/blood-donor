import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useGetAdminDonorsQuery, useGetDonorLeaderboardQuery,
    useVerifyAdminDonorMutation, useRejectAdminDonorMutation,
} from '../adminApi';
import { useToast } from '../../../hooks/useToast';
import { SkeletonTableRow } from '../../../components/Skeletons';
import {
    Droplets, Trophy, Search, ChevronLeft, ChevronRight,
    CheckCircle, XCircle, Clock, Loader2, Medal, Star,
    AlertTriangle, X, ShieldCheck, ShieldX,
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const BG_COLOR = {
    'O+': '#ef4444', 'O-': '#dc2626', 'A+': '#3b82f6', 'A-': '#2563eb',
    'B+': '#22c55e', 'B-': '#16a34a', 'AB+': '#8b5cf6', 'AB-': '#7c3aed',
};

const AVAILABILITY_BADGE = {
    available: { label: 'Available', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    'on-cooldown': { label: 'On Cooldown', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    unavailable: { label: 'Unavailable', color: '#71717a', bg: 'rgba(113,113,122,0.1)' },
};

const VERIFY_BADGE = {
    approved: { label: 'Verified', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', Icon: ShieldCheck },
    rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', Icon: ShieldX },
    pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', Icon: Clock },
};

const EligibilityBadge = ({ donor }) => {
    if (donor.verificationStatus !== 'approved') {
        return <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>Unverified</span>;
    }
    if (donor.availability === 'on-cooldown' && donor.cooldownUntil) {
        const daysLeft = Math.ceil((new Date(donor.cooldownUntil) - Date.now()) / (1000 * 60 * 60 * 24));
        return <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>Cooldown · {daysLeft}d left</span>;
    }
    if (donor.availability === 'available') {
        return <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>Eligible</span>;
    }
    return <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(113,113,122,0.1)', color: '#71717a' }}>Unavailable</span>;
};

const ConfirmModal = ({ title, message, confirmLabel, danger, onConfirm, onCancel, loading }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }}>
                <AlertTriangle className="w-6 h-6" style={{ color: danger ? '#ef4444' : '#22c55e' }} />
            </div>
            <h3 className="text-base font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            <div className="flex gap-3">
                <button onClick={onCancel} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                    style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>Cancel</button>
                <button onClick={onConfirm} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
                    style={{ background: danger ? '#dc2626' : '#22c55e', color: '#fff' }}>
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{confirmLabel}
                </button>
            </div>
        </motion.div>
    </motion.div>
);

/* ── Leaderboard Tab ─────────────────────────────────────────── */
const LeaderboardTab = () => {
    const { data, isLoading } = useGetDonorLeaderboardQuery();
    const leaders = data?.data || [];
    const MEDALS = ['🥇', '🥈', '🥉'];
    return (
        <div className="space-y-3">
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--bg-ghost)' }} />
            )) : leaders.map((d, i) => (
                <motion.div key={d._id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-3.5 rounded-xl"
                    style={{ background: i < 3 ? `rgba(239,68,68,${0.06 - i * 0.015})` : 'var(--bg-ghost)', border: `1px solid ${i < 3 ? 'rgba(239,68,68,0.15)' : 'var(--bg-ghost-border)'}` }}>
                    <span className="text-xl w-7 shrink-0 text-center">{i < 3 ? MEDALS[i] : `${i + 1}`}</span>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                        {d.userId?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{d.userId?.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.userId?.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-base font-bold" style={{ color: i === 0 ? '#f59e0b' : 'var(--text-primary)' }}>{d.totalDonations}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>donations</p>
                    </div>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: BG_COLOR[d.bloodGroup] ? `${BG_COLOR[d.bloodGroup]}20` : 'var(--bg-ghost)', color: BG_COLOR[d.bloodGroup] || '#ef4444' }}>
                        <span className="text-xs font-bold">{d.bloodGroup}</span>
                    </span>
                </motion.div>
            ))}
            {!isLoading && leaders.length === 0 && (
                <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>No donation data yet</p>
            )}
        </div>
    );
};

/* ── DonorsPage ─────────────────────────────────────────────── */
const DonorsPage = () => {
    const [activeTab, setActiveTab] = useState('donors'); // 'donors' | 'leaderboard'
    const [page, setPage] = useState(1);
    const [bloodGroup, setBloodGroup] = useState('');
    const [availability, setAvailability] = useState('');
    const [verificationStatus, setVerificationStatus] = useState('');
    const [confirm, setConfirm] = useState(null);
    const toast = useToast();

    const { data, isLoading } = useGetAdminDonorsQuery({ page, limit: 15, bloodGroup, availability, verificationStatus }, { skip: activeTab !== 'donors' });
    const [verifyDonor, { isLoading: verifying }] = useVerifyAdminDonorMutation();
    const [rejectDonor, { isLoading: rejecting }] = useRejectAdminDonorMutation();

    const donors = data?.data || [];
    const pagination = data?.pagination;

    const handleConfirm = async () => {
        if (!confirm) return;
        try {
            if (confirm.type === 'verify') { await verifyDonor(confirm.id).unwrap(); toast.success(`${confirm.name} verified`); }
            if (confirm.type === 'reject') { await rejectDonor(confirm.id).unwrap(); toast.error(`${confirm.name} rejected`); }
            setConfirm(null);
        } catch { toast.error('Action failed'); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Donor Management</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{pagination?.total ?? '—'} total donors</p>
                </div>
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-ghost)', border: '1px solid var(--bg-ghost-border)' }}>
                    {[['donors', Droplets, 'Donors'], ['leaderboard', Trophy, 'Leaderboard']].map(([tab, Icon, label]) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
                            style={{ background: activeTab === tab ? 'linear-gradient(135deg,#dc2626,#e11d48)' : 'transparent', color: activeTab === tab ? '#fff' : 'var(--text-secondary)' }}>
                            <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'leaderboard' ? <LeaderboardTab /> : (
                <>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                        {/* Blood group chips */}
                        <div className="flex gap-1 flex-wrap">
                            <button onClick={() => setBloodGroup('')}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                                style={{ background: !bloodGroup ? 'linear-gradient(135deg,#dc2626,#e11d48)' : 'var(--bg-ghost)', color: !bloodGroup ? '#fff' : 'var(--text-secondary)', border: `1px solid ${!bloodGroup ? '#dc2626' : 'var(--bg-ghost-border)'}` }}>
                                All Blood Groups
                            </button>
                            {BLOOD_GROUPS.map(bg => (
                                <button key={bg} onClick={() => setBloodGroup(bg)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                                    style={{ background: bloodGroup === bg ? `${BG_COLOR[bg]}20` : 'var(--bg-ghost)', color: bloodGroup === bg ? BG_COLOR[bg] : 'var(--text-muted)', border: `1px solid ${bloodGroup === bg ? BG_COLOR[bg] + '40' : 'var(--bg-ghost-border)'}` }}>
                                    {bg}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[['', 'All'], ['available', 'Available'], ['on-cooldown', 'On Cooldown'], ['unavailable', 'Unavailable']].map(([v, label]) => (
                            <button key={v} onClick={() => { setAvailability(v); setPage(1); }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                                style={{ background: availability === v ? 'var(--bg-ghost)' : 'transparent', color: v === 'available' ? '#22c55e' : v === 'on-cooldown' ? '#f59e0b' : v === 'unavailable' ? '#71717a' : 'var(--text-secondary)', border: `1px solid ${availability === v ? 'var(--bg-input-border)' : 'var(--bg-ghost-border)'}` }}>
                                {label}
                            </button>
                        ))}
                        <div className="w-px" style={{ background: 'var(--bg-ghost-border)' }} />
                        {[['', 'All Status'], ['pending', 'Pending Verification'], ['approved', 'Verified'], ['rejected', 'Rejected']].map(([v, label]) => (
                            <button key={v} onClick={() => { setVerificationStatus(v); setPage(1); }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                                style={{ background: verificationStatus === v ? 'var(--bg-ghost)' : 'transparent', color: 'var(--text-muted)', border: `1px solid ${verificationStatus === v ? 'var(--bg-input-border)' : 'var(--bg-ghost-border)'}` }}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--bg-ghost-border)', background: 'var(--bg-surface)' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--bg-ghost-border)', background: 'var(--bg-ghost)' }}>
                                        {['Donor', 'Blood', 'Status', 'Eligibility', 'Donations', 'Last Donated', 'Actions'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading
                                        ? Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} cols={7} />)
                                        : donors.map((donor, i) => {
                                            const avBadge = AVAILABILITY_BADGE[donor.availability] || AVAILABILITY_BADGE.unavailable;
                                            const vBadge = VERIFY_BADGE[donor.verificationStatus] || VERIFY_BADGE.pending;
                                            const VIcon = vBadge.Icon;
                                            return (
                                                <motion.tr key={donor._id}
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.025 }}
                                                    style={{ borderBottom: '1px solid var(--bg-ghost-border)' }}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                                                {donor.userId?.name?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{donor.userId?.name}</p>
                                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{donor.userId?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-bold text-sm px-2 py-1 rounded-lg" style={{ background: BG_COLOR[donor.bloodGroup] ? `${BG_COLOR[donor.bloodGroup]}18` : 'var(--bg-ghost)', color: BG_COLOR[donor.bloodGroup] || '#ef4444' }}>
                                                            {donor.bloodGroup}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg w-fit"
                                                            style={{ background: avBadge.bg, color: avBadge.color }}>
                                                            {avBadge.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3"><EligibilityBadge donor={donor} /></td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{donor.totalDonations}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                        {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {donor.verificationStatus === 'pending' && (
                                                            <div className="flex items-center gap-1">
                                                                <button title="Verify" onClick={() => setConfirm({ type: 'verify', id: donor._id, name: donor.userId?.name })}
                                                                    className="p-1.5 rounded-lg cursor-pointer hover:bg-green-500/10" style={{ color: '#22c55e' }}>
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                                <button title="Reject" onClick={() => setConfirm({ type: 'reject', id: donor._id, name: donor.userId?.name })}
                                                                    className="p-1.5 rounded-lg cursor-pointer hover:bg-red-500/10" style={{ color: '#ef4444' }}>
                                                                    <XCircle className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {donor.verificationStatus !== 'pending' && (
                                                            <span className="flex items-center gap-1 text-xs" style={{ color: vBadge.color }}>
                                                                <VIcon className="w-3.5 h-3.5" />{vBadge.label}
                                                            </span>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    }
                                    {!isLoading && donors.length === 0 && (
                                        <tr><td colSpan={7} className="py-14 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No donors found</td></tr>
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
                </>
            )}

            <AnimatePresence>
                {confirm && (
                    <ConfirmModal
                        title={confirm.type === 'verify' ? 'Verify Donor' : 'Reject Donor'}
                        message={confirm.type === 'verify' ? `Mark "${confirm.name}" as a verified donor?` : `Reject "${confirm.name}"'s donor profile?`}
                        confirmLabel={confirm.type === 'verify' ? 'Verify' : 'Reject'}
                        danger={confirm.type === 'reject'}
                        onConfirm={handleConfirm}
                        onCancel={() => setConfirm(null)}
                        loading={verifying || rejecting}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default DonorsPage;
