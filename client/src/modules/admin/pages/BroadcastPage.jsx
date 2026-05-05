import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSendBroadcastMutation } from '../adminApi';
import { Radio, Send, Globe, MapPin, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const MAX = 500;

const BroadcastPage = () => {
    const [message, setMessage] = useState('');
    const [scope, setScope] = useState('all');
    const [city, setCity] = useState('');
    const [sent, setSent] = useState(null); // { count }
    const [error, setError] = useState('');

    const [sendBroadcast, { isLoading }] = useSendBroadcastMutation();

    const handleSend = async () => {
        if (!message.trim()) return;
        setError('');
        try {
            const result = await sendBroadcast({ message, scope, city: scope === 'city' ? city : undefined }).unwrap();
            setSent({ count: result.data?.notifiedUsers || 0 });
            setMessage('');
            setCity('');
        } catch (err) {
            setError(err.data?.message || 'Failed to send broadcast');
        }
    };

    return (
        <div className="space-y-5 max-w-2xl">
            <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    Emergency Broadcast
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Send real-time alerts to users via socket and in-app notifications
                </p>
            </div>

            {/* Success state */}
            <AnimatePresence>
                {sent && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-4 rounded-2xl"
                        style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}
                    >
                        <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-green-400">Broadcast sent successfully</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {sent.count} user{sent.count !== 1 ? 's' : ''} notified
                            </p>
                        </div>
                        <button onClick={() => setSent(null)} className="ml-auto cursor-pointer text-xs text-green-400 hover:underline">Dismiss</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Composer */}
            <div className="rounded-2xl p-6 space-y-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}>
                {/* Scope */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Target Audience</p>
                    <div className="flex gap-3">
                        {[
                            { key: 'all', icon: Globe, label: 'All Users' },
                            { key: 'city', icon: MapPin, label: 'Specific City' },
                        ].map(({ key, icon: Icon, label }) => (
                            <button key={key} onClick={() => setScope(key)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all flex-1 justify-center"
                                style={{
                                    background: scope === key ? 'linear-gradient(135deg,#dc2626,#e11d48)' : 'var(--bg-ghost)',
                                    color: scope === key ? '#fff' : 'var(--text-secondary)',
                                    border: `1px solid ${scope === key ? '#dc2626' : 'var(--bg-ghost-border)'}`,
                                    boxShadow: scope === key ? '0 4px 12px rgba(220,38,38,0.25)' : 'none',
                                }}>
                                <Icon className="w-4 h-4" />{label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* City input */}
                <AnimatePresence>
                    {scope === 'city' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                            <input
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                placeholder="Enter city or district name…"
                                style={{
                                    width: '100%', padding: '11px 14px',
                                    background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)',
                                    borderRadius: 10, outline: 'none', color: 'var(--text-primary)', fontSize: 14,
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Message */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Message</p>
                        <span className="text-xs" style={{ color: message.length > MAX * 0.8 ? '#ef4444' : 'var(--text-muted)' }}>
                            {message.length}/{MAX}
                        </span>
                    </div>
                    <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value.slice(0, MAX))}
                        placeholder="Type your emergency alert message here…"
                        rows={5}
                        className="w-full resize-none outline-none text-sm"
                        style={{
                            padding: '12px 14px', background: 'var(--bg-input)',
                            border: '1px solid var(--bg-input-border)', borderRadius: 12,
                            color: 'var(--text-primary)', lineHeight: 1.6,
                        }}
                    />
                </div>

                {/* Preview */}
                {message && (
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                        <p className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />Preview — how users will see it
                        </p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Emergency Broadcast</p>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{message}</p>
                    </div>
                )}

                {/* Error */}
                {error && <p className="text-sm text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</p>}

                {/* Send */}
                <button
                    onClick={handleSend}
                    disabled={isLoading || !message.trim() || (scope === 'city' && !city.trim())}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#dc2626,#e11d48)', color: '#fff', boxShadow: '0 4px 16px rgba(220,38,38,0.3)' }}
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isLoading ? 'Sending…' : 'Send Broadcast'}
                </button>
            </div>
        </div>
    );
};

export default BroadcastPage;
