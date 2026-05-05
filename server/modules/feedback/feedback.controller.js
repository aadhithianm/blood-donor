import feedbackService from './feedback.service.js';
import { sendSuccess } from '../../utils/response.js';

export const submitFeedback = async (req, res, next) => {
    try {
        const feedback = await feedbackService.submitFeedback({
            ...req.body,
            fromUserId: req.user._id,
        });
        sendSuccess(res, { statusCode: 201, message: 'Feedback submitted', data: feedback });
    } catch (error) { next(error); }
};

export const getFeedbackForUser = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const result = await feedbackService.getFeedbackForUser(req.params.id, parseInt(page), parseInt(limit));
        sendSuccess(res, { data: result.feedbacks, pagination: result.pagination });
    } catch (error) { next(error); }
};
