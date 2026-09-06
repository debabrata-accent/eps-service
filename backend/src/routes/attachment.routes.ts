import { Router } from 'express';
import { uploadAttachment, getAttachments, deleteAttachment } from '../controllers/attachment.controller';
import { verifyAccessToken } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { upload } from '../config/multer';

// These routes are mounted at /api/tickets/:id/attachments
// Note: ticketId param comes from the parent router merge
const router = Router({ mergeParams: true });

router.use(verifyAccessToken);

router.post('/', upload.single('file'), asyncHandler(uploadAttachment));
router.get('/', asyncHandler(getAttachments));
router.delete('/:attachmentId', asyncHandler(deleteAttachment));

export default router;
