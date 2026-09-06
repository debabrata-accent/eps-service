import { Request, Response } from 'express';
import ServiceReport from '../models/ServiceReport';
import Ticket from '../models/Ticket';
import { sendSuccess, sendError } from '../utils/response';
import { Role, TicketStatus } from '@eps/shared';

export const createServiceReport = async (req: Request, res: Response): Promise<void> => {
  const { ticketId, visitNotes, rootCause, solutionProvided, sparePartsUsed, completionNote } =
    req.body;

  const ticket = await Ticket.findOne({
    _id: ticketId,
    assignedEngineerId: req.user!.userId,
  }).lean();

  if (!ticket) {
    sendError(res, 'Ticket not found or not assigned to you', 404);
    return;
  }

  const existing = await ServiceReport.findOne({ ticketId });
  if (existing) {
    sendError(res, 'Service report already exists for this ticket. Use PUT to update.', 409);
    return;
  }

  const report = await ServiceReport.create({
    ticketId,
    engineerId: req.user!.userId,
    visitNotes,
    rootCause,
    solutionProvided,
    sparePartsUsed,
    completionNote,
  });

  sendSuccess(res, report, 'Service report created', 201);
};

export const getServiceReportByTicket = async (req: Request, res: Response): Promise<void> => {
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
  if (role === Role.ENGINEER && ticket.assignedEngineerId?.toString() !== userId) {
    sendError(res, 'Forbidden', 403);
    return;
  }

  const report = await ServiceReport.findOne({ ticketId: req.params.ticketId })
    .populate('engineerId', 'fullName phone')
    .lean();

  if (!report) {
    sendError(res, 'Service report not found', 404);
    return;
  }

  sendSuccess(res, report);
};

export const updateServiceReport = async (req: Request, res: Response): Promise<void> => {
  const report = await ServiceReport.findOne({
    _id: req.params.id,
    engineerId: req.user!.userId,
  });

  if (!report) {
    sendError(res, 'Report not found or not yours', 404);
    return;
  }

  const { visitNotes, rootCause, solutionProvided, sparePartsUsed, completionNote } = req.body;
  if (visitNotes) report.visitNotes = visitNotes;
  if (rootCause) report.rootCause = rootCause;
  if (solutionProvided) report.solutionProvided = solutionProvided;
  if (sparePartsUsed !== undefined) report.sparePartsUsed = sparePartsUsed;
  if (completionNote) report.completionNote = completionNote;

  await report.save();
  sendSuccess(res, report, 'Report updated');
};
