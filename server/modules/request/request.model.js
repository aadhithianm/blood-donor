import mongoose from 'mongoose';

const bloodRequestSchema = new mongoose.Schema({
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: true,
    },
    unitsNeeded: {
        type: Number,
        required: true,
        min: 1,
        max: 20,
    },
    unitsFulfilled: {
        type: Number,
        default: 0,
    },
    patientName: {
        type: String,
        required: true,
        trim: true,
    },
    contactNumber: {
        type: String,
        required: true,
        trim: true,
    },
    reasonForRequest: {
        type: String,
        enum: ['Surgery', 'Accident', 'Emergency', 'Other'],
        required: true,
    },
    customReason: {
        type: String,
        trim: true,
    },
    urgency: {
        type: String,
        enum: ['normal', 'urgent', 'critical'],
        default: 'normal',
    },
    proofDocumentUrl: {
        type: String,
    },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }, // [lng, lat]
        formattedAddress: String,
        district: String,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'in-progress', 'completed', 'expired', 'cancelled'],
        default: 'pending',
    },
    assignedDonors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DonorAssignment',
    }],
    notes: String,
    expiresAt: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
});

bloodRequestSchema.index({ requesterId: 1 });
bloodRequestSchema.index({ status: 1 });
bloodRequestSchema.index({ bloodGroup: 1, status: 1 });
bloodRequestSchema.index({ 'location.coordinates': '2dsphere' });
bloodRequestSchema.index({ expiresAt: 1 });

const donorAssignmentSchema = new mongoose.Schema({
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodRequest',
        required: true,
    },
    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled', 'reassigned'],
        default: 'pending',
    },
    acceptedAt: Date,
    completedAt: Date,
    startLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
    },
    lastLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
    },
    lastLocationUpdate: Date,
}, {
    timestamps: true,
});

donorAssignmentSchema.index({ requestId: 1, donorId: 1 });
donorAssignmentSchema.index({ donorId: 1, status: 1 });

export const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);
export const DonorAssignment = mongoose.model('DonorAssignment', donorAssignmentSchema);
