import { Router } from 'express';
import * as feedbackController from './feedback.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../auth/auth.validation.js';
import { feedbackSchema } from './feedback.validation.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(feedbackSchema), feedbackController.submitFeedback);
router.get('/user/:id', feedbackController.getFeedbackForUser);

export default router;
