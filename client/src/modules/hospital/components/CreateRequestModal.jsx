import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { useCreateRequestMutation } from '../../request/requestApi';
import { useAuth } from '../../../hooks/useAuth';

const schema = z.object({
    patientName: z.string().min(1, 'Patient Name required'),
    contactNumber: z.string().min(5, 'Hospital/Patient Contact required'),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    unitsNeeded: z.number({ coerce: true }).min(1).max(20),
    urgency: z.enum(['normal', 'urgent', 'critical']),
    reasonForRequest: z.enum(['Surgery', 'Accident', 'Emergency', 'Other']),
    customReason: z.string().optional(),
    district: z.string().min(2, 'District is required'),
    formattedAddress: z.string().optional(),
    notes: z.string().optional(),
});

const REASONS = ['Surgery', 'Accident', 'Emergency', 'Other'];

export const CreateRequestModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [createRequest, { isLoading }] = useCreateRequestMutation();
    const [serverError, setServerError] = useState('');

    const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            bloodGroup: 'O+',
            unitsNeeded: 1,
            urgency: 'urgent',
            reasonForRequest: 'Emergency',
            district: '',
            formattedAddress: '',
            notes: ''
        }
    });

    const watchedReason = watch('reasonForRequest');

    // Auto-fill hospital location details on load
    useEffect(() => {
        if (isOpen && user?.location) {
            if (user.location.district) setValue('district', user.location.district);
            if (user.location.formattedAddress) setValue('formattedAddress', user.location.formattedAddress);
            if (user.mobile) setValue('contactNumber', user.mobile);
        }
    }, [isOpen, user, setValue]);

    const onSubmit = async (data) => {
        try {
            setServerError('');
            const payload = {
                ...data,
                latitude: user?.location?.coordinates?.[1] || 19.0760, // fallback or precise
                longitude: user?.location?.coordinates?.[0] || 72.8777,
            };
            
            await createRequest(payload).unwrap();
            reset();
            onClose();
        } catch (err) {
            setServerError(err.data?.message || 'Failed to create request');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800 shrink-0">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Create Emergency Blood Request
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-6 scrollbar-hide flex-1">
                        <form id="hospital-req-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {serverError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                    {serverError}
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-bold text-red-500 mb-3 uppercase tracking-wide">Patient & Medical Details</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-zinc-400">Patient Name *</label>
                                        <input {...register('patientName')} className="input-field w-full" placeholder="John Doe" />
                                        {errors.patientName && <span className="text-xs text-red-400">{errors.patientName.message}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-zinc-400">Contact Number *</label>
                                        <input {...register('contactNumber')} className="input-field w-full" placeholder="+1..." />
                                        {errors.contactNumber && <span className="text-xs text-red-400">{errors.contactNumber.message}</span>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-zinc-400">Blood Group *</label>
                                        <select {...register('bloodGroup')} className="input-field w-full">
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-zinc-400">Units Needed *</label>
                                        <input type="number" {...register('unitsNeeded', { valueAsNumber: true })} className="input-field w-full" min="1" max="20" />
                                        {errors.unitsNeeded && <span className="text-xs text-red-400">{errors.unitsNeeded.message}</span>}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-red-500 mb-3 flex justify-between uppercase tracking-wide">
                                    <span>Circumstances</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-zinc-400">Reason *</label>
                                        <select {...register('reasonForRequest')} className="input-field w-full">
                                            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-zinc-400">Urgency *</label>
                                        <select {...register('urgency')} className="input-field w-full text-red-400">
                                            <option value="normal">Normal</option>
                                            <option value="urgent">Urgent</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                </div>
                                {watchedReason === 'Other' && (
                                    <div className="mb-3">
                                        <input {...register('customReason')} className="input-field w-full" placeholder="Specify custom reason..." />
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-red-500 mb-3 flex items-center justify-between uppercase tracking-wide">
                                    <span>Location</span>
                                    {user?.location?.district && <span className="text-xs font-normal text-blue-400 normal-case">Auto-filled</span>}
                                </h3>
                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-1 text-zinc-400">District / City *</label>
                                    <input {...register('district')} className="input-field w-full" />
                                    {errors.district && <span className="text-xs text-red-400">{errors.district.message}</span>}
                                </div>
                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-1 text-zinc-400">Formatted Hospital Address (Optional)</label>
                                    <textarea {...register('formattedAddress')} rows={2} className="input-field w-full resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-zinc-400">Additional Notes (Optional)</label>
                                    <textarea {...register('notes')} rows={2} placeholder="Any room number or doctor details..." className="input-field w-full resize-none" />
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="p-6 border-t border-zinc-800 bg-zinc-900 shrink-0 flex gap-3">
                        <button type="button" onClick={onClose} className="btn-outline flex-1">Cancel</button>
                        <button type="submit" form="hospital-req-form" disabled={isLoading} className="btn-primary flex-1 shadow-red-500/20 shadow-lg">
                            {isLoading ? 'Broadcasting...' : 'Broadcast Immediate Alert'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
