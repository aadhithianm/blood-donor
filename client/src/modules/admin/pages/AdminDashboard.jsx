import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGetAnalyticsQuery, useGetSystemHealthQuery, useGetBloodInventoryQuery } from '../adminApi';
import { useSocket } from '../../../hooks/useSocket';
import { SkeletonStatCard, SkeletonChart } from '../../../components/Skeletons';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    Users, Droplets, Heart, Building2, TrendingUp, Activity,
    ArrowRight, AlertTriangle, Zap, Database, Cpu, Wifi, Clock,
    CheckCircle, XCircle, RefreshCw
} from 'lucide-react';

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const tooltipStyle = {
    contentStyle: {
        background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)',
        borderRadius: 12, color: 'var(--text-primary)', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    },
    cursor: { fill: 'rgba(239,68,68,0.04)', stroke: 'none' },
};

// Animated counting number
const AnimatedNumber = ({ target }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!target) return;
        const steps = 40;
        const inc = target / steps;
        let current = 0;
        const interval = setInterval(() => {
            current = Math.min(current + inc, target);
            setCount(Math.floor(current));
            if (current >= target) clearInterval(interval);
        }, 25);
        return () => clearInterval(interval);
    }, [target]);
    return <>{count.toLocaleString()}</>;
};

const StatCard = ({ label, value, icon: Icon, color, bg, to, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
        className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}
    >
        {/* Subtle glow spot */}
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-20" style={{ background: color }} />
        <div className="flex items-center justify-between relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
            {to && (
                <Link to={to} className="text-xs font-medium flex items-center gap-0.5 hover:opacity-70 transition-opacity" style={{ color }}>
                    View <ArrowRight className="w-3 h-3" />
                </Link>
            )}
        </div>
        <div className="relative">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                {value !== undefined ? <AnimatedNumber target={value} /> : '—'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
        </div>
    </motion.div>
);

// Blood group colors
const BG_INFO = {
    'O+': '#ef4444', 'O-': '#dc2626', 'A+': '#3b82f6', 'A-': '#2563eb',
    'B+': '#22c55e', 'B-': '#16a34a', 'AB+': '#8b5cf6', 'AB-': '#7c3aed',
};

const CRITICAL_THRESHOLD = 5;

// System health status badge
const HealthBadge = ({ label, value, icon: Icon, good }) => (
    <div className="flex items-center gap-2.5 p-3 rounded-xl"
        style={{ background: good ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${good ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)'}` }}>
        <Icon className="w-4 h-4 shrink-0" style={{ color: good ? '#22c55e' : '#ef4444' }} />
        <div className="flex-1 min-w-0">
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-xs font-semibold truncate" style={{ color: good ? '#22c55e' : '#ef4444' }}>{value}</p>
        </div>
    </div>
);

const AdminDashboard = () => {
    const { data: analyticsData, isLoading: analyticsLoading } = useGetAnalyticsQuery();
    const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useGetSystemHealthQuery(undefined, { pollingInterval: 10000 });
    const { data: inventoryData } = useGetBloodInventoryQuery();
    const { socket } = useSocket();
    const [liveAlert, setLiveAlert] = useState(null);
    const [liveFeed, setLiveFeed] = useState([]);

    const analytics = analyticsData?.data;
    const health = healthData?.data;
    const inventory = inventoryData?.data || [];

    // Socket: real-time emergency alert + new request feed
    useEffect(() => {
        if (!socket) return;
        const handleBroadcast = (data) => {
            setLiveAlert({ message: data.message, ts: new Date() });
            setTimeout(() => setLiveAlert(null), 8000);
        };
        const handleNewRequest = (req) => {
            setLiveFeed(prev => [{ ...req, liveId: Date.now() }, ...prev].slice(0, 10));
        };
        socket.on('emergency:broadcast', handleBroadcast);
        socket.on('admin:new_request', handleNewRequest);
        return () => {
            socket.off('emergency:broadcast', handleBroadcast);
            socket.off('admin:new_request', handleNewRequest);
        };
    }, [socket]);

    const fulfillmentData = (analytics?.fulfillmentRate || []).map(f => ({
        month: f._id,
        rate: f.total > 0 ? Math.round((f.completed / f.total) * 100) : 0,
    })).reverse();

    const roleData = (analytics?.usersByRole || []).map(r => ({ name: r._id, value: r.count }));
    const demandData = (analytics?.bloodGroupDemand || []).map(d => ({ name: d._id, units: d.totalUnits }));
    const recentRequests = analytics?.recentRequests || [];

    const stats = [
        { label: 'Total Users', value: analytics?.totalUsers, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', to: '/admin/users', delay: 0 },
        { label: 'Total Donations', value: analytics?.totalDonations, icon: Heart, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', delay: 0.05 },
        { label: 'Active Donors', value: analytics?.activeDonors, icon: Droplets, color: '#f97316', bg: 'rgba(249,115,22,0.1)', delay: 0.1 },
        { label: 'Pending Hospitals', value: analytics?.pendingHospitals, icon: Building2, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', to: '/admin/hospitals', delay: 0.15 },
    ];

    return (
        <div className="space-y-6">
            {/* Live emergency alert banner */}
            <AnimatePresence>
                {liveAlert && (
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 p-4 rounded-2xl overflow-hidden"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                        <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0 w-[18px] h-[18px]" />
                        <div className="flex-1">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-wide">Live Broadcast Active</p>
                            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{liveAlert.message}</p>
                        </div>
                        <button onClick={() => setLiveAlert(null)} className="text-xs text-red-400 cursor-pointer hover:underline shrink-0">Dismiss</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Dashboard</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {analyticsLoading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
                    : stats.map(s => <StatCard key={s.label} {...s} />)
                }
            </div>

            {/* Charts row */}
            <div className="grid lg:grid-cols-2 gap-5">
                {/* Fulfillment Rate — Area Chart */}
                {analyticsLoading ? <SkeletonChart /> : (
                    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <TrendingUp className="w-4 h-4 text-green-400" />Fulfillment Rate (Monthly)
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={fulfillmentData}>
                                <defs>
                                    <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-ghost-border)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={10} unit="%" tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip {...tooltipStyle} formatter={v => [`${v}%`, 'Fulfillment']} />
                                <Area type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2.5}
                                    fill="url(#rateGrad)" dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Blood Demand — Bar Chart */}
                {analyticsLoading ? <SkeletonChart /> : (
                    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Droplets className="w-4 h-4 text-red-400" />Blood Group Demand
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={demandData} barSize={26}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-ghost-border)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip {...tooltipStyle} />
                                <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                                    {demandData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Blood Inventory + System Health */}
            <div className="grid lg:grid-cols-2 gap-5">
                {/* Blood Inventory */}
                <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Droplets className="w-4 h-4" style={{ color: '#ef4444' }} />Available Donor Inventory
                    </h3>
                    {inventory.length === 0 ? (
                        <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No inventory data</p>
                    ) : (
                        <div className="grid grid-cols-4 gap-2.5">
                            {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => {
                                const item = inventory.find(i => i._id === bg);
                                const count = item?.count || 0;
                                const critical = count < CRITICAL_THRESHOLD;
                                return (
                                    <div key={bg} className="rounded-xl p-3 text-center"
                                        style={{ background: critical ? 'rgba(239,68,68,0.08)' : 'var(--bg-ghost)', border: `1px solid ${critical ? 'rgba(239,68,68,0.2)' : 'var(--bg-ghost-border)'}` }}>
                                        <p className="text-sm font-bold" style={{ color: BG_INFO[bg] || '#ef4444' }}>{bg}</p>
                                        <p className="text-lg font-bold mt-1" style={{ color: critical ? '#ef4444' : 'var(--text-primary)' }}>{count}</p>
                                        {critical && <p className="text-[9px] font-semibold text-red-400 mt-0.5 uppercase tracking-wide">Critical</p>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {inventory.some(i => i.count < CRITICAL_THRESHOLD) && (
                        <Link to="/admin/broadcast" className="mt-3 flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: '#ef4444' }}>
                            <Zap className="w-3.5 h-3.5" />Send emergency broadcast for critical groups
                        </Link>
                    )}
                </div>

                {/* System Health */}
                <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Activity className="w-4 h-4 text-blue-400" />System Health
                        </h3>
                        <button onClick={() => refetchHealth()} className="cursor-pointer p-1.5 rounded-lg hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {healthLoading ? (
                        <div className="space-y-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--bg-ghost)' }} />
                            ))}
                        </div>
                    ) : health ? (
                        <div className="grid grid-cols-2 gap-2.5">
                            <HealthBadge label="Database" value={health.db.status} icon={Database} good={health.db.state === 1} />
                            <HealthBadge label="Socket Clients" value={`${health.sockets.connectedClients} connected`} icon={Wifi} good={health.sockets.connectedClients >= 0} />
                            <HealthBadge label="Server Uptime" value={`${Math.floor(health.server.uptime / 60)}m`} icon={Clock} good={true} />
                            <HealthBadge label="Memory" value={`${health.server.memoryUsedMB}MB used`} icon={Cpu} good={health.server.memoryUsedMB < 512} />
                        </div>
                    ) : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Health data unavailable</p>}
                </div>
            </div>

            {/* Live Request Feed */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Zap className="w-4 h-4 text-amber-400" />Live + Recent Blood Requests
                    {liveFeed.length > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                            {liveFeed.length} live
                        </span>
                    )}
                </h3>
                <div className="space-y-2">
                    {/* Live entries */}
                    <AnimatePresence>
                        {liveFeed.map(req => (
                            <motion.div key={req.liveId}
                                initial={{ opacity: 0, x: -16, backgroundColor: 'rgba(34,197,94,0.08)' }}
                                animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(34,197,94,0.04)' }}
                                transition={{ duration: 0.4 }}
                                className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                                style={{ border: '1px solid rgba(34,197,94,0.15)' }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                                <span className="w-10 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                    {req.bloodGroup}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                                        Live · {req.unitsNeeded} unit{req.unitsNeeded > 1 ? 's' : ''} · {req.urgency || 'normal'} urgency
                                    </p>
                                </div>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-green-400 bg-green-500/10">New</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Historical */}
                    {recentRequests.map(req => (
                        <div key={req._id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                            style={{ background: 'var(--bg-ghost)' }}>
                            <span className="w-10 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                {req.bloodGroup}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                    {req.requesterId?.name || 'Unknown'} · {req.unitsNeeded} unit{req.unitsNeeded > 1 ? 's' : ''}
                                </p>
                                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                    {new Date(req.createdAt).toLocaleDateString('en-IN')}
                                </p>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                req.status === 'completed' ? 'text-green-400 bg-green-500/10' :
                                req.status === 'active' ? 'text-blue-400 bg-blue-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                                {req.status}
                            </span>
                        </div>
                    ))}

                    {recentRequests.length === 0 && liveFeed.length === 0 && (
                        <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No requests yet</p>
                    )}
                </div>
            </div>

            {/* User distribution donut */}
            {!analyticsLoading && roleData.length > 0 && (
                <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Users className="w-4 h-4 text-blue-400" />User Distribution
                    </h3>
                    <div className="flex items-center gap-6 flex-wrap">
                        <ResponsiveContainer width={180} height={180}>
                            <PieChart>
                                <Pie data={roleData} cx="50%" cy="50%" innerRadius={52} outerRadius={82}
                                    paddingAngle={4} dataKey="value">
                                    {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip {...tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-2">
                            {roleData.map((r, i) => (
                                <div key={r.name} className="flex items-center gap-2.5 text-sm">
                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                    <span className="capitalize font-medium" style={{ color: 'var(--text-primary)' }}>{r.name}</span>
                                    <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{r.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
