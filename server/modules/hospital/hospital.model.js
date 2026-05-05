import mongoose from 'mongoose';

const hospitalProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    hospitalName: {
        type: String,
        required: true,
        trim: true,
    },
    licenseUrl: {
        type: String,
        default: '',
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    verifiedAt: Date,
    inventory: [{
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        },
        units: { type: Number, default: 0, min: 0 },
        lastUpdated: { type: Date, default: Date.now },
    }],
}, {
    timestamps: true,
});

hospitalProfileSchema.index({ verificationStatus: 1 });

const HospitalProfile = mongoose.model('HospitalProfile', hospitalProfileSchema);
export default HospitalProfile;
