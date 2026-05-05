import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BloodRequest',
        required: true,
    },
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        maxlength: 500,
    },
    reportType: {
        type: String,
        enum: ['none', 'no-show', 'fake-request', 'unsafe-behavior'],
        default: 'none',
    },
}, {
    timestamps: true,
});

feedbackSchema.index({ requestId: 1 });
feedbackSchema.index({ toUserId: 1 });
feedbackSchema.index({ fromUserId: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
