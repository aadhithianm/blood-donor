import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { store } from '../../../app/store';
import { useGetReportStatsQuery } from '../adminApi';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    FileBarChart2, Download, Filter, ChevronDown, ChevronUp,
    TrendingUp, CheckCircle, Clock, MapPin, Droplets, Loader2,
} from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const DATE_PRESETS = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last year', days: 365 },
];

const tooltipStyle = {
    contentStyle: {
        background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)',
        borderRadius: 12, color: 'var(--text-primary)', fontSize: 12,
    },
};

const KPICard = ({ label, value, sub, icon: Icon, color }) => (
    <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
        <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
            </div>
        </div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{value}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
);

const ReportsPage = () => {
    const toast = useToast();
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const [filters, setFilters] = useState({
        dateFrom: '', dateTo: '', bloodGroup: '', district: '', status: '',
    });
    const [appliedFilters, setAppliedFilters] = useState({});

    const { data: statsData, isLoading: statsLoading, refetch } = useGetReportStatsQuery(appliedFilters);
    const stats = statsData?.data;

    const setPreset = (days) => {
        const now = new Date();
        const from = new Date(now - days * 24 * 60 * 60 * 1000);
        setFilters(f => ({
            ...f,
            dateFrom: days === 0 ? now.toISOString().slice(0, 10) : from.toISOString().slice(0, 10),
            dateTo: now.toISOString().slice(0, 10),
        }));
    };

    const applyFilters = () => {
        const active = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
        setAppliedFilters(active);
    };

    const clearFilters = () => {
        setFilters({ dateFrom: '', dateTo: '', bloodGroup: '', district: '', status: '' });
        setAppliedFilters({});
    };

    const handleDownload = async (type) => {
        setDownloading(true);
        try {
            const params = new URLSearchParams({ type, ...appliedFilters });
            const token = store.getState()?.auth?.accessToken || '';
            const response = await fetch(`/api/admin/reports?${params}`, {
                credentials: 'include',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bloodlink-report.${type === 'excel' ? 'xlsx' : 'pdf'}`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`${type.toUpperCase()} report downloaded`);
        } catch {
            toast.error('Download failed. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const activeCount = Object.values(appliedFilters).filter(Boolean).length;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Reports & Analytics</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        Filter, preview and export blood request reports
                        {activeCount > 0 && <span className="ml-2 font-semibold" style={{ color: '#ef4444' }}>{activeCount} filter{activeCount > 1 ? 's' : ''} active</span>}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleDownload('pdf')} disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                        style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}PDF
                    </button>
                    <button onClick={() => handleDownload('excel')} disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                        style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff' }}>
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}Excel
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--bg-ghost-border)', background: 'var(--bg-surface)' }}>
                <button onClick={() => setFiltersOpen(v => !v)}
                    className="w-full flex items-center justify-between p-4 cursor-pointer"
                    style={{ borderBottom: filtersOpen ? '1px solid var(--bg-ghost-border)' : 'none' }}>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4" style={{ color: '#ef4444' }} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Advanced Filters</span>
                        {activeCount > 0 && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>{activeCount} active</span>
                        )}
                    </div>
                    {filtersOpen ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                </button>

                <AnimatePresence>
                    {filtersOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="p-4 space-y-4">
                                {/* Date presets */}
                                <div>
                                    <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Date Range</p>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {DATE_PRESETS.map(p => (
                                            <button key={p.label} onClick={() => setPreset(p.days)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                                                style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>From</label>
                                            <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                                                className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none"
                                                style={{ background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)', color: 'var(--text-primary)' }} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>To</label>
                                            <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                                                className="w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none"
                                                style={{ background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)', color: 'var(--text-primary)' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Multi-select blood group */}
                                <div>
                                    <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Blood Group</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => setFilters(f => ({ ...f, bloodGroup: '' }))}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                                            style={{ background: !filters.bloodGroup ? 'linear-gradient(135deg,#dc2626,#e11d48)' : 'var(--bg-ghost)', color: !filters.bloodGroup ? '#fff' : 'var(--text-secondary)', border: `1px solid ${!filters.bloodGroup ? '#dc2626' : 'var(--bg-ghost-border)'}` }}>
                                            All
                                        </button>
                                        {BLOOD_GROUPS.map(bg => (
                                            <button key={bg} onClick={() => setFilters(f => ({ ...f, bloodGroup: f.bloodGroup === bg ? '' : bg }))}
                                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                                                style={{ background: filters.bloodGroup === bg ? 'rgba(239,68,68,0.15)' : 'var(--bg-ghost)', color: filters.bloodGroup === bg ? '#ef4444' : 'var(--text-muted)', border: `1px solid ${filters.bloodGroup === bg ? 'rgba(239,68,68,0.4)' : 'var(--bg-ghost-border)'}` }}>
                                                {bg}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status + district row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Request Status</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['', 'pending', 'accepted', 'in-progress', 'completed', 'expired'].map(s => (
                                                <button key={s} onClick={() => setFilters(f => ({ ...f, status: s }))}
                                                    className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer capitalize"
                                                    style={{ background: filters.status === s && s ? 'rgba(59,130,246,0.12)' : 'var(--bg-ghost)', color: filters.status === s && s ? '#3b82f6' : 'var(--text-muted)', border: `1px solid ${filters.status === s && s ? 'rgba(59,130,246,0.3)' : 'var(--bg-ghost-border)'}` }}>
                                                    {s || 'All'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>District</p>
                                        <input value={filters.district} onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}
                                            placeholder="Enter district name…"
                                            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                            style={{ background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)', color: 'var(--text-primary)' }} />
                                    </div>
                                </div>

                                {/* Filter action buttons */}
                                <div className="flex gap-2 pt-1">
                                    <button onClick={applyFilters}
                                        className="px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                                        style={{ background: 'linear-gradient(135deg,#dc2626,#e11d48)', color: '#fff' }}>
                                        Apply Filters
                                    </button>
                                    <button onClick={clearFilters}
                                        className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                                        style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* KPI Summary Bar */}
            {statsLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--bg-ghost)' }} />)}
                </div>
            ) : stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <KPICard label="Total Requests" value={stats.total?.toLocaleString() || '0'} icon={FileBarChart2} color="#3b82f6" />
                    <KPICard label="Completed" value={stats.completed?.toLocaleString() || '0'} sub={`${stats.successRate || 0}% success rate`} icon={CheckCircle} color="#22c55e" />
                    <KPICard label="Avg Units / Request" value={stats.avgUnitsPerRequest || '0'} icon={Droplets} color="#ef4444" />
                    <KPICard label="Most Active Region" value={stats.byDistrict?.[0]?._id || '—'} sub={stats.byDistrict?.[0] ? `${stats.byDistrict[0].count} requests` : ''} icon={MapPin} color="#f59e0b" />
                </div>
            )}

            {/* Chart preview row */}
            {stats && (
                <div className="grid lg:grid-cols-2 gap-5">
                    {/* by blood group bar */}
                    {stats.byBloodGroup?.length > 0 && (
                        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
                            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Requests by Blood Group</h3>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={stats.byBloodGroup} barSize={24}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-ghost-border)" vertical={false} />
                                    <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip {...tooltipStyle} />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {stats.byBloodGroup.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {/* by district pie */}
                    {stats.byDistrict?.length > 0 && (
                        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
                            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top 8 Districts</h3>
                            <div className="flex items-center gap-4">
                                <ResponsiveContainer width={150} height={150}>
                                    <PieChart>
                                        <Pie data={stats.byDistrict} cx="50%" cy="50%" innerRadius={36} outerRadius={68} paddingAngle={3} dataKey="count">
                                            {stats.byDistrict.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip {...tooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex-1 space-y-1.5">
                                    {stats.byDistrict.map((d, i) => (
                                        <div key={d._id} className="flex items-center gap-2 text-xs">
                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                            <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{d._id || 'Unknown'}</span>
                                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{d.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {!statsLoading && !stats && (
                <div className="py-16 text-center rounded-2xl" style={{ border: '1px solid var(--bg-ghost-border)' }}>
                    <FileBarChart2 className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Apply filters to load report data</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Then download as PDF or Excel</p>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
