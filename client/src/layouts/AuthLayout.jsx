import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Droplets, Sun, Moon, Users, Activity, Building2 } from 'lucide-react';
import { useTheme } from '../app/ThemeContext';

const stats = [
    { value: '50K+', label: 'Active Donors', icon: Users },
    { value: '15K+', label: 'Lives Saved', icon: Activity },
    { value: '200+', label: 'Hospitals', icon: Building2 },
];

const AuthLayout = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div
            className="min-h-screen flex transition-colors duration-300"
            style={{ background: 'var(--bg-page)' }}
        >
            {/* ── Left Brand Panel (desktop only) ── */}
            <div
                className="hidden lg:flex flex-col justify-between w-[44%] p-12 relative overflow-hidden"
                style={{ background: 'linear-gradient(160deg, #0f0305 0%, #240808 55%, #0f0305 100%)' }}
            >
                {/* Decorative blobs */}
                <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #dc2626, transparent)' }} />
                <div className="absolute bottom-16 -right-12 w-72 h-72 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #f43f5e, transparent)' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5"
                    style={{ background: 'radial-gradient(circle, #ef4444, transparent)' }} />

                {/* Animated blood-drop SVG watermark */}
                <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-[0.06] animate-float-drop pointer-events-none select-none">
                    <svg width="200" height="270" viewBox="0 0 120 160" fill="none">
                        <path d="M60 0 C60 0 10 70 10 105 C10 133 33 155 60 155 C87 155 110 133 110 105 C110 70 60 0 60 0Z"
                            fill="url(#al-drop)" />
                        <defs>
                            <linearGradient id="al-drop" x1="0" y1="0" x2="120" y2="160" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="100%" stopColor="#7f1d1d" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg"
                            style={{ boxShadow: '0 0 16px rgba(220,38,38,0.4)' }}>
                            <Heart className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="text-xl font-semibold tracking-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                            BloodLink
                        </span>
                    </div>

                    <h2 className="text-[2.6rem] font-bold text-white leading-[1.15] mb-5 tracking-tight"
                        style={{ fontFamily: 'var(--font-heading)' }}>
                        Save Lives.<br />
                        <span className="gradient-text">Give Blood.</span><br />
                        Be a Hero.
                    </h2>
                    <p className="text-zinc-400 text-[0.9rem] leading-relaxed max-w-[260px] font-light">
                        Join thousands of verified donors and help connect lives in critical moments. Every drop counts.
                    </p>
                </div>

                {/* Stats */}
                <div className="relative z-10">
                    <div className="flex gap-6 mb-8">
                        {stats.map(({ value, label, icon: Icon }) => (
                            <div key={label}>
                                <p className="text-2xl font-bold gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>
                                    {value}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <Icon className="w-3 h-3 text-zinc-600" />
                                    <p className="text-zinc-500 text-xs">{label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-700">
                        <Droplets className="w-3.5 h-3.5 text-red-900" />
                        <span>BloodLink — Smart Blood Donor Connectivity Platform</span>
                    </div>
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {/* Mobile header */}
                <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: 'var(--bg-ghost-border)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"
                            style={{ boxShadow: '0 0 10px rgba(220,38,38,0.3)' }}>
                            <Heart className="w-4 h-4 text-white fill-white" />
                        </div>
                        <span className="font-semibold tracking-tight gradient-text" style={{ fontFamily: 'var(--font-heading)' }}>
                            BloodLink
                        </span>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                        style={{ background: 'var(--bg-ghost)', border: '1px solid var(--bg-ghost-border)' }}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark'
                            ? <Sun className="w-4 h-4 text-amber-400" />
                            : <Moon className="w-4 h-4 text-indigo-400" />
                        }
                    </button>
                </div>

                {/* Desktop theme toggle */}
                <div className="hidden lg:flex justify-end px-8 pt-6">
                    <button
                        onClick={toggleTheme}
                        className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                        style={{ background: 'var(--bg-ghost)', border: '1px solid var(--bg-ghost-border)' }}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark'
                            ? <Sun className="w-4 h-4 text-amber-400" />
                            : <Moon className="w-4 h-4 text-indigo-400" />
                        }
                    </button>
                </div>

                {/* Form area */}
                <div className="flex-1 flex items-center justify-center px-6 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="w-full max-w-lg"
                    >
                        <Outlet />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
