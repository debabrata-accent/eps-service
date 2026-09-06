import { Router } from 'express';
import {
  createServiceReport, getServiceReportByTicket, updateServiceReport,
} from '../controllers/serviceReport.controller';
import { verifyAccessToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createServiceReportSchema } from '../utils/schemas';
import { Role } from '@eps/shared';

const router = Router();
router.use(verifyAccessToken);

router.post(
  '/',
  requireRole(Role.ENGINEER),
  validate(createServiceReportSchema),
  asyncHandler(createServiceReport)
);

router.get(
  '/ticket/:ticketId',
  asyncHandler(getServiceReportByTicket)
);

router.put(
  '/:id',
  requireRole(Role.ENGINEER),
  asyncHandler(updateServiceReport)
);

export default router;
