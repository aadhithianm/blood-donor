import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { uploadAvatar as uploadAvatarMiddleware } from '../../middlewares/upload.middleware.js';
import { validate } from '../auth/auth.validation.js';
import { updateProfileSchema, updateLocationSchema } from './user.validation.js';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getProfile);
router.put('/me', validate(updateProfileSchema), userController.updateProfile);
router.put('/me/location', validate(updateLocationSchema), userController.updateLocation);
router.post('/me/avatar', uploadAvatarMiddleware.single('avatar'), userController.uploadAvatar);

export default router;
