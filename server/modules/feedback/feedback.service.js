import Feedback from './feedback.model.js';
import User from '../auth/auth.model.js';
import DonorProfile from '../donor/donor.model.js';
import { AppError } from '../../utils/response.js';

class FeedbackService {
    async submitFeedback({ requestId, fromUserId, toUserId, rating, comment, reportType }) {
        // Check for duplicate feedback
        const existing = await Feedback.findOne({ requestId, fromUserId, toUserId });
        if (existing) throw new AppError('Feedback already submitted for this request', 400);

        const feedback = await Feedback.create({
            requestId, fromUserId, toUserId, rating, comment, reportType: reportType || 'none',
        });

        // Recalculate trust score async
        await this.recalculateTrustScore(toUserId);

        return feedback;
    }

    async recalculateTrustScore(userId) {
        const feedbacks = await Feedback.find({ toUserId: userId });
        const donorProfile = await DonorProfile.findOne({ userId });

        if (feedbacks.length === 0) return;

        // Base: average rating × 20
        const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
        let score = avgRating * 20;

        // Bonus: +2 per completed donation (capped at +20)
        if (donorProfile) {
            score += Math.min(donorProfile.totalDonations * 2, 20);
        }

        // Penalty: -10 per valid report
        const validReports = feedbacks.filter((f) => f.reportType !== 'none');
        score -= validReports.length * 10;

        // Clamp to 0–100
        score = Math.max(0, Math.min(100, Math.round(score)));

        const user = await User.findByIdAndUpdate(userId, { trustScore: score }, { new: true });

        // Auto-suspend if trust score < 10
        if (score < 10 && !user.isSuspended) {
            user.isSuspended = true;
            await user.save();
        }

        return score;
    }

    async getFeedbackForUser(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [feedbacks, total] = await Promise.all([
            Feedback.find({ toUserId: userId })
                .sort({ createdAt: -1 }).skip(skip).limit(limit)
                .populate('fromUserId', 'name avatar'),
            Feedback.countDocuments({ toUserId: userId }),
        ]);

        return { feedbacks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
}

export default new FeedbackService();
