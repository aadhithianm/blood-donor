import { useState, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoginMutation } from '../authApi';
import { useAuth } from '../../../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, Loader2, Phone, AlertCircle, Check } from 'lucide-react';

/* ── Unified input style ─────────────────────────── */
const mkInputStyle = (err, focused) => ({
    background: 'var(--bg-input)',
    border: `1px solid ${err ? '#ef4444' : focused ? '#dc2626' : 'var(--bg-input-border)'}`,
    color: 'var(--text-primary)',
    boxShadow: err ? '0 0 0 3px rgba(239,68,68,0.12)' : focused ? '0 0 0 3px rgba(220,38,38,0.12)' : 'none',
    borderRadius: '12px',
    outline: 'none',
    width: '100%',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'var(--font-sans)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
});

/* ── Schemas ─────────────────────────────────────── */
const emailSchema = z.object({
    identifier: z.string().email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
});

const phoneSchema = z.object({
    identifier: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
});

const FieldErr = ({ msg }) => (
    <AnimatePresence>
        {msg && (
            <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5"
            >
                <AlertCircle className="w-3 h-3 shrink-0" />{msg}
            </motion.p>
        )}
    </AnimatePresence>
);

/* ── LoginPage ───────────────────────────────────── */
const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loginMutation, { isLoading }] = useLoginMutation();
    const [showPassword, setShowPassword] = useState(false);
    const [loginType, setLoginType] = useState('email');
    const [serverError, setServerError] = useState('');
    const [focused, setFocused] = useState('');
    const uid = useId();

    const schema = loginType === 'email' ? emailSchema : phoneSchema;

    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { identifier: '', password: '', rememberMe: false },
    });

    const currentIdentifier = watch('identifier');
    const rememberMe = watch('rememberMe');

    const switchTab = (type) => {
        setLoginType(type);
        setServerError('');
        reset();
    };

    const onSubmit = async (data) => {
        try {
            setServerError('');
            const payload = loginType === 'email'
                ? { email: data.identifier, password: data.password }
                : { mobile: data.identifier, password: data.password };

            if (data.rememberMe) {
                const deviceId = localStorage.getItem('bl_device_id') || crypto.randomUUID();
                localStorage.setItem('bl_device_id', deviceId);
                payload.deviceId = deviceId;
            }

            const result = await loginMutation(payload).unwrap();

            if (result.data.requiresOTP) {
                navigate('/verify-otp', {
                    state: { email: result.data.email || data.identifier, purpose: 'login' }
                });
                return;
            }

            login({ user: result.data.user, accessToken: result.data.accessToken });
            navigate(`/${result.data.user.role}/dashboard`);
        } catch (err) {
            setServerError(err.data?.message || 'Login failed. Please try again.');
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h2
                    className="text-2xl font-bold mb-1"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Welcome back
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Sign in to your BloodLink account
                </p>
            </div>

            {/* Tab switcher */}
            <div
                className="flex rounded-xl p-1 mb-6"
                style={{ background: 'var(--bg-ghost)', border: '1px solid var(--bg-ghost-border)' }}
            >
                {[
                    { key: 'email', label: 'Email', icon: Mail },
                    { key: 'phone', label: 'Phone', icon: Phone },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => switchTab(key)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
                        style={{
                            background: loginType === key ? 'linear-gradient(135deg,#dc2626,#e11d48)' : 'transparent',
                            color: loginType === key ? '#fff' : 'var(--text-muted)',
                            boxShadow: loginType === key ? '0 2px 8px rgba(220,38,38,0.3)' : 'none',
                        }}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Server error */}
            <AnimatePresence>
                {serverError && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-5"
                    >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {serverError}
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

                {/* Identifier — email or phone */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={loginType}
                        initial={{ opacity: 0, x: loginType === 'email' ? -12 : 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    >
                        <div className="relative w-full">
                            {loginType === 'email' ? (
                                <Mail
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] pointer-events-none z-10"
                                    style={{ color: errors.identifier ? '#ef4444' : focused === 'identifier' ? '#dc2626' : 'var(--text-muted)' }}
                                />
                            ) : (
                                <Phone
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] pointer-events-none z-10"
                                    style={{ color: errors.identifier ? '#ef4444' : focused === 'identifier' ? '#dc2626' : 'var(--text-muted)' }}
                                />
                            )}
                            <input
                                {...register('identifier')}
                                id={`${uid}-identifier`}
                                type={loginType === 'email' ? 'email' : 'tel'}
                                placeholder={loginType === 'email' ? 'Email address' : '10-digit mobile number'}
                                autoComplete={loginType === 'email' ? 'email' : 'tel'}
                                style={{ ...mkInputStyle(errors.identifier, focused === 'identifier'), padding: '12px 16px 12px 42px' }}
                                onFocus={() => setFocused('identifier')}
                                onBlur={() => setFocused('')}
                            />
                        </div>
                        <FieldErr msg={errors.identifier?.message} />
                    </motion.div>
                </AnimatePresence>

                {/* Password */}
                <div>
                    <div className="relative w-full">
                        <Lock
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] pointer-events-none z-10"
                            style={{ color: errors.password ? '#ef4444' : focused === 'password' ? '#dc2626' : 'var(--text-muted)' }}
                        />
                        <input
                            {...register('password')}
                            id={`${uid}-password`}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            autoComplete="current-password"
                            style={{ ...mkInputStyle(errors.password, focused === 'password'), padding: '12px 44px 12px 42px' }}
                            onFocus={() => setFocused('password')}
                            onBlur={() => setFocused('')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            onMouseDown={e => e.preventDefault()}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 cursor-pointer transition-opacity hover:opacity-70"
                            style={{ color: 'var(--text-muted)' }}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <FieldErr msg={errors.password?.message} />
                </div>

                {/* Remember me + Forgot */}
                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <div className="relative flex-shrink-0">
                            <input
                                {...register('rememberMe')}
                                id={`${uid}-rememberMe`}
                                type="checkbox"
                                className="sr-only peer"
                            />
                            <div
                                className="w-[18px] h-[18px] rounded-[5px] border-2 transition-all flex items-center justify-center peer-checked:bg-red-600 peer-checked:border-red-600"
                                style={{ borderColor: 'var(--bg-ghost-border)' }}
                            >
                                {rememberMe && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                            </div>
                        </div>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                            Remember me
                        </span>
                    </label>
                    <Link
                        to="/forgot-password"
                        state={loginType === 'email' ? { email: currentIdentifier } : {}}
                        className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                        Forgot password?
                    </Link>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm mt-2"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoading ? 'Signing in…' : 'Sign In'}
                </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: 'var(--bg-ghost-border)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>New to BloodLink?</span>
                <div className="flex-1 h-px" style={{ background: 'var(--bg-ghost-border)' }} />
            </div>

            <Link
                to="/register"
                className="btn-ghost w-full flex items-center justify-center gap-2 py-3 text-sm"
            >
                Create a free account
            </Link>
        </div>
    );
};

export default LoginPage;
