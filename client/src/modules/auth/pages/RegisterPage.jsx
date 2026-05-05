import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterMutation, useSkipVerifyMutation } from '../authApi';
import { useAuth } from '../../../hooks/useAuth';
import {
    User, Mail, Lock, Phone, Eye, EyeOff, Loader2, AlertCircle,
    Heart, Building2, UserCheck, ChevronRight, ChevronLeft,
    Calendar, Droplets, MapPin, RefreshCw, Camera, Check,
    FileText, Shield, Stethoscope, BadgeCheck
} from 'lucide-react';

/* ─── Helpers ──────────────────────────────────── */
// Unified input style — single source of truth
const inputSt = (err, focused) => ({
    background: 'var(--bg-input)',
    border: `1px solid ${err ? '#ef4444' : focused ? '#dc2626' : 'var(--bg-input-border)'}`,
    color: 'var(--text-primary)',
    boxShadow: err ? '0 0 0 3px rgba(239,68,68,0.12)' : focused ? '0 0 0 3px rgba(220,38,38,0.12)' : 'none',
    borderRadius: '12px',
    outline: 'none',
    fontSize: '14px',
    fontWeight: 500,
    width: '100%',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'var(--font-sans)',
});

const FieldErr = ({ msg }) => msg ? (
    <motion.p
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5"
    >
        <AlertCircle className="w-3 h-3 shrink-0" />{msg}
    </motion.p>
) : null;

// Correct input-with-icon: icon is absolute inside a relative wrapper,
// input has pl-10 so text starts after the icon — all within the same visual box.
const TextField = ({
    icon: Icon, value, onChange, placeholder, type = 'text',
    error, focused, onFocus, onBlur, rightEl, autoComplete, maxLength,
}) => (
    <div className="relative w-full">
        <Icon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] pointer-events-none z-10"
            style={{ color: error ? '#ef4444' : focused ? '#dc2626' : 'var(--text-muted)' }}
        />
        <input
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            type={type}
            autoComplete={autoComplete}
            maxLength={maxLength}
            onFocus={onFocus}
            onBlur={onBlur}
            style={{ ...inputSt(error, focused), padding: '12px 16px 12px 42px', paddingRight: rightEl ? 44 : 16 }}
        />
        {rightEl && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">{rightEl}</div>
        )}
    </div>
);

// Password strength meter
const PasswordStrength = ({ password }) => {
    const getStrength = (p) => {
        let s = 0;
        if (p.length >= 8) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    };
    const score = password ? getStrength(password) : 0;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e'];
    if (!password) return null;
    return (
        <div className="mt-2 space-y-1 px-0.5">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[3px] flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= score ? colors[score] : 'var(--bg-ghost-border)' }} />
                ))}
            </div>
            <p className="text-[11px] font-medium" style={{ color: colors[score] || 'var(--text-muted)' }}>
                {labels[score]}
            </p>
        </div>
    );
};

/* ─── STEP 1: Role Selection ───────────────────── */
const StepRole = ({ value, onChange }) => {
    const roles = [
        {
            key: 'donor',
            icon: Droplets,
            label: 'Blood Donor',
            desc: 'Donate blood and save lives in your community',
            accentColor: '#dc2626',
            accentBg: 'rgba(220,38,38,0.08)',
            accentBorder: 'rgba(220,38,38,0.35)',
        },
        {
            key: 'requester',
            icon: Stethoscope,
            label: 'Blood Requester',
            desc: 'Find verified donors for yourself or a patient',
            accentColor: '#3b82f6',
            accentBg: 'rgba(59,130,246,0.08)',
            accentBorder: 'rgba(59,130,246,0.35)',
        },
        {
            key: 'hospital',
            icon: Building2,
            label: 'Hospital / Organisation',
            desc: 'Manage blood inventory and connect with donors',
            accentColor: '#10b981',
            accentBg: 'rgba(16,185,129,0.08)',
            accentBorder: 'rgba(16,185,129,0.35)',
        },
    ];

    return (
        <div className="space-y-3">
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Who are you joining as?
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                Your role determines the features you will access.
            </p>
            {roles.map(role => (
                <motion.button
                    key={role.key}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onChange(role.key)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl text-left cursor-pointer transition-all duration-200"
                    style={{
                        background: value === role.key ? role.accentBg : 'var(--bg-input)',
                        border: `1.5px solid ${value === role.key ? role.accentBorder : 'var(--bg-input-border)'}`,
                        boxShadow: value === role.key ? `0 0 0 1px ${role.accentBorder}` : 'none',
                    }}
                >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                            background: value === role.key ? role.accentBg : 'var(--bg-ghost)',
                            border: `1px solid ${value === role.key ? role.accentBorder : 'var(--bg-ghost-border)'}`,
                        }}>
                        <role.icon className="w-5 h-5" style={{ color: role.accentColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                {role.label}
                            </span>
                            {value === role.key && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3 h-3 text-white" />
                                </motion.div>
                            )}
                        </div>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            {role.desc}
                        </p>
                    </div>
                </motion.button>
            ))}
        </div>
    );
};

/* ─── STEP 2: Auth Details ─────────────────────── */
const StepAuth = ({ data, onChange, errors: extErrors }) => {
    const [show, setShow] = useState({ password: false, confirm: false });
    const [focused, setFocused] = useState('');
    const errs = extErrors || {};

    const ToggleBtn = ({ field }) => (
        <button
            type="button"
            className="cursor-pointer transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            onMouseDown={e => e.preventDefault()}
            onClick={() => setShow(p => ({ ...p, [field]: !p[field] }))}
        >
            {show[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
    );

    return (
        <div className="space-y-4">
            <div className="mb-5">
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Account Information
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    These credentials will be used to sign in
                </p>
            </div>

            {/* Full Name */}
            <div>
                <TextField
                    icon={User}
                    value={data.name}
                    onChange={e => onChange('name', e.target.value)}
                    placeholder="Full name"
                    type="text"
                    autoComplete="name"
                    error={errs.name}
                    focused={focused === 'name'}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused('')}
                />
                <FieldErr msg={errs.name} />
            </div>

            {/* Email */}
            <div>
                <TextField
                    icon={Mail}
                    value={data.email}
                    onChange={e => onChange('email', e.target.value)}
                    placeholder="Email address"
                    type="email"
                    autoComplete="email"
                    error={errs.email}
                    focused={focused === 'email'}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused('')}
                />
                <FieldErr msg={errs.email} />
            </div>

            {/* Phone — clean prefix approach */}
            <div>
                <div className="relative w-full">
                    <Phone
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] pointer-events-none z-10"
                        style={{ color: errs.mobile ? '#ef4444' : focused === 'mobile' ? '#dc2626' : 'var(--text-muted)' }}
                    />
                    {/* +91 badge rendered inside input via left padding */}
                    <span
                        className="absolute z-10 text-xs font-semibold select-none pointer-events-none"
                        style={{
                            left: 42,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                        }}
                    >
                        +91
                    </span>
                    <input
                        value={data.mobile}
                        onChange={e => onChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Mobile number"
                        type="tel"
                        maxLength={10}
                        autoComplete="tel"
                        onFocus={() => setFocused('mobile')}
                        onBlur={() => setFocused('')}
                        style={{
                            ...inputSt(errs.mobile, focused === 'mobile'),
                            padding: '12px 16px 12px 80px',
                        }}
                    />
                </div>
                <FieldErr msg={errs.mobile} />
            </div>

            {/* Password */}
            <div>
                <TextField
                    icon={Lock}
                    value={data.password}
                    onChange={e => onChange('password', e.target.value)}
                    placeholder="Create password"
                    type={show.password ? 'text' : 'password'}
                    autoComplete="new-password"
                    error={errs.password}
                    focused={focused === 'password'}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    rightEl={<ToggleBtn field="password" />}
                />
                <PasswordStrength password={data.password} />
                <FieldErr msg={errs.password} />
            </div>

            {/* Confirm Password */}
            <div>
                <TextField
                    icon={Lock}
                    value={data.confirmPassword}
                    onChange={e => onChange('confirmPassword', e.target.value)}
                    placeholder="Confirm password"
                    type={show.confirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    error={errs.confirmPassword}
                    focused={focused === 'confirmPassword'}
                    onFocus={() => setFocused('confirmPassword')}
                    onBlur={() => setFocused('')}
                    rightEl={<ToggleBtn field="confirm" />}
                />
                <FieldErr msg={errs.confirmPassword} />
            </div>

            {/* Terms */}
            <div className="pt-1">
                <label className="flex items-start gap-3 cursor-pointer">
                    <div className="flex-shrink-0 mt-0.5">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={data.acceptTerms}
                            onChange={e => onChange('acceptTerms', e.target.checked)}
                        />
                        <div
                            className="w-[18px] h-[18px] rounded-[5px] border-2 transition-all peer-checked:bg-red-600 peer-checked:border-red-600 flex items-center justify-center"
                            style={{ borderColor: errs.acceptTerms ? '#ef4444' : 'var(--bg-ghost-border)' }}
                        >
                            {data.acceptTerms && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </div>
                    </div>
                    <span className="text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                        I agree to the{' '}
                        <a href="#" className="text-red-400 hover:text-red-300 font-medium underline-offset-2 hover:underline">
                            Terms of Service
                        </a>
                        {' '}and{' '}
                        <a href="#" className="text-red-400 hover:text-red-300 font-medium underline-offset-2 hover:underline">
                            Privacy Policy
                        </a>
                    </span>
                </label>
                <FieldErr msg={errs.acceptTerms} />
            </div>
        </div>
    );
};

/* ─── STEP 3a: Donor Profile ───────────────────── */
const StepDonorProfile = ({ data, onChange }) => {
    const [detecting, setDetecting] = useState(false);
    const [locationStatus, setLocationStatus] = useState('');
    const [focused, setFocused] = useState('');
    const fileRef = useRef();
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

    const detectLocation = async () => {
        setDetecting(true);
        setLocationStatus('Detecting location…');
        try {
            const pos = await new Promise((res, rej) =>
                navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
            const { latitude: lat, longitude: lng } = pos.coords;
            const resp = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const geo = await resp.json();
            const addr = geo.address || {};
            onChange('location', {
                coordinates: [lng, lat],
                state: addr.state || '',
                district: addr.county || addr.state_district || '',
                town: addr.city || addr.town || addr.village || '',
                formattedAddress: geo.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            });
            setLocationStatus('Location detected successfully');
        } catch {
            setLocationStatus('Could not detect location — please enter manually');
        } finally {
            setDetecting(false);
        }
    };

    const calculateAge = (dob) => {
        if (!dob) return null;
        const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
        return age >= 0 ? age : null;
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => onChange('avatarPreview', reader.result);
        reader.readAsDataURL(file);
    };

    const age = calculateAge(data.dateOfBirth);

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Donor Profile
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Help us match you with blood requests near you
                </p>
            </div>

            {/* Avatar upload */}
            <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center"
                        style={{ background: 'var(--bg-ghost)', border: '1.5px solid var(--bg-ghost-border)' }}>
                        {data.avatarPreview
                            ? <img src={data.avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                            : <User className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                        }
                    </div>
                    <button type="button" onClick={() => fileRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
                        style={{ background: 'linear-gradient(135deg,#dc2626,#e11d48)' }}>
                        <Camera className="w-3 h-3 text-white" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Profile Photo</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Optional · JPG, PNG, max 5 MB</p>
                </div>
            </div>

            {/* Date of Birth */}
            <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Date of Birth <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="date"
                        value={data.dateOfBirth || ''}
                        onChange={e => onChange('dateOfBirth', e.target.value)}
                        max={new Date(Date.now() - 16 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                        style={{ ...inputSt(false, focused === 'dob'), padding: '12px 16px 12px 42px' }}
                        onFocus={() => setFocused('dob')}
                        onBlur={() => setFocused('')}
                    />
                </div>
                {age !== null && (
                    <p className="text-xs mt-1 font-medium" style={{ color: '#22c55e' }}>Age: {age} years</p>
                )}
            </div>

            {/* Blood Group */}
            <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Blood Group <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {bloodGroups.map(bg => (
                        <button key={bg} type="button"
                            onClick={() => onChange('bloodGroup', bg)}
                            className="py-2.5 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer"
                            style={{
                                background: data.bloodGroup === bg ? 'linear-gradient(135deg,#dc2626,#e11d48)' : 'var(--bg-input)',
                                border: `1px solid ${data.bloodGroup === bg ? '#dc2626' : 'var(--bg-input-border)'}`,
                                color: data.bloodGroup === bg ? '#fff' : 'var(--text-primary)',
                                boxShadow: data.bloodGroup === bg ? '0 2px 8px rgba(220,38,38,0.3)' : 'none',
                            }}>
                            {bg}
                        </button>
                    ))}
                </div>
            </div>

            {/* Location */}
            <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Location <span className="text-red-400">*</span>
                </label>
                <button type="button" onClick={detectLocation} disabled={detecting}
                    className="w-full flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm font-medium transition-all cursor-pointer mb-2"
                    style={{
                        background: 'var(--bg-ghost)',
                        border: '1px solid var(--bg-ghost-border)',
                        color: 'var(--text-primary)',
                    }}>
                    {detecting
                        ? <Loader2 className="w-4 h-4 animate-spin text-red-400 flex-shrink-0" />
                        : <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                    }
                    <span>{detecting ? 'Detecting location…' : 'Auto-detect my location'}</span>
                    {!detecting && <RefreshCw className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--text-muted)' }} />}
                </button>

                {locationStatus && (
                    <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        {data.location?.formattedAddress
                            ? <Check className="w-3 h-3 text-green-400 shrink-0" />
                            : <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                        }
                        {locationStatus}
                    </p>
                )}
                {data.location?.formattedAddress && (
                    <div className="p-3 rounded-xl text-xs mb-2 flex items-start gap-2"
                        style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)', color: '#4ade80' }}>
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="break-all">{data.location.formattedAddress.slice(0, 90)}{data.location.formattedAddress.length > 90 ? '…' : ''}</span>
                    </div>
                )}
                <input
                    value={data.city || ''}
                    onChange={e => onChange('city', e.target.value)}
                    placeholder="Or enter city / town manually"
                    style={{ ...inputSt(false, false), padding: '12px 16px', marginTop: 4 }}
                />
            </div>

            {/* Last Donation Date */}
            <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Last Donation Date
                    <span className="ml-1 font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
                </label>
                <input
                    type="date"
                    value={data.lastDonated || ''}
                    onChange={e => onChange('lastDonated', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    style={{ ...inputSt(false, false), padding: '12px 16px' }}
                />
            </div>
        </div>
    );
};

/* ─── Hospital SimpleField (defined OUTSIDE the component to preserve identity) ── */
const HospitalField = ({ label, field, placeholder, required, icon: Icon, type = 'text',
    data, onChange, focused, setFocused }) => (
    <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="relative w-full">
            {Icon && (
                <Icon
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] pointer-events-none z-10"
                    style={{ color: focused === field ? '#dc2626' : 'var(--text-muted)' }}
                />
            )}
            <input
                value={data[field] || ''}
                onChange={e => onChange(field, e.target.value)}
                type={type}
                placeholder={placeholder}
                style={{
                    ...inputSt(false, focused === field),
                    padding: Icon ? '12px 16px 12px 42px' : '12px 16px',
                }}
                onFocus={() => setFocused(field)}
                onBlur={() => setFocused('')}
            />
        </div>
    </div>
);

/* ─── STEP 3b: Hospital Profile ────────────────── */
const StepHospitalProfile = ({ data, onChange }) => {
    const [focused, setFocused] = useState('');
    const fp = { data, onChange, focused, setFocused };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Hospital Information
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Organisation details for verification and listing
                </p>
            </div>

            <HospitalField {...fp} label="Hospital / Organisation Name" field="hospitalName"
                placeholder="e.g. City General Hospital" required icon={Building2} />
            <HospitalField {...fp} label="Registration / Licence Number" field="licenceNumber"
                placeholder="e.g. MH-HOS-2024-001" required icon={FileText} />
            <HospitalField {...fp} label="Street Address" field="street"
                placeholder="Street / Area / Locality" icon={MapPin} />

            <div className="grid grid-cols-2 gap-3">
                <HospitalField {...fp} label="City / Village" field="city" placeholder="City" required />
                <HospitalField {...fp} label="District" field="district" placeholder="District" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <HospitalField {...fp} label="State" field="state" placeholder="State" required />
                <HospitalField {...fp} label="PIN Code" field="pincode" placeholder="6-digit PIN" required />
            </div>

            <HospitalField {...fp} label="Contact Number" field="contactNumber"
                placeholder="+91 XXXXX XXXXX" icon={Phone} />
            <HospitalField {...fp} label="Authorised Person" field="authorisedPerson"
                placeholder="Name of admin or representative" icon={UserCheck} />
        </div>
    );
};

/* ─── STEP 3c: Requester Profile ───────────────── */
const StepRequesterProfile = ({ data, onChange }) => {
    const [focused, setFocused] = useState('');

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Requester Profile
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Location will be collected when you create a blood request.
                </p>
            </div>

            <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Your Blood Group
                    <span className="ml-1 font-normal" style={{ color: 'var(--text-muted)' }}>(optional)</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                        <button key={bg} type="button"
                            onClick={() => onChange('bloodGroup', bg)}
                            className="py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
                            style={{
                                background: data.bloodGroup === bg ? 'linear-gradient(135deg,#dc2626,#e11d48)' : 'var(--bg-input)',
                                border: `1px solid ${data.bloodGroup === bg ? '#dc2626' : 'var(--bg-input-border)'}`,
                                color: data.bloodGroup === bg ? '#fff' : 'var(--text-primary)',
                            }}>
                            {bg}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    City / Area
                </label>
                <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                        value={data.city || ''}
                        onChange={e => onChange('city', e.target.value)}
                        placeholder="Your city or town"
                        style={{ ...inputSt(false, focused === 'city'), padding: '12px 16px 12px 42px' }}
                        onFocus={() => setFocused('city')}
                        onBlur={() => setFocused('')}
                    />

                </div>
            </div>

            <div className="p-4 rounded-xl flex items-start gap-3"
                style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)' }}>
                <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-blue-400">OTP Verification Required</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Email OTP is mandatory for requesters to ensure platform safety and prevent misuse.
                    </p>
                </div>
            </div>
        </div>
    );
};

const StepBar = ({ current, total, role }) => {
    const labels = [
        'Role',
        'Details',
        role === 'hospital' ? 'Organisation' : 'Profile',
        'Verify',
    ];
    return (
        <div className="mb-8 select-none relative">
            {/* Background connector track */}
            <div
                className="absolute left-4 right-4 h-[2px] rounded-full"
                style={{
                    top: '15px', /* 16px is half of the 32px w-8 circle */
                    background: 'var(--bg-ghost-border)',
                    zIndex: 0,
                }}
            />
            {/* Active progress fill */}
            <motion.div
                className="absolute left-4 h-[2px] rounded-full"
                style={{
                    top: '15px',
                    background: 'linear-gradient(90deg,#dc2626,#f97316)',
                    zIndex: 0,
                }}
                animate={{ width: `calc(${((current - 1) / (total - 1)) * 100}% - 32px)` }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
            
            {/* Steps (Circle + Label) */}
            <div className="relative z-10 flex items-start justify-between">
                {labels.map((label, i) => {
                    const step = i + 1;
                    const done = step < current;
                    const active = step === current;
                    return (
                        <div key={i} className="flex flex-col items-center flex-1">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 mb-2"
                                style={{
                                    background: done || active
                                        ? 'linear-gradient(135deg,#dc2626,#e11d48)'
                                        : 'var(--bg-surface)',
                                    border: done || active
                                        ? 'none'
                                        : '2px solid var(--bg-ghost-border)',
                                    color: done || active ? '#fff' : 'var(--text-muted)',
                                    boxShadow: active ? '0 0 0 4px rgba(220,38,38,0.18)' : 'none',
                                }}
                            >
                                {done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : step}
                            </div>
                            <span
                                className="text-[10px] font-semibold leading-none tracking-wide text-center uppercase"
                                style={{
                                    color: active ? '#ef4444' : done ? 'var(--text-secondary)' : 'var(--text-muted)',
                                }}
                            >
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ─── Main RegisterPage ────────────────────────── */
const TOTAL_STEPS = 4;

const RegisterPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [registerMutation, { isLoading }] = useRegisterMutation();
    const [skipVerifyMutation, { isLoading: isSkipping }] = useSkipVerifyMutation();
    const [step, setStep] = useState(1);
    const [registeredUserId, setRegisteredUserId] = useState(null);
    const [serverError, setServerError] = useState('');
    const [stepErrors, setStepErrors] = useState({});
    const [direction, setDirection] = useState(1);

    const [formData, setFormData] = useState({
        role: 'donor',
        name: '', email: '', mobile: '', password: '', confirmPassword: '', acceptTerms: false,
        dateOfBirth: '', bloodGroup: '', location: null, city: '', lastDonated: '', avatarPreview: '',
        hospitalName: '', licenceNumber: '', street: '', district: '', state: '', pincode: '',
        contactNumber: '', authorisedPerson: '',
    });

    const update = useCallback((field, val) => setFormData(p => ({ ...p, [field]: val })), []);

    const validateStep = () => {
        const e = {};
        if (step === 2) {
            if (!formData.name.trim() || formData.name.length < 2) e.name = 'At least 2 characters required';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Enter a valid email address';
            if (formData.mobile && !/^[6-9]\d{9}$/.test(formData.mobile)) e.mobile = 'Enter a valid 10-digit mobile number';
            if (!formData.password || formData.password.length < 6) e.password = 'At least 6 characters required';
            if (formData.password !== formData.confirmPassword) e.confirmPassword = "Passwords don't match";
            if (!formData.acceptTerms) e.acceptTerms = 'You must accept the terms to continue';
        }
        if (step === 3 && formData.role === 'donor') {
            if (!formData.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
            if (!formData.bloodGroup) e.bloodGroup = 'Please select your blood group';
        }
        if (step === 3 && formData.role === 'hospital') {
            if (!formData.hospitalName.trim()) e.hospitalName = 'Hospital name is required';
            if (!formData.licenceNumber.trim()) e.licenceNumber = 'Licence number is required';
        }
        setStepErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = async () => {
        if (!validateStep()) return;
        if (step === 3) {
            try {
                setServerError('');
                const payload = {
                    name: formData.name,
                    email: formData.email,
                    mobile: formData.mobile || undefined,
                    password: formData.password,
                    role: formData.role,
                    ...(formData.role === 'donor' && {
                        dateOfBirth: formData.dateOfBirth,
                        bloodGroup: formData.bloodGroup,
                        location: formData.location,
                        city: formData.city,
                        lastDonated: formData.lastDonated || undefined,
                    }),
                    ...(formData.role === 'hospital' && {
                        hospitalName: formData.hospitalName,
                        licenceNumber: formData.licenceNumber,
                        address: {
                            street: formData.street, city: formData.city,
                            district: formData.district, state: formData.state, pincode: formData.pincode,
                        },
                        contactNumber: formData.contactNumber,
                        authorisedPerson: formData.authorisedPerson,
                    }),
                    ...(formData.role === 'requester' && {
                        bloodGroup: formData.bloodGroup || undefined,
                        city: formData.city,
                    }),
                };
                const regResult = await registerMutation(payload).unwrap();
                setRegisteredUserId(regResult.data?.userId || null);
                setDirection(1);
                setStep(4);
            } catch (err) {
                setServerError(err.data?.message || 'Registration failed. Please try again.');
            }
            return;
        }
        setDirection(1);
        setStep(s => s + 1);
        setStepErrors({});
    };

    const back = () => {
        setDirection(-1);
        setStep(s => s - 1);
        setStepErrors({});
        setServerError('');
    };

    const slideVariants = {
        enter: (dir) => ({ x: dir > 0 ? 36 : -36, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir > 0 ? -36 : 36, opacity: 0 }),
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Create your account
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Join BloodLink in 3 quick steps
                </p>
            </div>

            <StepBar current={step} total={TOTAL_STEPS} role={formData.role} />

            <AnimatePresence>
                {serverError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-4">
                        <AlertCircle className="w-4 h-4 shrink-0" />{serverError}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait" custom={direction}>
                <motion.div key={step} custom={direction}
                    variants={slideVariants}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.25, ease: 'easeInOut' }}>
                    {step === 1 && <StepRole value={formData.role} onChange={v => update('role', v)} />}
                    {step === 2 && <StepAuth data={formData} onChange={update} errors={stepErrors} />}
                    {step === 3 && formData.role === 'donor' && <StepDonorProfile data={formData} onChange={update} />}
                    {step === 3 && formData.role === 'requester' && <StepRequesterProfile data={formData} onChange={update} />}
                    {step === 3 && formData.role === 'hospital' && <StepHospitalProfile data={formData} onChange={update} />}
                    {step === 4 && (
                        <div className="text-center py-4">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5 shadow-lg"
                                style={{ boxShadow: '0 0 24px rgba(220,38,38,0.35)' }}>
                                <BadgeCheck className="w-8 h-8 text-white" />
                            </motion.div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Account created successfully
                            </h3>
                            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                                A 6-digit verification code was sent to
                            </p>
                            <p className="font-semibold text-red-400 mb-6">{formData.email}</p>
                            <button type="button"
                                onClick={() => navigate('/verify-otp', {
                                    state: { email: formData.email, purpose: 'registration' }
                                })}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                                <Shield className="w-4 h-4" />
                                Enter verification code
                            </button>
                            {formData.role !== 'requester' && (
                                <button type="button"
                                    disabled={isSkipping}
                                    onClick={async () => {
                                        if (!registeredUserId) { navigate('/login'); return; }
                                        try {
                                            const result = await skipVerifyMutation({ userId: registeredUserId }).unwrap();
                                            login({ user: result.data.user, accessToken: result.data.accessToken });
                                            navigate(`/${result.data.user.role}/dashboard`);
                                        } catch {
                                            navigate('/login');
                                        }
                                    }}
                                    className="btn-ghost w-full mt-3 flex items-center justify-center gap-2 py-3 text-sm">
                                    {isSkipping ? 'Loading…' : 'Skip — verify later from dashboard'}
                                </button>
                            )}
                            <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
                                Verification code is also printed in the server terminal
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {step < 4 && (
                <div className={`flex gap-3 mt-6 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                    {step > 1 && (
                        <button type="button" onClick={back}
                            className="btn-ghost flex items-center gap-1.5 px-5 py-2.5 text-sm">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                    )}
                    <button type="button" onClick={next} disabled={isLoading}
                        className="btn-primary flex items-center gap-1.5 px-6 py-2.5 text-sm ml-auto">
                        {isLoading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                            : step === 3
                                ? <><Check className="w-4 h-4" /> Create Account</>
                                : <>Next <ChevronRight className="w-4 h-4" /></>
                        }
                    </button>
                </div>
            )}

            {step === 1 && (
                <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <Link to="/login" className="text-red-400 hover:text-red-300 font-medium">Sign in</Link>
                </p>
            )}
        </div>
    );
};

export default RegisterPage;
