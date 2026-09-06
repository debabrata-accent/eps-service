import { Router } from 'express';
import { getOwnerReport, getEngineerReport, getAdminReport } from '../controllers/report.controller';
import { verifyAccessToken, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { Role } from '@eps/shared';

const router = Router();
router.use(verifyAccessToken);

router.get('/factory-owner', requireRole(Role.FACTORY_OWNER), asyncHandler(getOwnerReport));
router.get('/engineer', requireRole(Role.ENGINEER), asyncHandler(getEngineerReport));
router.get('/admin', requireRole(Role.CUSTOMER_EXECUTIVE), asyncHandler(getAdminReport));

export default router;
