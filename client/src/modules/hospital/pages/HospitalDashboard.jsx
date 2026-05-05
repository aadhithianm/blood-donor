import { useState } from 'react';
import { useGetPendingDonorsQuery, useVerifyDonorMutation, useGetInventoryQuery, useUpdateInventoryMutation } from '../hospitalApi';
import { useGetMyRequestsQuery } from '../../request/requestApi';
import { motion } from 'framer-motion';
import { useAuth } from '../../../hooks/useAuth';
import { Building2, CheckCircle, XCircle, Droplets, Users, ClipboardList, Package, PlusCircle, Activity } from 'lucide-react';
import { CreateRequestModal } from '../components/CreateRequestModal';

const HospitalDashboard = () => {
    const { user } = useAuth();
    const { data: pendingData } = useGetPendingDonorsQuery();
    const { data: inventoryData } = useGetInventoryQuery();
    const { data: myRequestsData } = useGetMyRequestsQuery();
    const [verifyDonor] = useVerifyDonorMutation();
    const [updateInventory] = useUpdateInventoryMutation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const pending = pendingData?.data || [];
    const inventory = inventoryData?.data || [];
    const activeRequests = myRequestsData?.data || [];

    const handleVerify = async (id, action) => {
        try { await verifyDonor({ id, action }).unwrap(); } catch (err) { alert(err.data?.message || 'Failed'); }
    };

    const handleInventoryUpdate = async (bloodGroup, units) => {
        try { await updateInventory({ bloodGroup, units: parseInt(units) }).unwrap(); } catch (err) { alert(err.data?.message || 'Failed'); }
    };

    return (
        <div className="space-y-8 relative">
            <CreateRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Hospital Dashboard</h1>
                    <p className="text-zinc-500 mt-1">Welcome, {user?.name}</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 shadow-lg shadow-red-500/20">
                    <PlusCircle className="w-5 h-5" /> Create Blood Request
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Pending Approvals', value: pending.length, icon: ClipboardList, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Blood Groups', value: inventory.filter(i => i.units > 0).length, icon: Droplets, color: 'text-red-400', bg: 'bg-red-500/10' },
                    { label: 'Total Units', value: inventory.reduce((s, i) => s + (i.units || 0), 0), icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Staff', value: '-', icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
                ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-zinc-500 text-sm">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Inventory */}
            <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Droplets className="w-5 h-5 text-red-400" /> Blood Inventory</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {inventory.map((item) => (
                        <div key={item.bloodGroup} className="p-4 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <p className="text-xl font-bold text-red-400">{item.bloodGroup}</p>
                            <input
                                type="number" min="0" defaultValue={item.units}
                                onBlur={(e) => handleInventoryUpdate(item.bloodGroup, e.target.value)}
                                className="w-20 text-center input-field mt-2 text-lg mx-auto"
                            />
                            <p className="text-xs text-zinc-500 mt-1">units</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Active Requests Log */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" /> Recent Blood Requests
                    </h2>
                    {activeRequests.length === 0 ? (
                        <p className="text-zinc-500 text-center py-8">No recent requests broadcasted.</p>
                    ) : (
                        <div className="space-y-3">
                            {activeRequests.slice(0, 5).map((req) => (
                                <div key={req._id} className="p-4 rounded-xl border border-zinc-800" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-red-400 text-lg">{req.bloodGroup}</span>
                                            <span className={`badge ${req.urgency === 'critical' ? 'badge-danger' : req.urgency === 'urgent' ? 'badge-warning' : 'badge-primary'}`}>
                                                {req.urgency}
                                            </span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-md uppercase font-bold ${req.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-zinc-400">
                                        <span>Units: {req.unitsFulfilled} / {req.unitsNeeded}</span>
                                        <span>Matched Donors: {req.assignedDonors?.length || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pending Donors */}
                <div className="glass-card p-6 h-fit">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-amber-400" /> Pending Donor Approvals</h2>
                    {pending.length === 0 ? (
                        <p className="text-zinc-500 text-center py-8">No pending approvals</p>
                    ) : (
                    <div className="space-y-3">
                        {pending.map((donor) => (
                            <div key={donor._id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <div>
                                    <p className="font-medium">{donor.userId?.name || 'Unknown'}</p>
                                    <p className="text-sm text-zinc-500">{donor.bloodGroup} · {donor.userId?.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleVerify(donor._id, 'approve')} className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all cursor-pointer">
                                        <CheckCircle className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleVerify(donor._id, 'reject')} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default HospitalDashboard;
