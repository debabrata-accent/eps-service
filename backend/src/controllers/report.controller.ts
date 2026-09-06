import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket';
import Payment from '../models/Payment';
import { sendSuccess } from '../utils/response';
import { TicketStatus, EngineerStatus } from '@eps/shared';

export const getOwnerReport = async (req: Request, res: Response): Promise<void> => {
  const ownerId = new mongoose.Types.ObjectId(req.user!.userId);

  const [stats, completedTickets] = await Promise.all([
    Ticket.aggregate([
      { $match: { ownerId } },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          openTickets: {
            $sum: {
              $cond: [
                { $in: ['$status', [TicketStatus.SUBMITTED, TicketStatus.UNDER_REVIEW, TicketStatus.COST_PROPOSED, TicketStatus.AWAITING_CUSTOMER_APPROVAL, TicketStatus.ADVANCE_PENDING, TicketStatus.APPROVED, TicketStatus.OPEN_FOR_ASSIGNMENT, TicketStatus.ASSIGNED]] },
                1, 0,
              ],
            },
          },
          completedTickets: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.COMPLETED] }, 1, 0] } },
          cancelledTickets: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.CANCELLED] }, 1, 0] } },
        },
      },
    ]),
    Ticket.find({ ownerId, status: TicketStatus.COMPLETED })
      .select('ticketNumber issueTitle completedAt createdAt quotedAmount')
      .sort({ completedAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const paymentStats = await Payment.aggregate([
    { $match: { ownerId, status: 'paid' } },
    { $group: { _id: null, totalSpend: { $sum: '$advanceAmount' } } },
  ]);

  const summary = stats[0] ?? { totalTickets: 0, openTickets: 0, completedTickets: 0, cancelledTickets: 0 };

  // Calculate average turnaround for completed tickets
  let avgTurnaroundDays = 0;
  const completedWithDates = await Ticket.find({
    ownerId,
    status: TicketStatus.COMPLETED,
    completedAt: { $exists: true },
  }).select('createdAt completedAt').lean();

  if (completedWithDates.length > 0) {
    const totalDays = completedWithDates.reduce((sum, t) => {
      const diff = (t.completedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + diff;
    }, 0);
    avgTurnaroundDays = Math.round(totalDays / completedWithDates.length);
  }

  sendSuccess(res, {
    ...summary,
    totalSpend: paymentStats[0]?.totalSpend ?? 0,
    avgTurnaroundDays,
    recentCompleted: completedTickets,
  });
};

export const getEngineerReport = async (req: Request, res: Response): Promise<void> => {
  const engineerId = new mongoose.Types.ObjectId(req.user!.userId);

  const [stats, recentCompleted] = await Promise.all([
    Ticket.aggregate([
      { $match: { assignedEngineerId: engineerId } },
      {
        $group: {
          _id: null,
          assignedTickets: { $sum: 1 },
          completedTickets: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.COMPLETED] }, 1, 0] } },
          visitCount: {
            $sum: {
              $cond: [
                { $in: ['$engineerStatus', [EngineerStatus.VISITED_FACTORY, EngineerStatus.ISSUE_IDENTIFIED, EngineerStatus.SOLUTION_PROPOSED, EngineerStatus.ISSUE_FIXED, EngineerStatus.COMPLETED]] },
                1, 0,
              ],
            },
          },
        },
      },
    ]),
    Ticket.find({ assignedEngineerId: engineerId, status: TicketStatus.COMPLETED })
      .select('ticketNumber issueTitle companyName completedAt assignedAt priority')
      .sort({ completedAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const completedWithDates = await Ticket.find({
    assignedEngineerId: engineerId,
    status: TicketStatus.COMPLETED,
    completedAt: { $exists: true },
    assignedAt: { $exists: true },
  }).select('assignedAt completedAt').lean();

  let avgCompletionDays = 0;
  if (completedWithDates.length > 0) {
    const total = completedWithDates.reduce((sum, t) => {
      const diff = (t.completedAt!.getTime() - t.assignedAt!.getTime()) / (1000 * 60 * 60 * 24);
      return sum + diff;
    }, 0);
    avgCompletionDays = Math.round(total / completedWithDates.length);
  }

  const summary = stats[0] ?? { assignedTickets: 0, completedTickets: 0, visitCount: 0 };

  sendSuccess(res, { ...summary, avgCompletionDays, recentCompleted });
};

export const getAdminReport = async (_req: Request, res: Response): Promise<void> => {
  const [
    overallStats,
    statusDistribution,
    revenueStats,
    completionTrend,
    engineerUtilization,
  ] = await Promise.all([
    // Overall counts
    Ticket.aggregate([
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          pendingReview: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.UNDER_REVIEW] }, 1, 0] } },
          pendingPayment: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.ADVANCE_PENDING] }, 1, 0] } },
          approvedUnassigned: { $sum: { $cond: [{ $eq: ['$status', TicketStatus.OPEN_FOR_ASSIGNMENT] }, 1, 0] } },
        },
      },
    ]),
    // Status distribution
    Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]),
    // Revenue
    Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$advanceAmount' } } },
    ]),
    // Completion trend: last 12 weeks
    Ticket.aggregate([
      {
        $match: {
          status: TicketStatus.COMPLETED,
          completedAt: { $gte: new Date(Date.now() - 84 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $isoWeek: '$completedAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
      { $project: { period: { $toString: '$_id' }, count: 1, _id: 0 } },
    ]),
    // Engineer utilization
    Ticket.aggregate([
      {
        $match: { status: TicketStatus.COMPLETED, assignedEngineerId: { $ne: null } },
      },
      {
        $group: { _id: '$assignedEngineerId', completed: { $sum: 1 } },
      },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'engineer' },
      },
      { $unwind: '$engineer' },
      {
        $project: {
          engineerName: '$engineer.fullName',
          completed: 1,
          _id: 0,
        },
      },
      { $sort: { completed: -1 } },
    ]),
  ]);

  const overall = overallStats[0] ?? {
    totalTickets: 0, pendingReview: 0, pendingPayment: 0, approvedUnassigned: 0,
  };

  sendSuccess(res, {
    ...overall,
    totalRevenue: revenueStats[0]?.totalRevenue ?? 0,
    statusDistribution,
    completionTrend,
    engineerUtilization,
  });
};
