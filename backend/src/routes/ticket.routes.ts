import { Router } from 'express';
import {
  createTicket, getMyTickets, getAllTickets, getTicketById,
  updateTicket, submitTicket, cancelTicket,
  markUnderReview, proposeCost, approveTicket, rejectTicket,
  approveQuote, rejectQuote, payAtSite,
  getEngineerQueue, selfAssignTicket, getMyAssignedTickets,
  updateEngineerStatus, getTicketHistory, createFollowUp,
} from '../controllers/ticket.controller';
import { verifyAccessToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createTicketSchema, proposeCostSchema, updateEngineerStatusSchema,
} from '../utils/schemas';
import { Role } from '@eps/shared';

const router = Router();
router.use(verifyAccessToken);

// Engineer queue (must come before /:id to avoid route conflict)
router.get(
  '/queue',
  requireRole(Role.ENGINEER, Role.CUSTOMER_EXECUTIVE),
  asyncHandler(getEngineerQueue)
);

// Engineer: my assigned jobs
router.get(
  '/my-assigned',
  requireRole(Role.ENGINEER),
  asyncHandler(getMyAssignedTickets)
);

// Factory Owner: own tickets
router.get(
  '/my',
  requireRole(Role.FACTORY_OWNER),
  asyncHandler(getMyTickets)
);

// Customer Executive: all tickets
router.get(
  '/',
  requireRole(Role.CUSTOMER_EXECUTIVE),
  asyncHandler(getAllTickets)
);

// Factory Owner: create ticket
router.post(
  '/',
  requireRole(Role.FACTORY_OWNER),
  validate(createTicketSchema),
  asyncHandler(createTicket)
);

// Shared: get ticket by id (access enforced inside controller)
router.get('/:id', asyncHandler(getTicketById));

// Factory Owner: edit draft
router.put(
  '/:id',
  requireRole(Role.FACTORY_OWNER),
  validate(createTicketSchema),
  asyncHandler(updateTicket)
);

// Factory Owner: submit
router.patch('/:id/submit', requireRole(Role.FACTORY_OWNER), asyncHandler(submitTicket));

// Factory Owner: quote response
router.patch('/:id/approve-quote', requireRole(Role.FACTORY_OWNER), asyncHandler(approveQuote));
router.patch('/:id/reject-quote', requireRole(Role.FACTORY_OWNER), asyncHandler(rejectQuote));
// TEMPORARY (testing): let owner defer payment to on-site, marking advance as paid
router.patch('/:id/pay-at-site', requireRole(Role.FACTORY_OWNER), asyncHandler(payAtSite));

// Factory Owner: follow-up
router.post('/:id/follow-up', requireRole(Role.FACTORY_OWNER), asyncHandler(createFollowUp));

// Customer Executive: workflow
router.patch('/:id/review', requireRole(Role.CUSTOMER_EXECUTIVE), asyncHandler(markUnderReview));
router.patch(
  '/:id/propose-cost',
  requireRole(Role.CUSTOMER_EXECUTIVE),
  validate(proposeCostSchema),
  asyncHandler(proposeCost)
);
router.patch('/:id/approve', requireRole(Role.CUSTOMER_EXECUTIVE), asyncHandler(approveTicket));
router.patch('/:id/reject', requireRole(Role.CUSTOMER_EXECUTIVE), asyncHandler(rejectTicket));

// Cancel: FO or CE
router.patch(
  '/:id/cancel',
  requireRole(Role.FACTORY_OWNER, Role.CUSTOMER_EXECUTIVE),
  asyncHandler(cancelTicket)
);

// Engineer: self-assign
router.patch('/:id/assign', requireRole(Role.ENGINEER), asyncHandler(selfAssignTicket));

// Engineer: update work status
router.patch(
  '/:id/engineer-status',
  requireRole(Role.ENGINEER),
  validate(updateEngineerStatusSchema),
  asyncHandler(updateEngineerStatus)
);

// All roles: ticket history
router.get('/:id/history', asyncHandler(getTicketHistory));

export default router;
