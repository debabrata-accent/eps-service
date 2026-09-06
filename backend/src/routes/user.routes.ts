import { Router } from 'express';
import {
  listUsers, createUser, getUser, updateUser, disableUser, updateFcmToken,
} from '../controllers/user.controller';
import { verifyAccessToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createUserSchema, updateUserSchema, fcmTokenSchema } from '../utils/schemas';
import { Role } from '@eps/shared';

const router = Router();

router.use(verifyAccessToken);

// All authenticated users can update their FCM token
router.put('/me/fcm-token', validate(fcmTokenSchema), asyncHandler(updateFcmToken));

// Customer Executive only
router.get('/', requireRole(Role.CUSTOMER_EXECUTIVE), asyncHandler(listUsers));
router.post('/', requireRole(Role.CUSTOMER_EXECUTIVE), validate(createUserSchema), asyncHandler(createUser));
router.get('/:id', requireRole(Role.CUSTOMER_EXECUTIVE), asyncHandler(getUser));
router.put('/:id', requireRole(Role.CUSTOMER_EXECUTIVE), validate(updateUserSchema), asyncHandler(updateUser));
router.patch('/:id/disable', requireRole(Role.CUSTOMER_EXECUTIVE), asyncHandler(disableUser));

export default router;
