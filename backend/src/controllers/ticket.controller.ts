import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket';
import TicketHistory from '../models/TicketHistory';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { generateTicketNumber } from '../utils/ticketNumber';
import { createNotification, notifyAllEngineers } from '../services/notification.service';
import {
  TicketStatus,
  EngineerStatus,
  PaymentStatus,
  NotificationType,
  Role,
  ENGINEER_STATUS_ORDER,
} from '@eps/shared';

// ─── Helper: record status change ────────────────────────────────────────────

const recordHistory = async (
  ticketId: string | mongoose.Types.ObjectId,
  oldStatus: string,
  newStatus: string,
  changedBy: string,
  note?: string
): Promise<void> => {
  await TicketHistory.create({ ticketId, oldStatus, newStatus, changedBy, note });
};

// ─── Factory Owner ────────────────────────────────────────────────────────────

export const createTicket = async (req: Request, res: Response): Promise<void> => {
  const ticketNumber = await generateTicketNumber();

  const ticket = await Ticket.create({
    ...req.body,
    ticketNumber,
    ownerId: req.user!.userId,
    status: TicketStatus.DRAFT,
    paymentStatus: PaymentStatus.NOT_REQUIRED,
  });

  await recordHistory(ticket._id, '', TicketStatus.DRAFT, req.user!.userId, 'Ticket created');
  sendSuccess(res, ticket, 'Ticket created', 201);
};

export const getMyTickets = async (req: Request, res: Response): Promise<void> => {
  const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { ownerId: req.user!.userId };
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate('assignedEngineerId', 'fullName phone')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 })
      .lean(),
    Ticket.countDocuments(filter),
  ]);

  sendPaginated(res, tickets, total, pageNum, limitNum);
};

export const getAllTickets = async (req: Request, res: Response): Promise<void> => {
  const {
    status, priority, ownerId, page = '1', limit = '20',
    dateFrom, dateTo,
  } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (ownerId) filter.ownerId = ownerId;
  if (dateFrom || dateTo) {
    filter.createdAt = {
      ...(dateFrom && { $gte: new Date(dateFrom) }),
      ...(dateTo && { $lte: new Date(dateTo) }),
    };
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate('ownerId', 'fullName companyName phone')
      .populate('assignedEngineerId', 'fullName phone')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 })
      .lean(),
    Ticket.countDocuments(filter),
  ]);

  sendPaginated(res, tickets, total, pageNum, limitNum);
};

export const getTicketById = async (req: Request, res: Response): Promise<void> => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('ownerId', 'fullName companyName email phone')
    .populate('assignedEngineerId', 'fullName phone email')
    .lean();

  if (!ticket) {
    sendError(res, 'Ticket not found', 404);
    return;
  }

  const { role, userId } = req.user!;

  if (role === Role.FACTORY_OWNER && ticket.ownerId._id?.toString() !== userId) {
    sendError(res, 'Forbidden', 403);
    return;
  }
  if (
    role === Role.ENGINEER &&
    ticket.assignedEngineerId?._id?.toString() !== userId
  ) {
    sendError(res, 'Forbidden', 403);
    return;
  }

  sendSuccess(res, ticket);
};

export const updateTicket = async (req: Request, res: Response): Promise<void> => {
  const ticket = await Ticket.findOne({
    _id: req.params.id,
    ownerId: req.user!.userId,
    status: TicketStatus.DRAFT,
  });

  if (!ticket) {
    sendError(res, 'Ticket not found or cannot be edited in current status', 404);
    return;
  }

  Object.assign(ticket, req.body);
  await ticket.save();
  sendSuccess(res, ticket, 'Ticket updated');
};

export const submitTicket = async (req: Request, res: Response): Promise<void> => {
  const ticket = await Ticket.findOne({
    _id: req.params.id,
    ownerId: req.user!.userId,
    status: TicketStatus.DRAFT,
  });

  if (!ticket) {
    sendError(res, 'Ticket not found or cannot be submitted', 404);
    return;
  }

  const oldStatus = ticket.status;
  ticket.status = TicketStatus.SUBMITTED;
  await ticket.save();
  await recordHistory(ticket._id, oldStatus, TicketStatus.SUBMITTED, req.user!.userId);

  sendSuccess(res, ticket, 'Ticket submitted successfully');
};

export const cancelTicket = async (req: Request, res: Response): Promise<void> => {
  const { role, userId } = req.user!;
  const filter: Record<string, unknown> = { _id: req.params.id };

  if (role === Role.FACTORY_OWNER) filter.ownerId = userId;

  const ticket = await Ticket.findOne(filter);
  if (!ticket) {
    sendError(res, 'Ticket not found', 404);
    return;
  }

  const terminalStatuses = [TicketStatus.COMPLETED, TicketStatus.CANCELLED, TicketStatus.REJECTED];
  if (terminalStatuses.includes(ticket.status)) {
    sendError(res, `Cannot cancel a ticket in "${ticket.status}" status`, 400);
    return;
  }

  const oldStatus = ticket.status;
  ticket.status = TicketStatus.CANCELLED;
  await ticket.save();
  await recordHistory(ticket._id, oldStatus, TicketStatus.CANCELLED, userId, req.body.note);

  sendSuccess(res, ticket, 'Ticket cancelled');
};

// ─── Customer Executive ───────────────────────────────────────────────────────

export const markUnderReview = async (req: Request, res: Response): Promise<void> => {
  const ticket = await Ticket.findOne({ _id: req.params.id, status: TicketStatus.SUBMITTED });
  if (!ticket) {
    sendError(res, 'Ticket not found or not in submitted status', 404);
    return;
  }

  const oldStatus = ticket.status;
  ticket.status = TicketStatus.UNDER_REVIEW;
  await ticket.save();
  await recordHistory(ticket._id, oldStatus, TicketStatus.UNDER_REVIEW, req.user!.userId);

  await createNotification({
    userId: ticket.ownerId,
    title: 'Ticket Under Review',
    message: `Your ticket ${ticket.ticketNumber} is now being reviewed.`,
    type: NotificationType.TICKET_UPDATE,
    ticketId: ticket._id,
  });

  sendSuccess(res, ticket);
};

export const proposeCost = async (req: Request, res: Response): Promise<void> => {
  const { quotedAmount, advanceAmount, note } = req.body;

  const ticket = await Ticket.findOne({
    _id: req.params.id,
    status: { $in: [TicketStatus.UNDER_REVIEW, TicketStatus.SUBMITTED] },
  });
  if (!ticket) {
    sendError(res, 'Ticket not found or not reviewable', 404);
    return;
  }

  const oldStatus = ticket.status;
  ticket.status = TicketStatus.COST_PROPOSED;
  ticket.quotedAmount = quotedAmount;
  ticket.advanceAmount = advanceAmount ?? Math.round(quotedAmount * 0.5);
  ticket.paymentStatus = PaymentStatus.PENDING;
  await ticket.save();
  await recordHistory(ticket._id, oldStatus, TicketStatus.COST_PROPOSED, req.user!.userId, note);

  await createNotification({
    userId: ticket.ownerId,
    title: 'Service Quote Proposed',
    message: `A quote of ₹${quotedAmount} has been proposed for ticket ${ticket.ticketNumber}. Please review and approve.`,
    type: NotificationType.QUOTE,
    ticketId: ticket._id,
  });

  sendSuccess(res, ticket);
};

export const approveTicket = async (req: Request, res: Response): Promise<void> => {
  const ticket = await Ticket.findOne({
    _id: req.params.id,
    status: { $in: [TicketStatus.ADVANCE_PENDING, TicketStatus.APPROVED] },
  });
  if (!ticket) {
    sendError(res, 'Ticket not found or not approvable', 404);
    return;
  }

  if (ticket.paymentStatus !== PaymentStatus.PAID) {
    sendError(res, 'Advance payment must be confirmed before approval', 400);
    return;
  }

  const oldStatus = ticket.status;
  ticket.status = TicketStatus.OPEN_FOR_ASSIGNMENT;
  await ticket.save();
  await recordHistory(ticket._id, oldStatus, TicketStatus.OPEN_FOR_ASSIGNMENT, req.user!.userId);

  // Notify all active engineers
  await notifyAllEngineers(
    'New Job Available',
    `A new electrical panel service job (${ticket.ticketNumber}) is available for assignment.`,
    ticket._id
  );

  await createNotification({
    userId: ticket.ownerId,
    title: 'Engineer Being Assigned',
    message: `Your ticket ${ticket.ticketNumber} has been approved and engineers are being assigned.`,
    type: NotificationType.TICKET_UPDATE,
    ticketId: ticket._id,
  });

  sendSuccess(res, ticket);
};

export const rejectTicket = async (req: Request, res: Response): Promise<void> => {
  const terminalStatuses = [TicketStatus.COMPLETED, TicketStatus.CANCELLED, TicketStatus.REJECTED];

  const ticket = await Ticket.findOne({
    _id: req.params.id,
    status: { $nin: terminalStatuses },
  });
  if (!ticket) {
    sendError(res, 'Ticket not found or already in a terminal status', 404);
    return;
  }

  const oldStatus = ticket.status;
  ticket.status = TicketStatus.REJECTED;
  await ticket.save();
  await recordHistory(ticket._id, oldStatus, TicketStatus.REJECTED, req.user!.userId, req.body.reason);

  await createNotification({
    userId: ticket.ownerId,
    title: 'Ticket Rejected',
    message: `Your ticket ${ticket.ticketNumber} has been rejected. Reason: ${req.body.reason || 'Not specified'}.`,
    type: NotificationType.TICKET_UPDATE,
    ticketId: ticket._id,
  });

  sendSuccess(res, ticket);
};

// ─── Factory Owner: Quote Response ───────────────────────────────────────────

export const approveQuote = async (req: Request, res: Response): Promise<void> => {
  const ticket = await Ticket.findOne({
    _id: req.params.id,
    ownerId: req.user!.userId,
    status: TicketStatus.COST_PROPOSED,
  });
  if (!ticket) {
    sendError(res, 'Ticket not found or quote not pending', 404);
    return;
  }

  const oldStatus = ticket.status;
  ticket.status = TicketStatus.ADVANCE_PENDING;
  await ticket.save();
  await recordHistory(ticket._id, oldStatus, TicketStatus.ADVANCE_PENDING, req.user!.userId, 'Customer approved quote');

  sendSuccess(res, ticket, 'Quote approved. Please proceed to payment.');
};

export const rejectQuote = async (req: Request, res: Response): Promise<void> => {
  const ticket = await Ticket.findOne({
    _id: req.params.id,
    ownerId: req.user!.userId,
    status: TicketStatus.COST_PROPOSED,
  });
  if (!ticket) {
    sendError(res, 'Ticket not found or quote not pending', 404);
    return;
  }

  const oldStatus = ticket.status;
  ticket.status = TicketStatus.UNDER_REVIEW;
  await ticket.save();
  await recordHistory(ticket._id, oldStatus, TicketStatus.UNDER_REVIEW, req.user!.userId, req.body.note || 'Customer rejected quote');

  sendSuccess(res, ticket, 'Quote rejected. Ticket returned to review.');
};

// ─── Engineer Queue & Assignment ──────────────────────────────────────────────

export const getEngineerQueue = async (req: Request, res: Response): Promise<void> => {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [tickets, total] = await Promise.all([
    Ticket.find({ status: TicketStatus.OPEN_FOR_ASSIGNMENT })
      .populate('ownerId', 'fullName companyName phone')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: 1 }) // oldest first (FCFS)
      .lean(),
    Ticket.countDocuments({ status: TicketStatus.OPEN_FOR_ASSIGNMENT }),
  ]);

  sendPaginated(res, tickets, total, pageNum, limitNum);
};

export const selfAssignTicket = async (req: Request, res: Response): Promise<void> => {
  const engineerId = req.user!.userId;

  // Atomic: only succeeds if ticket is still open_for_assignment and unassigned
  const ticket = await Ticket.findOneAndUpdate(
    {
      _id: req.params.id,
      status: TicketStatus.OPEN_FOR_ASSIGNMENT,
      assignedEngineerId: null,
    },
    {
      $set: {
        assignedEngineerId: engineerId,
        status: TicketStatus.ASSIGNED,
        engineerStatus: EngineerStatus.ASSIGNED,
        assignedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!ticket) {
    sendError(res, 'Ticket is no longer available — it may have been claimed by another engineer.', 409);
    return;
  }

  await recordHistory(ticket._id, TicketStatus.OPEN_FOR_ASSIGNMENT, TicketStatus.ASSIGNED, engineerId, 'Self-assigned by engineer');

  await createNotification({
    userId: ticket.ownerId,
    title: 'Engineer Assigned',
    message: `An engineer has been assigned to your ticket ${ticket.ticketNumber}.`,
    type: NotificationType.ASSIGNMENT,
    ticketId: ticket._id,
  });

  sendSuccess(res, ticket, 'Ticket successfully assigned to you.');
};

export const getMyAssignedTickets = async (req: Request, res: Response): Promise<void> => {
  const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { assignedEngineerId: req.user!.userId };
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate('ownerId', 'fullName companyName phone')
      .skip(skip)
      .limit(limitNum)
      .sort({ assignedAt: -1 })
      .lean(),
    Ticket.countDocuments(filter),
  ]);

  sendPaginated(res, tickets, total, pageNum, limitNum);
};

export const updateEngineerStatus = async (req: Request, res: Response): Promise<void> => {
  const { engineerStatus, note } = req.body;

  const ticket = await Ticket.findOne({
    _id: req.params.id,
    assignedEngineerId: req.user!.userId,
  });

  if (!ticket) {
    sendError(res, 'Ticket not found or not assigned to you', 404);
    return;
  }

  // Validate progression — no skipping, no going backward
  const currentIdx = ENGINEER_STATUS_ORDER.indexOf(ticket.engineerStatus as EngineerStatus);
  const nextIdx = ENGINEER_STATUS_ORDER.indexOf(engineerStatus);

  if (nextIdx !== currentIdx + 1) {
    sendError(
      res,
      `Invalid status transition. Current: "${ticket.engineerStatus}". Next allowed: "${ENGINEER_STATUS_ORDER[currentIdx + 1]}"`,
      400
    );
    return;
  }

  const oldStatus = ticket.engineerStatus!;
  ticket.engineerStatus = engineerStatus;

  if (engineerStatus === EngineerStatus.COMPLETED) {
    ticket.status = TicketStatus.COMPLETED;
    ticket.completedAt = new Date();
  }

  await ticket.save();
  await recordHistory(ticket._id, oldStatus, engineerStatus, req.user!.userId, note);

  // Notify factory owner and CE
  const statusLabel = engineerStatus.replace(/_/g, ' ');
  await createNotification({
    userId: ticket.ownerId,
    title: 'Work Status Updated',
    message: `Engineer updated status for ticket ${ticket.ticketNumber}: ${statusLabel}`,
    type: NotificationType.TICKET_UPDATE,
    ticketId: ticket._id,
  });

  sendSuccess(res, ticket, 'Status updated');
};

// ─── Ticket History ───────────────────────────────────────────────────────────

export const getTicketHistory = async (req: Request, res: Response): Promise<void> => {
  const ticket = await Ticket.findById(req.params.id).lean();
  if (!ticket) {
    sendError(res, 'Ticket not found', 404);
    return;
  }

  const { role, userId } = req.user!;
  if (role === Role.FACTORY_OWNER && ticket.ownerId?.toString() !== userId) {
    sendError(res, 'Forbidden', 403);
    return;
  }
  if (role === Role.ENGINEER && ticket.assignedEngineerId?.toString() !== userId) {
    sendError(res, 'Forbidden', 403);
    return;
  }

  const history = await TicketHistory.find({ ticketId: req.params.id })
    .populate('changedBy', 'fullName role')
    .sort({ timestamp: 1 })
    .lean();

  sendSuccess(res, history);
};

// ─── Follow-up ────────────────────────────────────────────────────────────────

export const createFollowUp = async (req: Request, res: Response): Promise<void> => {
  const ticket = await Ticket.findOne({
    _id: req.params.id,
    ownerId: req.user!.userId,
    status: TicketStatus.COMPLETED,
  });

  if (!ticket) {
    sendError(res, 'Ticket not found or not completed', 404);
    return;
  }

  await recordHistory(
    ticket._id,
    TicketStatus.COMPLETED,
    TicketStatus.COMPLETED,
    req.user!.userId,
    `Follow-up: ${req.body.note}`
  );

  sendSuccess(res, null, 'Follow-up recorded');
};
