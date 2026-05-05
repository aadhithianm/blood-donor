import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateRequestMutation } from '../../request/requestApi';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { useAuth } from '../../../hooks/useAuth';
import { Tooltip } from '../../../components/Tooltip';
import { Droplets, MapPin, AlertTriangle, Loader2, Navigation, ShieldAlert, ArrowRight, ArrowLeft, CheckCircle, Upload } from 'lucide-react';

const REASONS = ['Surgery', 'Accident', 'Emergency', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const schema = z.object({
    patientName: z.string().min(1, 'Patient Name required'),
    contactNumber: z.string().min(5, 'Valid contact number required'),
    bloodGroup: z.string().min(1, 'Blood group required'),
    unitsNeeded: z.number({ coerce: true }).int().min(1).max(20),
    reasonForRequest: z.enum(['Surgery', 'Accident', 'Emergency', 'Other']),
    customReason: z.string().optional(),
    urgency: z.enum(['normal', 'urgent', 'critical']).optional(),
    proofDocumentUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    district: z.string().min(1, 'District required'),
    formattedAddress: z.string().optional(),
    notes: z.string().max(500).optional(),
});

const CreateRequestPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [createRequest, { isLoading }] = useCreateRequestMutation();
    const { position, loading: geoLoading, getPosition } = useGeolocation();
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const [isUploading, setIsUploading] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { urgency: 'normal', unitsNeeded: 1 },
    });

    const watchedReason = watch('reasonForRequest');

    // Auto-fill from user profile
    useEffect(() => {
        if (user) {
            if (user.mobile) setValue('contactNumber', user.mobile);
            if (user.location?.district) setValue('district', user.location.district);
            if (user.location?.formattedAddress) setValue('formattedAddress', user.location.formattedAddress);
        }
    }, [user, setValue]);

    const handleNext = async () => {
        let fieldsToValidate = [];
        if (step === 1) fieldsToValidate = ['patientName', 'contactNumber', 'bloodGroup', 'unitsNeeded'];
        if (step === 2) fieldsToValidate = ['reasonForRequest', 'customReason', 'urgency', 'proofDocumentUrl'];
        
        const isStepValid = await trigger(fieldsToValidate);
        if (isStepValid) setStep(s => s + 1);
    };

    const handlePrev = () => setStep(s => s - 1);

    const onSubmit = async (data) => {
        if (!position && !user?.location?.coordinates?.length) {
            setError('Location verification required. Please click "Detect Location".');
            return;
        }
        try {
            setError('');
            await createRequest({
                ...data,
                latitude: position?.latitude || user?.location?.coordinates?.[1] || 0,
                longitude: position?.longitude || user?.location?.coordinates?.[0] || 0,
            }).unwrap();
            navigate('/requester/history');
        } catch (err) {
            setError(err.data?.message || 'Failed to create request');
        }
    };

    const handleSimulatedUpload = () => {
        setIsUploading(true);
        // Simulate an upload delay of 2 seconds then set a mock URL
        setTimeout(() => {
            setValue('proofDocumentUrl', 'https://example.com/mock-medical-document.pdf', { shouldValidate: true });
            setIsUploading(false);
        }, 2000);
    };

    if (!user?.isVerified) {
        return (
            <div className="max-w-xl">
                <div className="glass-card p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold">Verification Required</h2>
                    <p className="text-zinc-400 text-sm">You must wait for admin approval and verify your email before creating emergency blood requests.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Droplets className="w-6 h-6 text-red-400" /> Create Blood Request
                </h1>
                <p className="text-zinc-500 mt-1">Multi-step intelligent request system to find donors faster.</p>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">{error}</div>}

            {/* Stepper Header */}
            <div className="flex items-center justify-between mb-8 px-2 relative">
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-zinc-800 -z-10 -translate-y-1/2"></div>
                <div className="absolute left-0 top-1/2 h-0.5 bg-red-500 transition-all duration-500 -z-10 -translate-y-1/2" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
                
                {[1, 2, 3].map(num => (
                    <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= num ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-zinc-900 border-2 border-zinc-800 text-zinc-500'}`}>
                        {step > num ? <CheckCircle className="w-5 h-5" /> : num}
                    </div>
                ))}
            </div>

            <motion.div className="glass-card overflow-hidden">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-5">
                                <h3 className="font-bold text-lg border-b border-zinc-800 pb-2 mb-4">Patient Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-sm text-zinc-400 mb-2 block">Patient Name *</label>
                                        <input {...register('patientName')} className="input-field" placeholder="Full name of patient" />
                                        {errors.patientName && <p className="text-red-400 text-xs mt-1">{errors.patientName.message}</p>}
                                    </div>
                                    <div>
                                        <label className="text-sm text-zinc-400 mb-2 block">Hospital/Attendant Contact *</label>
                                        <input {...register('contactNumber')} className="input-field" placeholder="Contact number" />
                                        {errors.contactNumber && <p className="text-red-400 text-xs mt-1">{errors.contactNumber.message}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Blood Group *</label>
                                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                                        {BLOOD_GROUPS.map((bg) => (
                                            <label key={bg} className="relative cursor-pointer">
                                                <input type="radio" value={bg} {...register('bloodGroup')} className="peer sr-only" />
                                                <div className="p-2.5 text-center text-sm rounded-xl border border-zinc-800 peer-checked:border-red-500 peer-checked:bg-red-500/10 peer-checked:text-red-400 text-zinc-400 hover:border-zinc-600 transition-all font-bold">
                                                    {bg}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.bloodGroup && <p className="text-red-400 text-xs mt-1">{errors.bloodGroup.message}</p>}
                                </div>

                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Units Needed *</label>
                                    <input {...register('unitsNeeded')} type="number" min="1" max="20" className="input-field w-full md:w-1/3" />
                                    {errors.unitsNeeded && <p className="text-red-400 text-xs mt-1">{errors.unitsNeeded.message}</p>}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-5">
                                <h3 className="font-bold text-lg border-b border-zinc-800 pb-2 mb-4">Medical Details</h3>
                                
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Reason For Request *</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {REASONS.map((r) => (
                                            <label key={r} className="relative cursor-pointer">
                                                <input type="radio" value={r} {...register('reasonForRequest')} className="peer sr-only" />
                                                <div className="p-3 text-center text-sm rounded-xl border border-zinc-800 peer-checked:border-blue-500 peer-checked:bg-blue-500/10 peer-checked:text-blue-400 text-zinc-400 font-medium transition-all">
                                                    {r}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.reasonForRequest && <p className="text-red-400 text-xs mt-1">{errors.reasonForRequest.message}</p>}
                                </div>

                                {watchedReason === 'Other' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                        <input {...register('customReason')} className="input-field" placeholder="Please specify..." />
                                    </motion.div>
                                )}

                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Urgency Level</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['normal', 'urgent', 'critical'].map((level) => (
                                            <label key={level} className="cursor-pointer">
                                                <input type="radio" value={level} {...register('urgency')} className="peer sr-only" />
                                                <div className={`p-3 flex items-center justify-center gap-2 text-sm rounded-xl border transition-all capitalize
                                                    ${level === 'critical' ? 'peer-checked:border-red-500 peer-checked:bg-red-500/10 peer-checked:text-red-400' :
                                                      level === 'urgent' ? 'peer-checked:border-amber-500 peer-checked:bg-amber-500/10 peer-checked:text-amber-400' :
                                                      'peer-checked:border-green-500 peer-checked:bg-green-500/10 peer-checked:text-green-400'}
                                                    border-zinc-800 text-zinc-400`}>
                                                    {level === 'critical' && <AlertTriangle className="w-4 h-4" />}
                                                    {level}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Proof Document (Optional link to Prescription)</label>
                                    <div className="flex gap-2">
                                        <input {...register('proofDocumentUrl')} className="input-field flex-1" placeholder="https://..." />
                                        <button type="button" onClick={handleSimulatedUpload} disabled={isUploading} className="btn-outline shrink-0">
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            {isUploading ? 'Uploading...' : 'Upload Mock'}
                                        </button>
                                    </div>
                                    {errors.proofDocumentUrl && <p className="text-red-400 text-xs mt-1">{errors.proofDocumentUrl.message}</p>}
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-5">
                                <h3 className="font-bold text-lg border-b border-zinc-800 pb-2 mb-4">Location Details</h3>
                                
                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block flex justify-between">
                                        <span>District / City *</span>
                                        {user?.location?.district && <span className="text-xs text-blue-400">Auto-filled from profile</span>}
                                    </label>
                                    <div className="flex gap-2">
                                        <input {...register('district')} placeholder="District name" className="input-field flex-1" />
                                        <button type="button" onClick={getPosition} disabled={geoLoading} className="btn-ghost flex items-center gap-2 whitespace-nowrap">
                                            {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />} Detect Location
                                        </button>
                                    </div>
                                    {position && <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> GPS verified</p>}
                                    {errors.district && <p className="text-red-400 text-xs mt-1">{errors.district.message}</p>}
                                </div>

                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Formatted Address (Optional)</label>
                                    <textarea {...register('formattedAddress')} rows={2} className="input-field resize-none" placeholder="Full hospital address..." />
                                </div>

                                <div>
                                    <label className="text-sm text-zinc-400 mb-2 block">Additional Notes (Optional)</label>
                                    <textarea {...register('notes')} rows={3} placeholder="Any specific requirements matching the prescription..." className="input-field resize-none" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Progress Footer */}
                    <div className="bg-zinc-900/50 p-4 border-t border-zinc-800/50 flex justify-between items-center rounded-b-2xl">
                        <button type="button" onClick={handlePrev} disabled={step === 1 || isLoading} className="btn-ghost flex items-center gap-2 opacity-70 hover:opacity-100 disabled:invisible">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>

                        {step < 3 ? (
                            <button type="button" onClick={handleNext} className="btn-primary flex items-center gap-2">
                                Next Step <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button type="submit" disabled={isLoading} className="btn-primary bg-red-600 hover:bg-red-500 text-white flex items-center gap-2">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Droplets className="w-5 h-5" />}
                                {isLoading ? 'Broadcasting...' : 'Broadcast Request'}
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateRequestPage;
