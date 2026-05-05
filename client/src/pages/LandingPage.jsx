import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, MapPin, Shield, Users, Zap, ArrowRight, Droplets,
    Activity, Clock, Star, Sun, Moon, Menu, X, Home,
    ChevronUp, Quote, CheckCircle, Phone, Twitter,
    Instagram, Github, Linkedin, Info, Layers
} from 'lucide-react';
import { useTheme } from '../app/ThemeContext';

/* ─── Data ─────────────────────────────────────── */
const features = [
    { icon: MapPin, title: 'Live Tracking', desc: 'Track donor location in real-time on interactive maps', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Zap, title: 'Instant Matching', desc: 'AI-powered matching connects you with the nearest verified donors', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { icon: Shield, title: 'Verified Network', desc: 'Every donor is hospital-verified for safety and trust', color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: Clock, title: 'Real-time Alerts', desc: 'Multi-channel notifications via SMS, WhatsApp, email & in-app', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: Activity, title: 'Smart Analytics', desc: 'Comprehensive dashboards for hospitals and administrators', color: 'text-red-400', bg: 'bg-red-500/10' },
    { icon: Star, title: 'Trust System', desc: 'Gamified trust scores, badges, and donation streaks', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

const stats = [
    { value: '50K+', label: 'Active Donors' },
    { value: '15K+', label: 'Lives Saved' },
    { value: '200+', label: 'Partner Hospitals' },
    { value: '98%', label: 'Fulfillment Rate' },
];

const steps = [
    { icon: Phone, num: '01', title: 'Request Blood', desc: 'Submit a blood request in seconds — specify type, location and urgency.' },
    { icon: Zap, num: '02', title: 'AI Matches You', desc: 'Our engine instantly finds the closest verified, available donors.' },
    { icon: Heart, num: '03', title: 'Save a Life', desc: 'Donor is alerted, reaches you in time. Every drop counts.' },
];

const testimonials = [
    { name: 'Priya Sharma', role: 'Blood Recipient', type: 'A+', stars: 5, text: 'BloodLink found a matching donor for my father within 12 minutes during a critical surgery. I cannot put into words how grateful I am.' },
    {
        name: 'Rahul Mehta', role: 'Regular Donor', type: 'O-', stars: 5, text: "The app makes it so easy to see when someone nearby needs my blood group. I've donated 9 times through BloodLink this year alone."
    },
    { name: 'Dr. Anjali Rao', role: 'Hospital Partner', type: 'B+', stars: 5, text: 'As a hospital, BloodLink has reduced our emergency blood sourcing time by 70%. The verified donor network is the best we\'ve seen.' },
];

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const tickerAlerts = [
    '🚨 Urgent: O- needed at AIIMS Delhi',
    '💉 B+ donor required in Mumbai Central',
    '⚡ AB- critically needed in Bangalore',
    '🩸 A+ request — 2 units needed in Hyderabad',
    '🚑 Platelets urgent at Chennai hospital',
    '🔴 O+ needed — Kolkata Medical College',
    '🚨 Urgent: O- needed at AIIMS Delhi',
    '💉 B+ donor required in Mumbai Central',
    '⚡ AB- critically needed in Bangalore',
    '🩸 A+ request — 2 units needed in Hyderabad',
    '🚑 Platelets urgent at Chennai hospital',
    '🔴 O+ needed — Kolkata Medical College',
];

const navLinks = [
    { href: '#features', label: 'Features', icon: Layers },
    { href: '#how-it-works', label: 'How It Works', icon: Info },
    { href: '#testimonials', label: 'Testimonials', icon: Quote },
];

const bottomTabs = [
    { href: '#hero', label: 'Home', icon: Home },
    { href: '#features', label: 'Features', icon: Layers },
    { href: '#how-it-works', label: 'How It Works', icon: Info },
    { href: '#join', label: 'Join Us', icon: Heart },
];

/* ─── Component ─────────────────────────────────── */
const LandingPage = () => {
    const { theme, toggleTheme } = useTheme();
    const [scrollY, setScrollY] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [activeTab, setActiveTab] = useState('#hero');
    const drawerRef = useRef(null);

    // Scroll tracking
    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            const h = document.documentElement.scrollHeight - window.innerHeight;
            setScrollY(y);
            setScrollProgress(h > 0 ? (y / h) * 100 : 0);
            setShowScrollTop(y > 300);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close drawer on outside click
    useEffect(() => {
        const handler = (e) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target)) {
                setDrawerOpen(false);
            }
        };
        if (drawerOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [drawerOpen]);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const handleNavClick = (href) => {
        setActiveTab(href);
        setDrawerOpen(false);
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    const isScrolled = scrollY > 40;

    return (
        <div
            id="hero"
            style={{ background: 'var(--bg-page)' }}
            className="min-h-screen transition-colors duration-300"
        >
            {/* ── Scroll Progress Bar ── */}
            <div
                className="fixed top-0 left-0 h-[3px] z-[60] transition-all duration-100"
                style={{
                    width: `${scrollProgress}%`,
                    background: 'linear-gradient(90deg, #dc2626, #f97316)',
                    boxShadow: '0 0 8px rgba(220,38,38,0.5)',
                }}
            />

            {/* ═══════════════════════════════════════
                NAVBAR
            ═══════════════════════════════════════ */}
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? 'shadow-lg backdrop-blur-xl'
                    : ''
                    }`}
                style={{
                    background: isScrolled ? 'var(--bg-nav)' : 'transparent',
                    borderBottom: isScrolled ? '1px solid var(--bg-card-border)' : 'none',
                    paddingTop: '3px',
                }}
            >
                <div className="flex items-center justify-between px-6 lg:px-16 py-3.5">
                    {/* Logo */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md animate-pulse-glow">
                            <Heart className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold gradient-text">BloodLink</span>
                    </div>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map(({ href, label }) => (
                            <button
                                key={href}
                                onClick={() => handleNavClick(href)}
                                className="text-sm font-medium transition-colors duration-200 cursor-pointer"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        {/* Dark/Light Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
                            style={{
                                background: 'var(--bg-ghost)',
                                border: '1px solid var(--bg-ghost-border)',
                            }}
                            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <AnimatePresence mode="wait">
                                {theme === 'dark' ? (
                                    <motion.span
                                        key="sun"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Sun className="w-4 h-4 text-amber-400" />
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="moon"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Moon className="w-4 h-4 text-indigo-400" />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>

                        {/* Auth buttons (hidden on very small screens) */}
                        <Link to="/login" className="btn-ghost text-sm hidden sm:inline-flex">Sign In</Link>
                        <Link to="/register" className="btn-primary text-sm hidden sm:inline-flex items-center gap-1">
                            Get Started <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        {/* Hamburger (mobile) */}
                        <button
                            onClick={() => setDrawerOpen(v => !v)}
                            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                            style={{ background: 'var(--bg-ghost)', border: '1px solid var(--bg-ghost-border)' }}
                        >
                            {drawerOpen ? <X className="w-4 h-4" style={{ color: 'var(--text-primary)' }} /> : <Menu className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />}
                        </button>
                    </div>
                </div>

                {/* ── Mobile Drawer ── */}
                <AnimatePresence>
                    {drawerOpen && (
                        <motion.div
                            ref={drawerRef}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="md:hidden overflow-hidden"
                            style={{
                                background: 'var(--bg-drawer)',
                                borderTop: '1px solid var(--bg-card-border)',
                            }}
                        >
                            <div className="px-6 py-5 flex flex-col gap-1">
                                {navLinks.map(({ href, label, icon: Icon }) => (
                                    <button
                                        key={href}
                                        onClick={() => handleNavClick(href)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all cursor-pointer"
                                        style={{ color: 'var(--text-primary)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-ghost-hover)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <Icon className="w-4 h-4 text-red-400" />
                                        {label}
                                    </button>
                                ))}
                                <div className="border-t mt-2 pt-4 flex flex-col gap-2" style={{ borderColor: 'var(--bg-card-border)' }}>
                                    <Link to="/login" className="btn-ghost text-sm text-center" onClick={() => setDrawerOpen(false)}>Sign In</Link>
                                    <Link to="/register" className="btn-primary text-sm text-center flex items-center justify-center gap-2" onClick={() => setDrawerOpen(false)}>
                                        <Heart className="w-4 h-4" /> Get Started
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* ═══════════════════════════════════════
                HERO
            ═══════════════════════════════════════ */}
            <section className="relative px-6 lg:px-16 pt-36 pb-24 text-center max-w-5xl mx-auto overflow-hidden">
                {/* Animated grid bg */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(220,38,38,0.07) 1px, transparent 1px)`,
                        backgroundSize: '32px 32px',
                    }}
                />

                {/* Floating blood drop SVG */}
                <div className="absolute right-8 top-20 opacity-20 lg:opacity-30 pointer-events-none hidden sm:block animate-float-drop">
                    <svg width="120" height="160" viewBox="0 0 120 160" fill="none">
                        <path d="M60 0 C60 0 10 70 10 105 C10 133 33 155 60 155 C87 155 110 133 110 105 C110 70 60 0 60 0Z" fill="url(#bloodGrad)" />
                        <defs>
                            <linearGradient id="bloodGrad" x1="0" y1="0" x2="120" y2="160" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#ef4444" />
                                <stop offset="100%" stopColor="#7f1d1d" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div className="absolute left-8 bottom-24 opacity-10 lg:opacity-20 pointer-events-none hidden sm:block animate-float-drop" style={{ animationDelay: '1.8s' }}>
                    <svg width="70" height="95" viewBox="0 0 120 160" fill="none">
                        <path d="M60 0 C60 0 10 70 10 105 C10 133 33 155 60 155 C87 155 110 133 110 105 C110 70 60 0 60 0Z" fill="url(#bloodGrad2)" />
                        <defs>
                            <linearGradient id="bloodGrad2" x1="0" y1="0" x2="120" y2="160" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#f43f5e" />
                                <stop offset="100%" stopColor="#991b1b" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                    {/* Urgency badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/25 bg-red-500/8 text-red-400 text-sm mb-6 animate-pulse">
                        <Droplets className="w-4 h-4" /> Saving Lives, One Drop at a Time
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6" style={{ color: 'var(--text-primary)' }}>
                        Smart Blood Donor<br />
                        <span className="gradient-text">Connectivity Platform</span>
                    </h1>
                    <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-secondary)' }}>
                        Connect with verified blood donors in real-time. Our intelligent matching system ensures
                        the right blood reaches the right person at the right time.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
                            <Heart className="w-5 h-5" /> Become a Donor
                        </Link>
                        <Link to="/register" className="btn-ghost text-lg px-8 py-3">
                            Request Blood
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════
                URGENCY TICKER
            ═══════════════════════════════════════ */}
            <div
                className="py-3 overflow-hidden"
                style={{
                    background: 'var(--bg-ticker)',
                    borderTop: '1px solid rgba(220,38,38,0.12)',
                    borderBottom: '1px solid rgba(220,38,38,0.12)',
                }}
            >
                <div className="flex animate-ticker whitespace-nowrap">
                    {tickerAlerts.map((alert, i) => (
                        <span key={i} className="text-sm text-red-400 mx-8 font-medium flex-shrink-0">
                            {alert}
                        </span>
                    ))}
                </div>
            </div>

            {/* ═══════════════════════════════════════
                STATS
            ═══════════════════════════════════════ */}
            <section className="px-6 lg:px-16 py-20">
                <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-6 text-center hover:scale-105 transition-transform duration-200"
                        >
                            <p className="text-3xl font-bold gradient-text">{s.value}</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════════════
                FEATURES
            ═══════════════════════════════════════ */}
            <section id="features" className="px-6 lg:px-16 pb-24 scroll-mt-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Why Choose BloodLink?</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Built with cutting-edge technology for maximum impact</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="glass-card p-6 hover:scale-[1.02] hover:border-red-500/20 transition-all group cursor-default"
                            >
                                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <f.icon className={`w-6 h-6 ${f.color}`} />
                                </div>
                                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                HOW IT WORKS
            ═══════════════════════════════════════ */}
            <section id="how-it-works" className="px-6 lg:px-16 pb-24 scroll-mt-20">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>How It Works</h2>
                        <p style={{ color: 'var(--text-muted)' }}>From request to rescue in three simple steps</p>
                    </div>
                    <div className="relative grid md:grid-cols-3 gap-8">
                        {/* Connecting line (desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px" style={{ background: 'linear-gradient(90deg, #dc2626, #f97316, #dc2626)' }} />
                        {steps.map((step, i) => (
                            <motion.div
                                key={step.num}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="glass-card p-8 text-center relative"
                            >
                                {/* Number badge */}
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                    {step.num}
                                </div>
                                <div className="w-14 h-14 rounded-2xl gradient-primary bg-opacity-10 flex items-center justify-center mx-auto mb-5 mt-3 shadow-md">
                                    <step.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                TESTIMONIALS
            ═══════════════════════════════════════ */}
            <section id="testimonials" className="px-6 lg:px-16 pb-24 scroll-mt-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Real Stories, Real Impact</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Thousands of lives transformed by BloodLink</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={t.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.12 }}
                                className="glass-card p-7 flex flex-col gap-4 hover:scale-[1.02] transition-transform"
                            >
                                <Quote className="w-7 h-7 text-red-400 opacity-70" />
                                <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text-secondary)' }}>"{t.text}"</p>
                                {/* Stars */}
                                <div className="flex gap-0.5">
                                    {Array.from({ length: t.stars }).map((_, si) => (
                                        <Star key={si} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                {/* Author */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.role}</p>
                                    </div>
                                    <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full text-red-400" style={{ background: 'rgba(220,38,38,0.1)' }}>
                                        {t.type}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                CTA
            ═══════════════════════════════════════ */}
            <section id="join" className="px-6 lg:px-16 pb-20 scroll-mt-20">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto glass-card p-12 text-center relative overflow-hidden"
                >
                    {/* Blood type badges */}
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                        {bloodTypes.map((bt) => (
                            <span
                                key={bt}
                                className="text-xs font-bold px-3 py-1.5 rounded-full text-red-400"
                                style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}
                            >
                                {bt}
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-green-400 font-medium">Donors needed right now in your city</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Ready to Save Lives?</h2>
                    <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Join thousands of donors making a difference every day</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link to="/register" className="btn-primary text-lg px-10 py-3 inline-flex items-center gap-2">
                            <Heart className="w-5 h-5" /> Join BloodLink Today
                        </Link>
                        <Link to="/login" className="btn-ghost text-lg px-8 py-3">
                            Sign In
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════ */}
            <footer
                className="px-6 lg:px-16 pt-12 pb-24 md:pb-12"
                style={{ borderTop: '1px solid var(--border-footer)' }}
            >
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                                <Heart className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold gradient-text">BloodLink</span>
                        </div>
                        <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>
                            Smart Blood Donor Connectivity Platform — bridging the gap between donors and those in need.
                        </p>
                        <div className="flex gap-3">
                            {[Twitter, Instagram, Github, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                    style={{ background: 'var(--bg-ghost)', border: '1px solid var(--bg-ghost-border)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-ghost)'}
                                >
                                    <Icon className="w-4 h-4 text-red-400" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Platform</h4>
                        <ul className="space-y-2.5">
                            {['Become a Donor', 'Request Blood', 'Hospital Portal', 'Admin Dashboard'].map(l => (
                                <li key={l}>
                                    <a href="#" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                    >{l}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Company</h4>
                        <ul className="space-y-2.5">
                            {['About Us', 'Blog', 'Careers', 'Contact'].map(l => (
                                <li key={l}>
                                    <a href="#" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                    >{l}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Legal</h4>
                        <ul className="space-y-2.5">
                            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Disclaimer'].map(l => (
                                <li key={l}>
                                    <a href="#" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                    >{l}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div
                    className="pt-6 text-center text-sm"
                    style={{ borderTop: '1px solid var(--border-footer)', color: 'var(--text-muted)' }}
                >
                    © {new Date().getFullYear()} BloodLink. Smart Blood Donor Connectivity Platform. All rights reserved.
                </div>
            </footer>

            {/* ═══════════════════════════════════════
                MOBILE BOTTOM TAB BAR
            ═══════════════════════════════════════ */}
            <div
                className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bottom-nav-safe"
                style={{
                    background: 'var(--bg-tab-bar)',
                    borderTop: '1px solid var(--bg-tab-bar-border)',
                }}
            >
                <div className="grid grid-cols-4 h-16">
                    {bottomTabs.map(({ href, label, icon: Icon }) => {
                        const isActive = activeTab === href;
                        return (
                            <button
                                key={href}
                                onClick={() => handleNavClick(href)}
                                className="flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer"
                                style={{ color: isActive ? '#ef4444' : 'var(--text-muted)' }}
                            >
                                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                                <span className="text-[10px] font-medium">{label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="tab-indicator"
                                        className="absolute top-0 w-8 h-0.5 rounded-full"
                                        style={{ background: '#ef4444' }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ═══════════════════════════════════════
                SCROLL TO TOP FAB
            ═══════════════════════════════════════ */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onClick={scrollToTop}
                        className="fixed bottom-24 md:bottom-8 right-6 w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg cursor-pointer z-40 hover:scale-110 transition-transform"
                        title="Back to top"
                    >
                        <ChevronUp className="w-5 h-5 text-white" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingPage;
