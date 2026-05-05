import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetDonorDashboardQuery } from '../donorApi';
import { useAuth } from '../../../hooks/useAuth';
import { useSocket } from '../../../context/SocketContext';
import { useUpdateProfileMutation } from '../../user/userApi';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../auth/authSlice';
import { Heart, Droplets, Award, Calendar, TrendingUp, Shield, Clock, Search, UploadCloud, BellRing, ShieldAlert, Check, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardSkeleton } from '../../../components/Skeletons';
import { Tooltip } from '../../../components/Tooltip';

const badgeIcons = { 'First Drop': '🩸', 'Regular Hero': '💪', 'Life Saver': '⭐', 'Legend': '🏆' };

/* ─── Verification Tracker Component ─── */
const VerificationTracker = ({ user, profile }) => {
    const isEmailVerified = user?.isEmailVerified;
    const isProfileComplete = user?.profileCompleted;
    const isCertUploaded = profile?.medCertUrl || profile?.verificationStatus === 'pending' || profile?.verificationStatus === 'approved';
    const isApproved = user?.isVerified || profile?.verificationStatus === 'approved';

    if (isApproved) return null; // Hide if fully verified

    return (
        <div className="glass-card overflow-hidden">
            <div className="bg-gradient-to-r from-red-600/10 to-rose-500/5 p-4 border-b" style={{ borderColor: 'var(--bg-ghost-border)' }}>
                <h3 className="font-bold text-red-500 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" /> Account Verification Required
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Complete these steps to unlock blood requests and donations.</p>
            </div>
            <div className="p-5 flex flex-col md:flex-row gap-4 relative">
                {/* Step 1: Email & Profile */}
                <div className={`flex-1 p-4 rounded-xl border transition-all ${isEmailVerified && isProfileComplete ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/5 border-red-500/20 shadow-md shadow-red-500/5'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: isEmailVerified && isProfileComplete ? '#22c55e' : '#ef4444' }}>Step 1</span>
                        {isEmailVerified && isProfileComplete ? <Check className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-red-500/50" />}
                    </div>
                    <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Personal Details</p>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Verify email and complete profile.</p>
                    {!isEmailVerified && <Link to="/verify-account" className="text-xs font-bold text-red-500 hover:underline flex items-center mb-1">Verify Email <ChevronRight className="w-3 h-3 ml-0.5" /></Link>}
                    {isEmailVerified && !isProfileComplete && <Link to="/donor/profile" className="text-xs font-bold text-red-500 hover:underline flex items-center">Go to Profile <ChevronRight className="w-3 h-3 ml-0.5" /></Link>}
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center text-zinc-500"><ChevronRight className="w-6 h-6" /></div>

                {/* Step 2: Upload Certificate */}
                <div className={`flex-1 p-4 rounded-xl border transition-all ${isCertUploaded ? 'bg-green-500/10 border-green-500/20' : isProfileComplete ? 'bg-amber-500/10 border-amber-500/20 shadow-md shadow-amber-500/5' : 'bg-zinc-500/5 border-zinc-500/20 opacity-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: isCertUploaded ? '#22c55e' : isProfileComplete ? '#f59e0b' : 'var(--text-muted)' }}>Step 2</span>
                        {isCertUploaded ? <Check className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-amber-500/50" />}
                    </div>
                    <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Upload Certificate</p>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Provide official medical clearance.</p>
                    {!isCertUploaded && isProfileComplete && <Link to="/donor/profile" className="text-xs font-bold text-amber-500 hover:underline flex items-center">Upload via Profile <ChevronRight className="w-3 h-3 ml-0.5" /></Link>}
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center text-zinc-500"><ChevronRight className="w-6 h-6" /></div>

                {/* Step 3: Admin Approval */}
                <div className={`flex-1 p-4 rounded-xl border transition-all ${isApproved ? 'bg-green-500/10 border-green-500/20' : isCertUploaded ? 'bg-blue-500/10 border-blue-500/20 shadow-md shadow-blue-500/5' : 'bg-zinc-500/5 border-zinc-500/20 opacity-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: isApproved ? '#22c55e' : isCertUploaded ? '#3b82f6' : 'var(--text-muted)' }}>Step 3</span>
                        {isApproved ? <Check className="w-5 h-5 text-green-500" /> : isCertUploaded ? <Clock className="w-5 h-5 text-blue-500 animate-pulse" /> : <div className="w-5 h-5 rounded-full border-2 border-zinc-500/50" />}
                    </div>
                    <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Admin Approval</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{isCertUploaded && !isApproved ? 'Under review by our team.' : 'Final account activation.'}</p>
                </div>
            </div>
        </div>
    );
};

const DonorDashboard = () => {
    const { user } = useAuth();
    const dispatch = useDispatch();
    const { socket } = useSocket();
    const { data, isLoading } = useGetDonorDashboardQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
    const [liveRequest, setLiveRequest] = useState(null);
    const [justVerified, setJustVerified] = useState(false);
    const dashboard = data?.data;

    useEffect(() => {
        if (!socket) return;

        const handleEmergency = (reqData) => {
            setLiveRequest(reqData);
        };

        const handleVerification = () => {
            setJustVerified(true);
            dispatch(updateUser({ profile: { ...user.profile, verificationStatus: 'approved' } }));
        };

        socket.on('emergency_request_created', handleEmergency);
        socket.on('verification_approved', handleVerification);

        return () => {
            socket.off('emergency_request_created', handleEmergency);
            socket.off('verification_approved', handleVerification);
        };
    }, [socket, dispatch, user]);

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    const handleToggleAvailability = async () => {
        try {
            const newStatus = !user.availability;
            await updateProfile({ availability: newStatus }).unwrap();
            dispatch(updateUser({ availability: newStatus }));
        } catch (err) {
            console.error('Failed to toggle availability', err);
        }
    };

    const stats = [
        { label: 'Trust Score', value: dashboard?.trustScore || 0, icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', tooltip: 'Increases with successful donations and reliability' },
        { label: 'Total Donations', value: dashboard?.totalDonations || 0, icon: Droplets, color: 'text-red-400', bg: 'bg-red-500/10', tooltip: 'Your total lifetime blood donations' },
        { label: 'Current Streak', value: dashboard?.streaks?.current || 0, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10', tooltip: 'Consecutive routine donations without delays' },
        { label: 'Longest Streak', value: dashboard?.streaks?.longest || 0, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10', tooltip: 'Your highest all-time donation streak' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back, {user?.name} 👋</h1>
                <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Your donor dashboard</p>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center gap-4 bg-red-500/5 p-4 rounded-2xl border border-red-500/10 shadow-sm">
                <Link to="/donor/requests" className="btn-primary flex items-center gap-2">
                    <Search className="w-4 h-4" /> Find Blood Requests
                </Link>

                <div className="flex items-center gap-3 px-4 py-2 rounded-xl border shadow-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--bg-input-border)' }}>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Availability</span>
                    <button 
                         onClick={handleToggleAvailability}
                         disabled={isUpdating}
                         className={`w-12 h-6 rounded-full transition-colors relative ${user?.availability ? 'bg-red-500' : 'bg-zinc-400'}`}
                    >
                       <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${user?.availability ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-xs min-w-[40px]" style={{ color: 'var(--text-muted)' }}>{user?.availability ? 'Active' : 'Paused'}</span>
                </div>
            </div>
            {/* Verification Stepper (only visible if not fully verified) */}
            <AnimatePresence>
                {(!user?.isVerified || dashboard?.profile?.verificationStatus !== 'approved') && !justVerified && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <VerificationTracker user={user} profile={dashboard?.profile} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Live Emergency Request */}
            <AnimatePresence>
                {liveRequest && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, y: -20 }} 
                        animate={{ opacity: 1, height: 'auto', y: 0 }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-500 text-white p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-red-500/20 overflow-hidden"
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                                <span className="font-bold text-sm tracking-widest uppercase">Emergency Blood Request</span>
                            </div>
                            <p className="font-medium text-lg leading-snug">
                                {liveRequest.hospitalName} urgently needs <span className="font-bold border-b border-white/40 pb-0.5">{liveRequest.bloodGroup}</span> blood!
                            </p>
                            <p className="text-white/80 text-sm mt-1 flex items-center gap-2">
                                <BellRing className="w-3.5 h-3.5" /> 
                                {liveRequest.location} • {liveRequest.distance || 'Nearby'}
                            </p>
                        </div>
                        <Link 
                            to={`/donor/requests/${liveRequest.id || liveRequest._id}`} 
                            className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-50 hover:scale-105 transition-all w-full md:w-auto text-center"
                        >
                            Respond Now
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Tooltip key={stat.label} content={stat.tooltip}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-5 w-full text-left"
                        >
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
                        </motion.div>
                    </Tooltip>
                ))}
            </div>

            {/* Donation Gamification Impact Widget */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none transform translate-x-1/4">
                    <Heart className="w-64 h-64" style={{ color: 'var(--text-primary)' }} />
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30 text-white shrink-0 z-10">
                    <Heart className="w-8 h-8 animate-pulse" fill="currentColor" />
                </div>
                <div className="text-center sm:text-left z-10">
                    <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Donation Impact</h3>
                    <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                        You've potentially helped save <span className="font-bold text-red-500 text-lg px-1">{(dashboard?.totalDonations || 0) * 3}</span> lives through your brave contributions.
                    </p>
                </div>
            </motion.div>

            {/* Next Eligible + Cooldown */}
            {dashboard?.nextEligibleDate && new Date(dashboard.nextEligibleDate) > new Date() && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Cooldown Period Active</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Next eligible date: <span className="text-amber-500 font-bold">{new Date(dashboard.nextEligibleDate).toLocaleDateString()}</span>
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Badges */}
            <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Award className="w-5 h-5 text-amber-400" /> Your Badges
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(dashboard?.badges || []).map((badge, i) => (
                        <motion.div
                            key={badge.name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.15, type: 'spring' }}
                            className="glass-card p-4 text-center"
                        >
                            <div className="text-3xl mb-2">{badge.icon || badgeIcons[badge.name] || '🎖️'}</div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{badge.name}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                {new Date(badge.earnedAt).toLocaleDateString()}
                            </p>
                        </motion.div>
                    ))}
                    {(!dashboard?.badges || dashboard.badges.length === 0) && (
                        <div className="col-span-full text-center py-8" style={{ color: 'var(--text-muted)' }}>
                            <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p>Complete your first donation to earn your first badge!</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default DonorDashboard;
