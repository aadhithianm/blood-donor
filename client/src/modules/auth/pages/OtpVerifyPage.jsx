import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useVerifyOtpMutation } from '../authApi';
import { useAuth } from '../../../hooks/useAuth';
import { Loader2, ShieldCheck, RefreshCw, Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const OtpVerifyPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [verifyOtp, { isLoading }] = useVerifyOtpMutation();

    const [otp, setOtp] = useState(Array(6).fill(''));
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef([]);
    const timerRef = useRef(null);

    const email = location.state?.email || '';
    const purpose = location.state?.purpose || 'registration';
    const skippable = location.state?.skippable || false;

    useEffect(() => {
        if (!email) { navigate('/login'); return; }
        inputRefs.current[0]?.focus();
        startCooldown();
        return () => clearInterval(timerRef.current);
    }, []);

    const startCooldown = () => {
        setResendCooldown(60);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(timerRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...otp];
        next[index] = value.slice(-1);
        setOtp(next);
        setError('');
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
        // Auto-submit when all filled
        if (value && index === 5 && next.every(d => d)) {
            submitOtp(next.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const arr = pasted.split('');
            setOtp(arr);
            inputRefs.current[5]?.focus();
            submitOtp(pasted);
        }
    };

    const submitOtp = async (code) => {
        if (code.length !== 6) { setError('Enter all 6 digits'); return; }
        try {
            setError('');
            const result = await verifyOtp({ email, otp: code, purpose }).unwrap();
            setSuccess(true);
            setTimeout(() => {
                login({ user: result.data.user, accessToken: result.data.accessToken });
                navigate(`/${result.data.user.role}/dashboard`);
            }, 1200);
        } catch (err) {
            setError(err.data?.message || 'Invalid OTP. Please try again.');
            // Shake & clear
            setOtp(Array(6).fill(''));
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        submitOtp(otp.join(''));
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        try {
            // Trigger resend via a new register (using forgot-password-style endpoint)
            // For now just restart cooldown — backend already re-sends on re-register
            setError('');
            setOtp(Array(6).fill(''));
            inputRefs.current[0]?.focus();
            startCooldown();
        } catch {
            setError('Failed to resend OTP. Please try again.');
        }
    };

    if (success) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Verified!</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Redirecting to your dashboard…</p>
            </motion.div>
        );
    }

    const allFilled = otp.every(d => d !== '');

    return (
        <div>
            {/* Header */}
            <div className="text-center mb-8">
                <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-lg"
                    style={{ boxShadow: '0 0 20px rgba(220,38,38,0.3)' }}
                >
                    <ShieldCheck className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {purpose === 'login' ? 'Login Verification' : 'Verify Your Email'}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Enter the 6-digit code sent to
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                    <Mail className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{email}</span>
                </div>
            </div>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-5"
                    >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
                {/* OTP Inputs */}
                <div className="flex gap-2.5 justify-center mb-6" onPaste={handlePaste}>
                    {otp.map((digit, i) => (
                        <motion.input
                            key={i}
                            ref={el => (inputRefs.current[i] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            whileFocus={{ scale: 1.05 }}
                            className="w-12 h-14 text-center text-xl font-bold rounded-xl transition-all duration-200 outline-none"
                            style={{
                                background: 'var(--bg-input)',
                                border: `2px solid ${digit ? '#dc2626' : error ? '#ef4444' : 'var(--bg-input-border)'}`,
                                color: 'var(--text-primary)',
                                boxShadow: digit ? '0 0 0 3px rgba(220,38,38,0.12)' : 'none',
                            }}
                        />
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !allFilled}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm mb-4"
                    style={{ opacity: (!allFilled && !isLoading) ? 0.5 : 1 }}
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    {isLoading ? 'Verifying…' : 'Verify OTP'}
                </button>
            </form>

            {/* Resend */}
            <div className="text-center mb-4">
                {resendCooldown > 0 ? (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Resend code in{' '}
                        <span className="font-semibold text-red-400">{resendCooldown}s</span>
                    </p>
                ) : (
                    <button type="button" onClick={handleResend}
                        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors mx-auto cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Resend OTP
                    </button>
                )}
            </div>

            {/* Skip option for non-mandatory roles */}
            {skippable && (
                <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-ghost)', border: '1px solid var(--bg-ghost-border)' }}>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        You can skip now and verify your email later from your dashboard.
                    </p>
                    <button type="button"
                        onClick={async () => {
                            // Skip OTP — partially log in without verified status
                            navigate('/login');
                        }}
                        className="text-xs font-medium text-red-400 hover:text-red-300 cursor-pointer">
                        Skip for now →
                    </button>
                </div>
            )}

            <div className="text-center mt-5">
                <Link to="/login" className="flex items-center justify-center gap-1 text-xs cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
            </div>

            <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                Verification code is also printed in the server terminal
            </p>
        </div>
    );
};

export default OtpVerifyPage;
