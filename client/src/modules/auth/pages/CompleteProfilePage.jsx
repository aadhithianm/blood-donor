import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateProfileMutation } from '../../user/userApi';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, updateUser } from '../authSlice';
import { Loader2, UserCheck, Droplets, MapPin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const CompleteProfilePage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const [updateProfileMutation, { isLoading }] = useUpdateProfileMutation();

    const [formData, setFormData] = useState({
        bloodGroup: user?.bloodGroup || '',
        dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        city: user?.location?.town || '',
    });

    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.bloodGroup || !formData.dateOfBirth || !formData.city) {
            setError('Please fill in all required fields to continue.');
            return;
        }

        try {
            const payload = {
                bloodGroup: formData.bloodGroup,
                dateOfBirth: formData.dateOfBirth,
                location: { town: formData.city },
                profileCompleted: true,
                availability: true
            };
            
            const result = await updateProfileMutation(payload).unwrap();
            
            // Update Redux state directly with the new user fields
            dispatch(updateUser(result.data));
            
            // Navigate to dashboard
            navigate(`/${user.role}/dashboard`);
        } catch (err) {
            setError(err.data?.message || 'Failed to update profile. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full p-6 md:p-8 rounded-2xl bg-card border border-border shadow-sm"
            >
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <UserCheck className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Just a few more details to set up your account and help us match you effectively.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Blood Group */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Blood Group <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" style={{ color: 'var(--text-muted)' }} />
                            <select
                                name="bloodGroup"
                                value={formData.bloodGroup}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-red-500 transition-colors appearance-none"
                                required
                            >
                                <option value="" disabled>Select Blood Group</option>
                                {BLOOD_GROUPS.map(bg => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Date of Birth <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-red-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">City <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" style={{ color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                name="city"
                                placeholder="Enter your city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-red-500 transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full mt-6 py-3 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Setup'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default CompleteProfilePage;
