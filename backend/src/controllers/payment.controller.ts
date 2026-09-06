import { Request, Response } from 'express';
import crypto from 'crypto';
import Payment from '../models/Payment';
import Ticket from '../models/Ticket';
import { getRazorpay } from '../config/razorpay';
import { sendSuccess, sendError } from '../utils/response';
import { createNotification } from '../services/notification.service';
import { NotificationType, PaymentStatus, TicketStatus, Role } from '@eps/shared';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const { ticketId } = req.body;

  const ticket = await Ticket.findOne({
    _id: ticketId,
    status: TicketStatus.ADVANCE_PENDING,
  });
  if (!ticket) {
    sendError(res, 'Ticket not found or not awaiting payment', 404);
    return;
  }

  if (!ticket.advanceAmount || ticket.advanceAmount <= 0) {
    sendError(res, 'No advance amount set on this ticket', 400);
    return;
  }

  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: Math.round(ticket.advanceAmount * 100), // paise
    currency: 'INR',
    receipt: ticket.ticketNumber,
    notes: {
      ticketId: ticket._id.toString(),
      ticketNumber: ticket.ticketNumber,
    },
  });

  const payment = await Payment.create({
    ticketId: ticket._id,
    ownerId: ticket.ownerId,
    totalAmount: ticket.quotedAmount ?? ticket.advanceAmount,
    advanceAmount: ticket.advanceAmount,
    razorpayOrderId: order.id,
    status: 'created',
  });

  ticket.paymentId = payment._id;
  await ticket.save();

  sendSuccess(
    res,
    {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      ticketNumber: ticket.ticketNumber,
      paymentId: payment._id,
    },
    'Payment order created',
    201
  );
};

export const razorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    res.status(500).json({ message: 'Webhook secret not configured' });
    return;
  }

  const signature = req.headers['x-razorpay-signature'] as string;

  // The webhook route uses express.raw(), so req.body is a Buffer.
  // Verify the HMAC against the exact raw bytes Razorpay signed.
  const rawBody: Buffer = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body));

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  // Constant-time comparison to avoid timing attacks
  const signatureValid =
    !!signature &&
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!signatureValid) {
    res.status(400).json({ message: 'Invalid webhook signature' });
    return;
  }

  let parsed: { event: string; payload: any };
  try {
    parsed = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).json({ message: 'Invalid webhook payload' });
    return;
  }
  const { event, payload } = parsed;

  if (event === 'payment.captured') {
    const razorpayPaymentId: string = payload.payment.entity.id;
    const razorpayOrderId: string = payload.payment.entity.order_id;

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        $set: {
          razorpayPaymentId,
          status: 'paid',
          paidAt: new Date(),
        },
      },
      { new: true }
    );

    if (!payment) {
      res.status(200).json({ received: true }); // idempotent
      return;
    }

    // Update ticket payment status
    const ticket = await Ticket.findByIdAndUpdate(
      payment.ticketId,
      {
        $set: { paymentStatus: PaymentStatus.PAID },
      },
      { new: true }
    );

    if (ticket) {
      await createNotification({
        userId: ticket.ownerId,
        title: 'Payment Confirmed',
        message: `Your advance payment for ticket ${ticket.ticketNumber} has been received.`,
        type: NotificationType.PAYMENT,
        ticketId: ticket._id,
      });
    }
  }

  // Always respond 200 to Razorpay
  res.status(200).json({ received: true });
};

export const getPaymentByTicket = async (req: Request, res: Response): Promise<void> => {
  const ticket = await Ticket.findById(req.params.ticketId).lean();
  if (!ticket) {
    sendError(res, 'Ticket not found', 404);
    return;
  }

  const { role, userId } = req.user!;
  if (role === Role.FACTORY_OWNER && ticket.ownerId?.toString() !== userId) {
    sendError(res, 'Forbidden', 403);
    return;
  }

  const payment = await Payment.findOne({ ticketId: req.params.ticketId })
    .populate('ownerId', 'fullName companyName')
    .lean();

  if (!payment) {
    sendError(res, 'No payment record found for this ticket', 404);
    return;
  }

  sendSuccess(res, payment);
};

export const listAllPayments = async (req: Request, res: Response): Promise<void> => {
  const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('ownerId', 'fullName companyName')
      .populate('ticketId', 'ticketNumber issueTitle')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 })
      .lean(),
    Payment.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: payments,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  });
};
