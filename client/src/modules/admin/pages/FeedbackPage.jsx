import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGetAdminFeedbackQuery, useGetFeedbackStatsQuery } from '../adminApi';
import { SkeletonTableRow } from '../../../components/Skeletons';
import { MessageSquare, Star, Flag, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

const REPORT_TYPE_STYLES = {
    none: { label: 'Rating Only', color: '#71717a', bg: 'rgba(113,113,122,0.1)' },
    'no-show': { label: 'No-Show', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    'fake-request': { label: 'Fake Request', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    'unsafe-behavior': { label: 'Unsafe Behavior', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
};

const StarRating = ({ rating }) => (
    <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-3 h-3" style={{ color: i < rating ? '#f59e0b' : 'var(--bg-ghost-border)', fill: i < rating ? '#f59e0b' : 'transparent' }} />
        ))}
    </div>
);

const FeedbackPage = () => {
    const [page, setPage] = useState(1);
    const [reportType, setReportType] = useState('');

    const { data, isLoading } = useGetAdminFeedbackQuery({ page, limit: 20, reportType });
    const { data: statsData } = useGetFeedbackStatsQuery();

    const feedback = data?.data || [];
    const pagination = data?.pagination;
    const stats = statsData?.data;

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Feedback & Complaints</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{pagination?.total ?? '—'} total feedback entries</p>
            </div>

            {/* Stats cards */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.avgRating?.toFixed(1) || '—'}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <StarRating rating={Math.round(stats.avgRating || 0)} />
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Avg Rating</p>
                    </div>
                    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
                        <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{stats.totalReports || 0}</p>
                        <div className="flex items-center gap-1 mt-1"><Flag className="w-3.5 h-3.5 text-red-400" /></div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Total Reports Filed</p>
                    </div>
                    {(stats.byType || []).filter(t => t._id !== 'none').slice(0, 2).map(t => {
                        const st = REPORT_TYPE_STYLES[t._id] || REPORT_TYPE_STYLES.none;
                        return (
                            <div key={t._id} className="p-4 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
                                <p className="text-2xl font-bold" style={{ color: st.color }}>{t.count}</p>
                                <p className="text-xs mt-1 font-medium" style={{ color: st.color }}>{st.label}</p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2">
                {[['', 'All'], ...Object.entries(REPORT_TYPE_STYLES)].map(([v, labelOrObj]) => {
                    const label = typeof labelOrObj === 'string' ? labelOrObj : labelOrObj.label;
                    const style = typeof labelOrObj === 'object' ? labelOrObj : null;
                    return (
                        <button key={v} onClick={() => { setReportType(v); setPage(1); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                            style={{
                                background: reportType === v ? (style?.bg || 'linear-gradient(135deg,#dc2626,#e11d48)') : 'var(--bg-ghost)',
                                color: reportType === v ? (style?.color || '#fff') : 'var(--text-secondary)',
                                border: `1px solid ${reportType === v ? (style?.color + '40' || '#dc2626') : 'var(--bg-ghost-border)'}`,
                            }}>
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--bg-ghost-border)', background: 'var(--bg-surface)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--bg-ghost-border)', background: 'var(--bg-ghost)' }}>
                                {['From', 'To', 'Rating', 'Report Type', 'Comment', 'Date'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading
                                ? Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} cols={6} />)
                                : feedback.map((f, i) => {
                                    const rt = REPORT_TYPE_STYLES[f.reportType] || REPORT_TYPE_STYLES.none;
                                    return (
                                        <motion.tr key={f._id}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                            style={{ borderBottom: '1px solid var(--bg-ghost-border)', background: f.reportType !== 'none' ? 'rgba(239,68,68,0.02)' : 'transparent' }}>
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{f.fromUserId?.name || '—'}</p>
                                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{f.fromUserId?.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{f.toUserId?.name || '—'}</p>
                                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{f.toUserId?.email}</p>
                                            </td>
                                            <td className="px-4 py-3"><StarRating rating={f.rating} /></td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ color: rt.color, background: rt.bg }}>
                                                    {rt.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 max-w-[200px]">
                                                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }} title={f.comment}>{f.comment || '—'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {new Date(f.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            }
                            {!isLoading && feedback.length === 0 && (
                                <tr><td colSpan={6} className="py-14 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No feedback found</td></tr>
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
        </div>
    );
};

export default FeedbackPage;
