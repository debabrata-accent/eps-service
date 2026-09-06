import { Router } from 'express';
import { getNotifications, markRead, markAllRead } from '../controllers/notification.controller';
import { verifyAccessToken } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(verifyAccessToken);

router.get('/', asyncHandler(getNotifications));
router.patch('/read-all', asyncHandler(markAllRead));
router.patch('/:id/read', asyncHandler(markRead));

export default router;
