import mongoose from 'mongoose';

const donorProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: [true, 'Blood group is required'],
    },
    medCertUrl: {
        type: String,
        default: '',
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    verifiedAt: Date,
    availability: {
        type: String,
        enum: ['available', 'unavailable', 'on-cooldown'],
        default: 'unavailable',
    },
    lastDonationDate: Date,
    cooldownUntil: Date,
    totalDonations: {
        type: Number,
        default: 0,
    },
    badges: [{
        name: String,
        icon: String,
        earnedAt: { type: Date, default: Date.now },
    }],
    streaks: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastDonationMonth: String,
    },
}, {
    timestamps: true,
});

donorProfileSchema.index({ bloodGroup: 1, availability: 1 });
donorProfileSchema.index({ verificationStatus: 1 });

// Check if on cooldown
donorProfileSchema.methods.isOnCooldown = function () {
    if (!this.cooldownUntil) return false;
    return new Date() < this.cooldownUntil;
};

// Record a donation
donorProfileSchema.methods.recordDonation = function () {
    this.totalDonations += 1;
    this.lastDonationDate = new Date();
    this.cooldownUntil = new Date(Date.now() + 56 * 24 * 60 * 60 * 1000); // 56 days
    this.availability = 'on-cooldown';

    // Update streaks
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    if (this.streaks.lastDonationMonth) {
        const [prevYear, prevMonth] = this.streaks.lastDonationMonth.split('-').map(Number);
        const prevDate = new Date(prevYear, prevMonth);
        const monthsDiff = (now.getFullYear() - prevDate.getFullYear()) * 12 + now.getMonth() - prevDate.getMonth();
        if (monthsDiff <= 3) {
            this.streaks.current += 1;
        } else {
            this.streaks.current = 1;
        }
    } else {
        this.streaks.current = 1;
    }
    this.streaks.lastDonationMonth = currentMonth;
    if (this.streaks.current > this.streaks.longest) {
        this.streaks.longest = this.streaks.current;
    }

    // Award badges
    const badgeMap = {
        1: { name: 'First Drop', icon: '🩸' },
        5: { name: 'Regular Hero', icon: '💪' },
        10: { name: 'Life Saver', icon: '⭐' },
        25: { name: 'Legend', icon: '🏆' },
    };

    if (badgeMap[this.totalDonations]) {
        const badge = badgeMap[this.totalDonations];
        const alreadyHas = this.badges.some((b) => b.name === badge.name);
        if (!alreadyHas) {
            this.badges.push(badge);
        }
    }
};

const DonorProfile = mongoose.model('DonorProfile', donorProfileSchema);
export default DonorProfile;
