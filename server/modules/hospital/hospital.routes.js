import { Router } from 'express';
import * as hospitalController from './hospital.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { roleGuard } from '../../middlewares/roleGuard.middleware.js';
import { uploadLicense as uploadLicenseMiddleware } from '../../middlewares/upload.middleware.js';
import { validate } from '../auth/auth.validation.js';
import { verifyDonorSchema, updateInventorySchema, bulkRequestSchema } from './hospital.validation.js';

const router = Router();

router.use(authenticate);
router.use(roleGuard('hospital'));

router.get('/profile', hospitalController.getProfile);
router.put('/profile', hospitalController.updateProfile);
router.post('/upload-license', uploadLicenseMiddleware.single('license'), hospitalController.uploadLicense);
router.get('/donors/pending', hospitalController.getPendingDonors);
router.put('/donors/:id/verify', validate(verifyDonorSchema), hospitalController.verifyDonor);
router.get('/inventory', hospitalController.getInventory);
router.put('/inventory', validate(updateInventorySchema), hospitalController.updateInventory);
router.post('/requests/bulk', validate(bulkRequestSchema), hospitalController.createBulkRequest);

export default router;
