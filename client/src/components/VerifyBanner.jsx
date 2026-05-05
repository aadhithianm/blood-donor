import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { selectUser } from '../modules/auth/authSlice';
import { Mail, X, ShieldCheck } from 'lucide-react';

/**
 * Shown inside the dashboard whenever the logged-in user has not verified
 * their email. Provides a direct link to the OTP verification page.
 * Dismissible for the current session (does not persist — shows again on reload).
 */
const VerifyBanner = () => {
    const user = useSelector(selectUser);
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState(false);

    // Only show for unverified users
    if (!user || user.isEmailVerified || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="mx-4 lg:mx-8 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                style={{
                    background: 'rgba(234,179,8,0.08)',
                    border: '1px solid rgba(234,179,8,0.25)',
                    color: '#fbbf24',
                }}
            >
                <Mail className="w-4 h-4 shrink-0" />
                <p className="flex-1">
                    Your email isn't verified yet.{' '}
                    <button
                        type="button"
                        onClick={() => navigate('/verify-otp', {
                            state: { email: user.email, purpose: 'registration' },
                        })}
                        className="font-semibold underline underline-offset-2 cursor-pointer hover:text-yellow-300 transition-colors"
                    >
                        Verify now
                    </button>
                    {' '}to unlock all features.
                </p>
                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4" />
                </button>
            </motion.div>
        </AnimatePresence>
    );
};

export default VerifyBanner;
