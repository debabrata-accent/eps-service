import { Request, Response } from 'express';
import Notification from '../models/Notification';
import { sendSuccess } from '../utils/response';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  const { page = '1', limit = '30' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId: req.user!.userId })
      .skip(skip)
      .limit(limitNum)
      .sort({ sentAt: -1 })
      .lean(),
    Notification.countDocuments({ userId: req.user!.userId }),
    Notification.countDocuments({ userId: req.user!.userId, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const markRead = async (req: Request, res: Response): Promise<void> => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.userId },
    { $set: { isRead: true } }
  );
  sendSuccess(res, null, 'Marked as read');
};

export const markAllRead = async (req: Request, res: Response): Promise<void> => {
  await Notification.updateMany(
    { userId: req.user!.userId, isRead: false },
    { $set: { isRead: true } }
  );
  sendSuccess(res, null, 'All notifications marked as read');
};
