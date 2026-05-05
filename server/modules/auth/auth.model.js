import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const deviceSessionSchema = new mongoose.Schema({
    deviceId: String,
    userAgent: String,
    ip: String,
    lastUsed: { type: Date, default: Date.now },
    expiresAt: Date,
}, { _id: false });

const locationSchema = new mongoose.Schema({
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    country: String,
    state: String,
    district: String,
    town: String,
    village: String,
    formattedAddress: String,
}, { _id: false });

const notificationPrefsSchema = new mongoose.Schema({
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
    inApp: { type: Boolean, default: true },
    categories: {
        requests: { type: Boolean, default: true },
        updates: { type: Boolean, default: true },
        verification: { type: Boolean, default: true },
        criticalAlerts: { type: Boolean, default: true },
    },
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: 100,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    mobile: {
        type: String,
        trim: true,
        sparse: true,
    },
    profilePicture: {
        type: String,
        default: '',
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false,
    },
    password: { // Legacy field from seed script
        type: String,
        select: false,
    },
    role: {
        type: String,
        enum: ['donor', 'requester', 'hospital', 'admin'],
        required: [true, 'Role is required'],
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    dateOfBirth: {
        type: Date,
    },
    availability: {
        type: Boolean,
        default: true,
    },
    profileCompleted: {
        type: Boolean,
        default: false,
    },
    lastDonationDate: {
        type: Date,
    },
    nextEligibleDate: {
        type: Date,
    },
    avatar: {
        type: String,
        default: '',
    },
    location: {
        type: locationSchema,
        default: () => ({}),
    },
    deviceSessions: [deviceSessionSchema],
    trustScore: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isSuspended: {
        type: Boolean,
        default: false,
    },
    notificationPrefs: {
        type: notificationPrefsSchema,
        default: () => ({}),
    },
    refreshTokens: [{
        token: String,
        expiresAt: Date,
        createdAt: { type: Date, default: Date.now },
    }],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Admin-only private notes about this user
    adminNotes: {
        type: String,
        default: '',
        maxlength: 2000,
    },
}, {
    timestamps: true,
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ 'location.district': 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    const hash = this.passwordHash || this.password;
    if (!hash) return false;
    return bcrypt.compare(candidatePassword, hash);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    delete obj.refreshTokens;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    delete obj.__v;
    return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
