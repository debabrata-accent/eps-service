import { Router } from 'express';
import {
  createOrder, razorpayWebhook, getPaymentByTicket, listAllPayments,
} from '../controllers/payment.controller';
import { verifyAccessToken, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createOrderSchema } from '../utils/schemas';
import { Role } from '@eps/shared';
import Ticket from '../models/Ticket';
import { PaymentStatus, TicketStatus } from '@eps/shared';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// Webhook: public (no JWT), raw body needed for signature verification
router.post('/webhook', asyncHandler(razorpayWebhook));

// All below require auth
router.use(verifyAccessToken);

// DEV-ONLY: simulate a completed advance payment (no Razorpay keys needed locally).
// Disabled entirely in production.
if (process.env.NODE_ENV !== 'production') {
  router.post(
    '/dev/mark-paid',
    requireRole(Role.CUSTOMER_EXECUTIVE),
    asyncHandler(async (req, res) => {
      const { ticketId } = req.body;
      const ticket = await Ticket.findOne({ _id: ticketId, status: TicketStatus.ADVANCE_PENDING });
      if (!ticket) {
        sendError(res, 'Ticket not found or not awaiting payment', 404);
        return;
      }
      ticket.paymentStatus = PaymentStatus.PAID;
      await ticket.save();
      sendSuccess(res, ticket, '[DEV] Payment marked as paid');
    })
  );
}

router.post(
  '/create-order',
  requireRole(Role.CUSTOMER_EXECUTIVE),
  validate(createOrderSchema),
  asyncHandler(createOrder)
);

router.get(
  '/',
  requireRole(Role.CUSTOMER_EXECUTIVE),
  asyncHandler(listAllPayments)
);

router.get(
  '/ticket/:ticketId',
  requireRole(Role.FACTORY_OWNER, Role.CUSTOMER_EXECUTIVE),
  asyncHandler(getPaymentByTicket)
);

export default router;
