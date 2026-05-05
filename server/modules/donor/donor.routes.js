import { Router } from 'express';
import * as donorController from './donor.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { roleGuard } from '../../middlewares/roleGuard.middleware.js';
import { uploadMedCert } from '../../middlewares/upload.middleware.js';
import { validate } from '../auth/auth.validation.js';
import { availabilitySchema } from './donor.validation.js';

const router = Router();

router.use(authenticate);
router.use(roleGuard('donor'));

router.get('/profile', donorController.getProfile);
router.put('/profile', donorController.updateProfile);
router.post('/upload-certificate', uploadMedCert.single('certificate'), donorController.uploadCertificate);
router.put('/availability', validate(availabilitySchema), donorController.toggleAvailability);
router.get('/dashboard', donorController.getDashboard);

export default router;
