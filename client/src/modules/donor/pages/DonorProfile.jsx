import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, updateUser } from '../../auth/authSlice';
import { useGetDonorProfileQuery, useToggleAvailabilityMutation, useUploadCertificateMutation } from '../donorApi';
import { useUpdateProfileMutation, useUploadAvatarMutation } from '../../user/userApi';
import { motion } from 'framer-motion';
import { User, Droplets, Upload, ToggleLeft, ToggleRight, Loader2, CheckCircle, Clock, XCircle, MapPin, Calendar, Mail, Phone, Save, Shield, Camera } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DonorProfile = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const toast = useToast();

    const { data, isLoading, refetch } = useGetDonorProfileQuery();
    const [toggleAvailability, { isLoading: toggling }] = useToggleAvailabilityMutation();
    const [uploadCert, { isLoading: uploading }] = useUploadCertificateMutation();
    const [updateProfileMutation, { isLoading: saving }] = useUpdateProfileMutation();
    const [uploadAvatarMutation, { isLoading: avatarUploading }] = useUploadAvatarMutation();
    
    const profile = data?.data;

    const [formData, setFormData] = useState({
        bloodGroup: '',
        dateOfBirth: '',
        email: '',
        mobile: '',
        street: '',
        city: '',
        district: '',
        state: '',
        pincode: '',
    });
    
    const [detectingLoc, setDetectingLoc] = useState(false);

    useEffect(() => {
        if (user || profile) {
            setFormData({
                bloodGroup: profile?.bloodGroup || user?.bloodGroup || '',
                dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                email: user?.email || '',
                mobile: user?.mobile || '',
                street: user?.location?.formattedAddress || '',
                city: user?.location?.town || '',
                district: user?.location?.district || '',
                state: user?.location?.state || '',
                pincode: '', 
            });
        }
    }, [user, profile]);

    const calculateCompletion = () => {
        let score = 0;
        if (formData.email) score += 10;
        if (formData.mobile) score += 10;
        if (formData.bloodGroup) score += 20;
        if (formData.dateOfBirth) score += 10;
        if (formData.city && formData.state) score += 10;
        if (profile?.medCertUrl || profile?.verificationStatus === 'approved') score += 20;
        if (user?.profilePicture) score += 20;
        return Math.min(score, 100);
    };
    const completionRate = calculateCompletion();

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }
        setDetectingLoc(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                // Optional: Reverse Geocoding API here, but we'll mock or leave for user to adjust
                setFormData(prev => ({
                    ...prev,
                    street: 'Detected automatically via GPS',
                    city: 'Chennai', // Dummy auto-fill (in production, use Google Maps API)
                    district: 'Chennai',
                    state: 'Tamil Nadu',
                    pincode: '600001'
                }));
                toast.success("Location detect simulated successfully!");
            } catch (err) {
                toast.error("Failed to reverse geocode location");
            } finally {
                setDetectingLoc(false);
            }
        }, () => {
            toast.error("Permission denied or location unavailable");
            setDetectingLoc(false);
        });
    }

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                bloodGroup: formData.bloodGroup,
                dateOfBirth: formData.dateOfBirth,
                mobile: formData.mobile,
                email: formData.email,
                location: { 
                    formattedAddress: formData.street,
                    town: formData.city,
                    district: formData.district,
                    state: formData.state,
                },
                profileCompleted: !!(formData.bloodGroup && formData.dateOfBirth && formData.city)
            };
            const result = await updateProfileMutation(payload).unwrap();
            dispatch(updateUser(result.data));
            toast.success('Profile updated successfully');
            refetch();
        } catch (err) {
            toast.error(err.data?.message || 'Failed to update profile');
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('avatar', file);
        try {
            const res = await uploadAvatarMutation(uploadData).unwrap();
            dispatch(updateUser(res.data));
            toast.success('Profile picture updated!');
            refetch();
        } catch (err) {
            toast.error(err.data?.message || 'Failed to upload picture');
        }
    };

    const handleToggle = async () => {
        const next = profile?.availability === 'available' ? 'unavailable' : 'available';
        try {
            await toggleAvailability({ availability: next }).unwrap();
            dispatch(updateUser({ availability: next === 'available' }));
            toast.success(`Availability set to ${next}`);
        } catch (err) {
            toast.error(err.data?.message || 'Failed to toggle status');
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const form = new FormData();
        form.append('certificate', file);
        try {
            await uploadCert(form).unwrap();
            toast.success('Certificate uploaded successfully');
            refetch();
        } catch (err) {
            toast.error(err.data?.message || 'Upload failed');
        }
    };

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;

    const statusIcon = {
        approved: <CheckCircle className="w-5 h-5 text-green-400" />,
        pending: <Clock className="w-5 h-5 text-amber-400" />,
        rejected: <XCircle className="w-5 h-5 text-red-400" />,
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Profile</h1>

            {/* Completion Widget */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
                <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-sm uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Profile Completion</p>
                    <span className={`font-bold ${completionRate === 100 ? 'text-green-500' : 'text-amber-500'}`}>{completionRate}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-2.5 rounded-full transition-all duration-1000 ${completionRate === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-red-500 to-amber-500'}`} style={{ width: `${completionRate}%` }}></div>
                </div>
                {completionRate < 100 && <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>Fill in all details and upload your certificate to reach 100%.</p>}
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Col: Read-Only Info & Uploads */}
                <div className="space-y-6 md:col-span-1">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 space-y-4">
                        <div className="text-center pb-4 border-b border-zinc-700/50 relative">
                            <div className="w-20 h-20 rounded-full mx-auto mb-3 relative group overflow-hidden bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-2xl uppercase border-2" style={{ borderColor: 'var(--bg-input-border)' }}>
                                {user?.profilePicture ? (
                                    <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0)
                                )}
                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-xs font-medium">
                                    <Camera className="w-5 h-5 mb-1" />
                                    {avatarUploading ? 'Wait...' : 'Update'}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
                                </label>
                            </div>
                            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Donor Account</p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                                <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{formData.email || user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                                <span style={{ color: 'var(--text-secondary)' }}>{formData.mobile || user?.mobile || 'No phone added'}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Verification Status */}
                    <div className="glass-card p-5">
                        <p className="font-medium text-sm mb-3 flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                            Medical Verification 
                            {statusIcon[profile?.verificationStatus] || <Shield className="w-4 h-4 text-zinc-400" />}
                        </p>
                        <div className="space-y-4">
                            <div className="text-sm p-3 rounded-xl mb-4 text-center font-bold" style={{ backgroundColor: profile?.verificationStatus === 'approved' ? 'rgba(34, 197, 94, 0.1)' : profile?.verificationStatus === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: profile?.verificationStatus === 'approved' ? '#22c55e' : profile?.verificationStatus === 'pending' ? '#f59e0b' : '#ef4444' }}>
                                {profile?.verificationStatus === 'approved' ? 'Officially Verified Donor' : profile?.verificationStatus === 'pending' ? 'Verification Under Review' : 'Currently Unverified'}
                            </div>

                            {profile?.medCertUrl ? (
                                <div className="text-sm">
                                    <div className="flex items-center justify-center gap-2 text-zinc-400 font-medium mb-2 border border-zinc-700/50 p-2 rounded-lg bg-zinc-800/20">
                                        <CheckCircle className="w-4 h-4" /> Certificate Uploaded
                                    </div>
                                    <a href={profile.medCertUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline block text-center">View Initial Document</a>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-xs mb-3 text-center" style={{ color: 'var(--text-secondary)' }}>Upload your medical certificate or ID to activate your Donor status.</p>
                                    <label className="btn-primary w-full flex items-center justify-center gap-2 cursor-pointer py-2 text-sm">
                                        <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Required Document'}
                                        <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleUpload} className="hidden" disabled={uploading}/>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Col: Editable Details & Settings */}
                <div className="space-y-6 md:col-span-2">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
                        <div className="bg-gradient-to-r from-red-600/10 to-rose-500/5 p-4 border-b border-red-500/10">
                            <h3 className="font-bold text-red-500">Personal Details</h3>
                        </div>
                        <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Mobile Number</label>
                                    <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="+1 234 567 8900"
                                        className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none font-medium"
                                        style={{ background: 'var(--bg-input)', borderColor: 'var(--bg-input-border)', color: 'var(--text-primary)' }} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com"
                                        className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none font-medium"
                                        style={{ background: 'var(--bg-input)', borderColor: 'var(--bg-input-border)', color: 'var(--text-primary)' }} />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Blood Group</label>
                                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}
                                        className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none appearance-none"
                                        style={{ background: 'var(--bg-input)', borderColor: 'var(--bg-input-border)', color: 'var(--text-primary)' }}>
                                        <option value="" disabled>Select group</option>
                                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Date of Birth</label>
                                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange}
                                        className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                                        style={{ background: 'var(--bg-input)', borderColor: 'var(--bg-input-border)', color: 'var(--text-primary)' }} />
                                </div>
                                
                                <div className="sm:col-span-2 pt-4 border-t border-zinc-700/50 flex items-center justify-between">
                                    <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Address Details</h4>
                                    <button type="button" onClick={handleDetectLocation} disabled={detectingLoc} className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {detectingLoc ? 'Detecting...' : 'Detect My Location'}
                                    </button>
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Street Address</label>
                                    <input type="text" name="street" value={formData.street} onChange={handleChange} placeholder="e.g. 123 Main St"
                                        className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                                        style={{ background: 'var(--bg-input)', borderColor: 'var(--bg-input-border)', color: 'var(--text-primary)' }} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Town / City</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. New York"
                                        className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                                        style={{ background: 'var(--bg-input)', borderColor: 'var(--bg-input-border)', color: 'var(--text-primary)' }} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>District</label>
                                    <input type="text" name="district" value={formData.district} onChange={handleChange} placeholder="e.g. Manhattan"
                                        className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                                        style={{ background: 'var(--bg-input)', borderColor: 'var(--bg-input-border)', color: 'var(--text-primary)' }} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>State / Province</label>
                                    <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="e.g. NY"
                                        className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                                        style={{ background: 'var(--bg-input)', borderColor: 'var(--bg-input-border)', color: 'var(--text-primary)' }} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Pincode / ZIP</label>
                                    <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="e.g. 10001"
                                        className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                                        style={{ background: 'var(--bg-input)', borderColor: 'var(--bg-input-border)', color: 'var(--text-primary)' }} />
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end">
                                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    {/* Settings / Availability */}
                    <div className="glass-card p-5 flex items-center justify-between">
                        <div>
                            <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Emergency Availability</p>
                            <p className="text-xs max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                                {profile?.availability === 'available' ? 'You are currently visible to hospital and requester searches in your city.' :
                                    profile?.availability === 'on-cooldown' ? 'You are on a mandatory cooldown period after a recent donation.' :
                                        'Your profile is hidden. You will not receive emergency alerts.'}
                            </p>
                        </div>
                        <button onClick={handleToggle} disabled={toggling || profile?.availability === 'on-cooldown'} className="cursor-pointer disabled:opacity-50 transition-transform active:scale-95">
                            {profile?.availability === 'available' ? <ToggleRight className="w-10 h-10 text-green-500" /> : <ToggleLeft className="w-10 h-10 text-zinc-500" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonorProfile;
