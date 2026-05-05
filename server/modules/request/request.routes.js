import { Router } from 'express';
import * as requestController from './request.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { roleGuard } from '../../middlewares/roleGuard.middleware.js';
import { validate } from '../auth/auth.validation.js';
import { createRequestSchema } from './request.validation.js';

const router = Router();

router.use(authenticate);

router.post('/', roleGuard('requester', 'hospital'), validate(createRequestSchema), requestController.createRequest);
router.get('/my', requestController.getMyRequests);
router.get('/feed', roleGuard('donor'), requestController.getDonorFeed);
router.get('/donor/history', roleGuard('donor'), requestController.getDonorHistory);
router.get('/:id', requestController.getRequest);
router.post('/:id/accept', roleGuard('donor'), requestController.acceptRequest);
router.post('/:id/complete', roleGuard('donor'), requestController.completeRequest);

export default router;
