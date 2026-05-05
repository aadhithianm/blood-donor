import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetDonorHistoryQuery, useCompleteRequestMutation } from '../../request/requestApi';
import { Droplet, MapPin, Calendar, Clock, AlertCircle, Phone, X, Building2, User, CheckCircle } from 'lucide-react';

const DonorHistoryPage = () => {
    const { data: response, isLoading, error, refetch } = useGetDonorHistoryQuery();
    const [completeRequest, { isLoading: isCompleting }] = useCompleteRequestMutation();
    const requests = response?.data || [];

    const handleComplete = async (id) => {
        if (!window.confirm("Are you sure you have completed this donation? Your trust score will increase!")) return;
        try {
            await completeRequest(id).unwrap();
            refetch();
        } catch (err) {
            alert(err.data?.message || 'Failed to complete request');
        }
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        }
    };

    const getStatusColor = (status) => {
        if (status === 'completed') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (status === 'in-progress') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    };

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-5xl mx-auto">
                <div className="h-10 w-48 rounded-lg bg-[var(--bg-ghost)] animate-pulse" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 rounded-2xl bg-[var(--bg-ghost)] animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card p-8 rounded-2xl text-center flex flex-col items-center justify-center max-w-5xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold font-heading mb-2 text-red-500">Failed to load history</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Please check your internet connection and try again.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold font-heading" style={{ color: 'var(--text-primary)' }}>
                        Donation History
                    </h1>
                    <p className="mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Track your completed requests and people you've helped.
                    </p>
                </div>
                <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-3 w-fit">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-rose-500/10">
                        <Droplet className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold font-heading" style={{ color: 'var(--text-primary)' }}>
                            {requests.length} Requests
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Fulfilled</p>
                    </div>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="glass-card p-12 rounded-2xl text-center flex flex-col items-center justify-center border-dashed border-2">
                    <div className="w-20 h-20 rounded-full bg-[var(--bg-ghost)] flex items-center justify-center mb-5">
                        <Clock className="w-10 h-10 text-[var(--text-muted)]" />
                    </div>
                    <h3 className="text-xl font-bold font-heading mb-2" style={{ color: 'var(--text-primary)' }}>No Donation History Yet</h3>
                    <p className="max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        You haven't fulfilled any blood requests yet. Head over to the Blood Requests tab to find someone in need!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map(req => {
                        return (
                            <motion.div 
                                key={req._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card p-5 lg:p-6 rounded-2xl flex flex-col md:flex-row gap-6 relative overflow-hidden group"
                            >
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-rose-500/10 border border-rose-500/20">
                                                <Droplet className="w-6 h-6 text-rose-500 drop-shadow-sm" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                                    {req.bloodGroup} Blood Request
                                                </h3>
                                                <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border capitalize ${getUrgencyColor(req.urgency)}`}>
                                                {req.urgency}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-ghost)] border border-[var(--bg-ghost-border)] hover:border-red-500/30 transition-colors">
                                            <Building2 className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Requested By</p>
                                                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{req.requesterId?.name}</p>
                                                {req.requesterId?.mobile && (
                                                    <a href={`tel:${req.requesterId.mobile}`} className="text-xs mt-1 flex items-center gap-1 text-blue-400 hover:text-blue-300">
                                                        <Phone className="w-3 h-3" /> {req.requesterId.mobile}
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-ghost)] border border-[var(--bg-ghost-border)] hover:border-red-500/30 transition-colors">
                                            <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Location</p>
                                                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{req.location?.formattedAddress}</p>
                                                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{req.location?.district}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {req.patientName && (
                                        <div className="p-3 rounded-xl flex items-start gap-3 bg-red-500/5 border border-red-500/10 mb-4">
                                            <User className="w-5 h-5 text-rose-400 shrink-0" />
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Patient Details</p>
                                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                    {req.patientName} &bull; <span className="font-normal opacity-80">{req.reasonForRequest}</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {req.assignedDonors && req.assignedDonors.length > 0 && req.assignedDonors[0].status !== 'completed' && req.status !== 'completed' && (
                                        <button 
                                            onClick={() => handleComplete(req._id)}
                                            disabled={isCompleting}
                                            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            {isCompleting ? 'Confirming...' : 'I Have Donated (Confirm Completion)'}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DonorHistoryPage;
