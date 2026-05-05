import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useForgotPasswordMutation } from '../authApi';
import { Mail, Loader2, ArrowLeft, CheckCircle, AlertCircle, Send, BadgeCheck } from 'lucide-react';

const schema = z.object({ email: z.string().email('Enter a valid email address') });

const ForgotPasswordPage = () => {
    const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [focused, setFocused] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Auto-prefill email if passed from login page via state
    const prefillEmail = location.state?.email || '';

    const { register, handleSubmit, formState: { errors }, setValue } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: prefillEmail },
    });

    // If email was prefilled, highlight it on mount
    useEffect(() => {
        if (prefillEmail) setValue('email', prefillEmail);
    }, []);

    const onSubmit = async (data) => {
        try {
            setError('');
            await forgotPassword(data).unwrap();
            setSent(true);
        } catch (err) {
            setError(err.data?.message || 'Failed to send reset link. Please try again.');
        }
    };

    if (sent) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Check your inbox!</h2>
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                    If that email is registered, we've sent a reset link.
                </p>
                <p className="text-xs mb-8" style={{ color: 'var(--text-muted)' }}>
                    Check your spam folder if you don't see it in a minute.
                </p>
                <div className="space-y-3">
                    <Link to="/login" className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm">
                        ← Back to Sign In
                    </Link>
                    <button type="button" onClick={() => setSent(false)}
                        className="btn-ghost w-full py-2.5 text-sm">
                        Try a different email
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                    style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}>
                    <Mail className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Forgot password?
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Enter your registered email and we'll send you a reset link.
                </p>
                {prefillEmail && (
                    <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Email pre-filled from your login attempt
                    </p>
                )}
            </div>

            {/* Server error */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: errors.email ? '#ef4444' : focused ? '#ef4444' : 'var(--text-muted)' }} />
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="Email address"
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                            style={{
                                background: 'var(--bg-input)',
                                border: `1px solid ${errors.email ? '#ef4444' : focused ? '#dc2626' : 'var(--bg-input-border)'}`,
                                color: 'var(--text-primary)',
                                boxShadow: focused ? '0 0 0 3px rgba(220,38,38,0.12)' : 'none',
                            }}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                        />
                    </div>
                    <AnimatePresence>
                        {errors.email && (
                            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-1 text-xs text-red-400 mt-1.5">
                                <AlertCircle className="w-3 h-3" />{errors.email.message}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                <button type="submit" disabled={isLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm">
                    {isLoading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                        : <><Send className="w-4 h-4" /> Send Reset Link</>
                    }
                </button>
            </form>

            <div className="text-center mt-6">
                <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm transition-colors cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
