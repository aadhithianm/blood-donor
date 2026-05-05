import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const STYLES = {
    success: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)' },
    error: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
    warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
    info: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
};

let externalPush = null;

export const useToast = () => {
    const push = useCallback((message, type = 'info', duration = 4000) => {
        externalPush?.({ id: Date.now() + Math.random(), message, type, duration });
    }, []);

    return {
        success: (msg) => push(msg, 'success'),
        error: (msg) => push(msg, 'error'),
        warning: (msg) => push(msg, 'warning'),
        info: (msg) => push(msg, 'info'),
    };
};

export const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    // Register push function globally
    externalPush = useCallback((toast) => {
        setToasts(prev => [...prev.slice(-4), toast]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.duration);
    }, []);

    const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5" style={{ minWidth: 300, maxWidth: 380 }}>
            <AnimatePresence>
                {toasts.map((toast) => {
                    const Icon = ICONS[toast.type] || Info;
                    const s = STYLES[toast.type] || STYLES.info;
                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 40, scale: 0.92 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 40, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            className="flex items-start gap-3 p-4 rounded-2xl shadow-xl"
                            style={{ background: s.bg, border: `1px solid ${s.border}`, backdropFilter: 'blur(12px)' }}
                        >
                            <Icon className="w-4.5 h-4.5 mt-0.5 shrink-0 w-[18px] h-[18px]" style={{ color: s.color }} />
                            <p className="text-sm flex-1 font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
                                {toast.message}
                            </p>
                            <button onClick={() => dismiss(toast.id)}
                                className="cursor-pointer shrink-0 hover:opacity-60 transition-opacity mt-0.5"
                                style={{ color: 'var(--text-muted)' }}>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
