import { useNavigate } from 'react-router-dom';
import { Mail, ShieldAlert, ArrowRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectUser } from '../authSlice';
import { motion } from 'framer-motion';

const VerifyAccountPage = () => {
    const navigate = useNavigate();
    const user = useSelector(selectUser);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full p-8 rounded-2xl bg-card border border-border text-center shadow-sm"
            >
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                
                <h1 className="text-2xl font-bold mb-2">Account Not Verified</h1>
                
                <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
                    Your email address <strong>{user?.email}</strong> must be verified before you can access the dashboard and use BloodLink's core features.
                </p>
                
                <button
                    onClick={() => navigate('/verify-otp', {
                        state: { email: user?.email, purpose: 'login' },
                    })}
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                    <Mail className="w-4 h-4" />
                    Verify Now
                    <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Wrong email or need support? <a href="#" className="font-medium hover:underline text-red-400">Contact Support</a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyAccountPage;
