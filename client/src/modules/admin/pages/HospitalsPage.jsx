import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetPendingHospitalsQuery, useVerifyHospitalMutation } from '../adminApi';
import { Building2, MapPin, Phone, FileText, BadgeCheck, XCircle, Loader2, CheckCircle, Clock } from 'lucide-react';

const HospitalsPage = () => {
    const { data, isLoading } = useGetPendingHospitalsQuery();
    const [verifyHospital, { isLoading: verifying }] = useVerifyHospitalMutation();
    const [actionTarget, setActionTarget] = useState(null); // { id, action }
    const [rejectReason, setRejectReason] = useState('');

    const hospitals = data?.data || [];

    const handleVerify = async (id, action) => {
        try {
            await verifyHospital({ id, action }).unwrap();
            setActionTarget(null);
            setRejectReason('');
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    Hospital Verification
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Review and verify hospital registration requests
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#ef4444' }} />
                </div>
            ) : hospitals.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 rounded-2xl"
                    style={{ border: '1px dashed var(--bg-ghost-border)' }}
                >
                    <CheckCircle className="w-10 h-10 mb-3" style={{ color: '#22c55e' }} />
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>All caught up!</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>No pending hospital verifications</p>
                </motion.div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {hospitals.map((h, i) => (
                        <motion.div key={h._id}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="rounded-2xl p-5 space-y-4"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-ghost-border)' }}
                        >
                            {/* Header */}
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(139,92,246,0.1)' }}>
                                    <Building2 className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                        {h.hospitalName || h.userId?.name}
                                    </p>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                                        <Clock className="w-2.5 h-2.5 inline mr-1" />Pending
                                    </span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {h.licenceNumber && (
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                                        <span>Licence: <span className="font-mono font-medium">{h.licenceNumber}</span></span>
                                    </div>
                                )}
                                {(h.street || h.city) && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                                        <span className="truncate">{[h.street, h.city, h.state].filter(Boolean).join(', ')}</span>
                                    </div>
                                )}
                                {h.contactNumber && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                                        <span>{h.contactNumber}</span>
                                    </div>
                                )}
                                <div className="pt-1 border-t text-[11px]" style={{ borderColor: 'var(--bg-ghost-border)', color: 'var(--text-muted)' }}>
                                    Registered: {new Date(h.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </div>

                            {/* Reject reason (inline) */}
                            <AnimatePresence>
                                {actionTarget?.id === h._id && actionTarget.action === 'reject' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <textarea
                                            value={rejectReason}
                                            onChange={e => setRejectReason(e.target.value)}
                                            placeholder="Reason for rejection (optional)…"
                                            rows={2}
                                            className="w-full text-xs p-2.5 rounded-lg resize-none outline-none"
                                            style={{
                                                background: 'var(--bg-input)', border: '1px solid var(--bg-input-border)',
                                                color: 'var(--text-primary)',
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Actions */}
                            <div className="flex gap-2 pt-1">
                                {actionTarget?.id === h._id && actionTarget.action === 'reject' ? (
                                    <>
                                        <button onClick={() => setActionTarget(null)}
                                            className="flex-1 py-2 rounded-xl text-xs font-medium cursor-pointer"
                                            style={{ background: 'var(--bg-ghost)', color: 'var(--text-secondary)', border: '1px solid var(--bg-ghost-border)' }}>
                                            Cancel
                                        </button>
                                        <button onClick={() => handleVerify(h._id, 'reject')} disabled={verifying}
                                            className="flex-1 py-2 rounded-xl text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5"
                                            style={{ background: '#dc2626', color: '#fff' }}>
                                            {verifying && <Loader2 className="w-3 h-3 animate-spin" />}
                                            Confirm Reject
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setActionTarget({ id: h._id, action: 'reject' })}
                                            className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                                            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                            <XCircle className="w-3.5 h-3.5" />Reject
                                        </button>
                                        <button
                                            onClick={() => handleVerify(h._id, 'approve')} disabled={verifying}
                                            className="flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                                            style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                                            {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
                                            Approve
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HospitalsPage;
