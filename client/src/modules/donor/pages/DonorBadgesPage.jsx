import { motion } from 'framer-motion';
import { Shield, Medal, Award, Star, Flame, Droplet, Heart, Zap, Clock } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const DonorBadgesPage = () => {
    const { user } = useAuth();
    const trustScore = user?.trustScore || 50;
    const totalDonations = user?.totalDonations || 0;

    const badges = [
        {
            id: 'first-drop',
            name: 'First Drop',
            desc: 'Completed your first blood donation request.',
            icon: Droplet,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            unlocked: totalDonations >= 1
        },
        {
            id: 'lifesaver',
            name: 'Lifesaver',
            desc: 'Completed 5 blood donations.',
            icon: Heart,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            unlocked: totalDonations >= 5
        },
        {
            id: 'local-hero',
            name: 'Local Hero',
            desc: 'Achieved a Trust Score of 80+.',
            icon: Star,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            unlocked: trustScore >= 80
        },
        {
            id: 'rapid-response',
            name: 'Rapid Response',
            desc: 'Accepted a Critical urgency request.',
            icon: Zap,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            unlocked: trustScore >= 70 // Mock condition for now
        },
        {
            id: 'guardian',
            name: 'Guardian',
            desc: 'Completed 10 blood donations.',
            icon: Shield,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            unlocked: totalDonations >= 10
        },
        {
            id: 'legend',
            name: 'Living Legend',
            desc: 'Achieved a perfect Trust Score of 100.',
            icon: Award,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            unlocked: trustScore === 100
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold font-heading" style={{ color: 'var(--text-primary)' }}>
                        Badges & Rewards
                    </h1>
                    <p className="mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Track your impact and unlock achievements as you save lives.
                    </p>
                </div>
            </div>

            {/* Top Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-6 rounded-2xl flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20">
                        <Flame className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Current Trust Score</p>
                        <h3 className="text-3xl font-bold font-heading" style={{ color: 'var(--text-primary)' }}>{trustScore}</h3>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20">
                        <Heart className="w-7 h-7 text-white fill-white border-none" />
                    </div>
                    <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Lives Impacted</p>
                        <h3 className="text-3xl font-bold font-heading" style={{ color: 'var(--text-primary)' }}>{totalDonations * 3}</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>1 donation saves up to 3 lives</p>
                    </div>
                </div>
            </div>

            {/* Badges Grid */}
            <div>
                <h3 className="text-lg font-bold font-heading mb-4" style={{ color: 'var(--text-primary)' }}>Achievement Badges</h3>
                <motion.div 
                    variants={containerVariants} 
                    initial="hidden" 
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
                >
                    {badges.map((badge) => (
                        <motion.div
                            key={badge.id}
                            variants={itemVariants}
                            className="glass-card p-5 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                            style={{ opacity: badge.unlocked ? 1 : 0.6, filter: badge.unlocked ? 'none' : 'grayscale(100%)' }}
                        >
                            {!badge.unlocked && (
                                <div className="absolute top-4 right-4 text-xs font-semibold px-2 py-1 flex items-center gap-1 rounded-md bg-[var(--bg-ghost)]" style={{ color: 'var(--text-muted)' }}>
                                    <Clock className="w-3.5 h-3.5" /> Locked
                                </div>
                            )}
                            
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500 ${badge.unlocked ? badge.bg : 'bg-[var(--bg-ghost)]'} border ${badge.unlocked ? badge.border : 'border-transparent'}`}>
                                <badge.icon className={`w-7 h-7 ${badge.unlocked ? badge.color : 'text-[var(--text-muted)]'}`} />
                            </div>
                            <h4 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                {badge.name}
                            </h4>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                {badge.desc}
                            </p>
                            
                            {/* Decorative background glow */}
                            {badge.unlocked && (
                                <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40 duration-500 ${badge.bg}`} />
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default DonorBadgesPage;
