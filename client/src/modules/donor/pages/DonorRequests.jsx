import { useGetDonorFeedQuery, useAcceptRequestMutation } from '../../request/requestApi';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../hooks/useAuth';
import { Tooltip } from '../../../components/Tooltip';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, MapPin, Clock, CheckCircle, AlertTriangle, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DashboardSkeleton } from '../../../components/Skeletons';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useNavigate } from 'react-router-dom';

const CommitmentModal = ({ request, isOpen, onClose, onConfirm, isAccepting }) => {
    if (!isOpen || !request) return null;
    
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <div onClick={e => e.stopPropagation()} className="max-w-md w-full">
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="glass-card rounded-3xl overflow-hidden border border-red-500/20 shadow-2xl shadow-red-500/10"
                    >
                        <div className="h-32 bg-gradient-to-br from-red-500 to-rose-600 relative flex items-center justify-center">
                            <Heart className="w-16 h-16 text-white/20 absolute" />
                            <div className="w-20 h-20 rounded-full bg-[var(--bg-surface)] border border-[var(--bg-ghost-border)] flex items-center justify-center shadow-xl z-10 translate-y-12">
                                <Droplets className="w-10 h-10 text-red-500" />
                            </div>
                        </div>

                        <div className="px-6 pt-16 pb-8 text-center bg-[var(--bg-surface)]">
                            <h2 className="text-2xl font-bold font-heading mb-2 text-[var(--text-primary)]">Commit to Save a Life?</h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-6">
                                You are about to accept a blood request. The patient is counting on your prompt response.
                            </p>

                            <div className="bg-[var(--bg-ghost)] rounded-2xl p-4 text-left space-y-3 mb-6 border border-[var(--bg-ghost-border)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wide">Patient Urgency</p>
                                        <p className="text-sm font-semibold capitalize text-[var(--text-primary)]">{request.urgency || 'Normal'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wide">Location</p>
                                        <p className="text-sm font-semibold truncate text-[var(--text-primary)]">{request.requesterId?.name || 'Local Hospital'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-[var(--bg-ghost)] hover:bg-[var(--bg-ghost-border)] text-[var(--text-primary)] transition-colors cursor-pointer"
                                    onClick={onClose}
                                    disabled={isAccepting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 text-white shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    onClick={() => onConfirm(request._id)}
                                    disabled={isAccepting}
                                >
                                    {isAccepting ? 'Confirming...' : (
                                        <>I Commit <CheckCircle className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

const DonorRequests = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: feedData, isLoading, refetch } = useGetDonorFeedQuery();
    const [acceptRequest, { isLoading: isAccepting }] = useAcceptRequestMutation();
    const { socket } = useSocket();
    const { width, height } = useWindowSize();
    
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);

    const requests = feedData?.data || [];

    useEffect(() => {
        if (!socket) return;
        socket.on('emergency_request_created', () => refetch());
        return () => socket.off('emergency_request_created');
    }, [socket, refetch]);

    const handleConfirmAccept = async (id) => {
        try {
            await acceptRequest(id).unwrap();
            setSelectedRequest(null);
            setShowConfetti(true);
            // After 3.5 seconds of confetti, route them to History
            setTimeout(() => {
                setShowConfetti(false);
                navigate('/donor/history');
            }, 3500);
        } catch (err) {
            alert(err.data?.message || 'Failed to accept request');
            setSelectedRequest(null);
        }
    };

    if (isLoading) return <DashboardSkeleton />;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.15} />}
            
            <CommitmentModal 
                request={selectedRequest}
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                onConfirm={handleConfirmAccept}
                isAccepting={isAccepting}
            />

            <div>
                <h1 className="text-2xl lg:text-3xl font-bold font-heading flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                        <Droplets className="text-red-500 w-5 h-5" />
                    </div>
                     Live Blood Match Feed
                </h1>
                <p className="mt-2 text-sm max-w-xl" style={{ color: 'var(--text-secondary)' }}>
                    These requests have been mathematically matched to your {user?.bloodGroup || 'blood group'} profile and geolocation. The community is counting on you.
                </p>
            </div>

            {requests.length === 0 ? (
                <div className="glass-card p-12 text-center flex flex-col items-center justify-center mt-10 rounded-3xl border-dashed border-2">
                    <div className="w-20 h-20 bg-[var(--bg-ghost)] rounded-full flex items-center justify-center mb-5">
                        <CheckCircle className="w-10 h-10 text-[var(--text-muted)]" />
                    </div>
                    <h3 className="text-xl font-bold font-heading mb-2 text-[var(--text-primary)]">You're all caught up!</h3>
                    <p className="text-[var(--text-secondary)]">There are no active emergency blood requests perfectly matching your profile in your area right now.</p>
                </div>
            ) : (
                <div className="grid gap-4 mt-6">
                    <AnimatePresence>
                        {requests.map((req, i) => {
                            const isCritical = req.urgency === 'critical';
                            return (
                                <motion.div
                                    key={req._id}
                                    initial={{ opacity: 0, scale: 0.98, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, x: 100 }}
                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                    className={`glass-card p-5 lg:p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group transition-all duration-300 ${
                                        isCritical ? 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'hover:border-red-500/20'
                                    }`}
                                >
                                    <div className="flex gap-4 items-start w-full md:w-auto">
                                        <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center text-xl lg:text-2xl font-black shrink-0 ${
                                            isCritical ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30 ring-4 ring-red-500/20 animate-pulse' : 
                                            req.urgency === 'urgent' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30' :
                                            'bg-[var(--bg-ghost)] text-red-500 border border-[var(--bg-ghost-border)]'
                                        }`}>
                                            {req.bloodGroup}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <h3 className="text-base lg:text-lg font-bold truncate text-[var(--text-primary)]" title={req.requesterId?.name || 'Hospital Request'}>
                                                    {req.requesterId?.name || 'Hospital Request'}
                                                </h3>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider shrink-0 ${
                                                    isCritical ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 
                                                    req.urgency === 'urgent' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' :
                                                    'bg-[var(--bg-ghost)] text-[var(--text-muted)] border border-[var(--bg-ghost-border)]'
                                                }`}>
                                                    {req.urgency}
                                                </span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs lg:text-sm text-[var(--text-secondary)]">
                                                <span className="flex items-center gap-1.5 min-w-0">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0" /> 
                                                    <span className="truncate">{req.requesterId?.formattedAddress || req.location?.district || 'Your City'}</span>
                                                </span>
                                                <span className="hidden sm:inline opacity-30">•</span>
                                                <span className="flex items-center gap-1.5 shrink-0">
                                                    <Clock className="w-3.5 h-3.5" /> 
                                                    {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto mt-2 md:mt-0 flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0">
                                        <div className="text-left md:text-right">
                                            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Requested</p>
                                            <p className="text-sm font-bold text-[var(--text-primary)]">{req.unitsNeeded} <span className="font-normal opacity-70">Units</span></p>
                                        </div>

                                        {req.isAcceptedByMe ? (
                                            <button disabled className="btn-outline w-auto border-emerald-500/30 text-emerald-500 bg-emerald-500/5 cursor-default py-2">
                                                <CheckCircle className="w-4 h-4 mr-1.5 inline" /> Assigned
                                            </button>
                                        ) : !user?.isVerified ? (
                                            <Tooltip content="Verify your account to perform this action">
                                                <button disabled className="btn-primary w-auto opacity-50 cursor-not-allowed py-2">
                                                    Accept Request
                                                </button>
                                            </Tooltip>
                                        ) : (
                                            <button 
                                                onClick={() => setSelectedRequest(req)}
                                                className={`py-2 px-5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                                                    isCritical 
                                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 hover:scale-105' 
                                                    : 'bg-[var(--bg-ghost)] hover:bg-zinc-800 text-[var(--text-primary)] border border-[var(--bg-ghost-border)]'
                                                }`}
                                            >
                                                Accept Request
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default DonorRequests;
