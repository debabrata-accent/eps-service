import mongoose from 'mongoose';
import Notification from '../models/Notification';
import User from '../models/User';
import { NotificationType } from '@eps/shared';
import { sendFCMPush } from './fcm.service';

interface CreateNotificationInput {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  ticketId?: string | mongoose.Types.ObjectId;
  sendPush?: boolean;
}

export const createNotification = async (
  input: CreateNotificationInput
): Promise<void> => {
  try {
    await Notification.create({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      ticketId: input.ticketId,
    });

    // Send FCM push if requested
    if (input.sendPush) {
      const user = await User.findById(input.userId).select('fcmToken').lean();
      if (user?.fcmToken) {
        await sendFCMPush(user.fcmToken, input.title, input.message);
      }
    }
  } catch (err) {
    // Notification failures should never crash a ticket operation
    console.error('Failed to create notification:', (err as Error).message);
  }
};

export const notifyAllEngineers = async (
  title: string,
  message: string,
  ticketId: string | mongoose.Types.ObjectId
): Promise<void> => {
  try {
    const engineers = await User.find({ role: 'engineer', isActive: true })
      .select('_id fcmToken')
      .lean();

    const notifications = engineers.map((eng) => ({
      userId: eng._id,
      title,
      message,
      type: NotificationType.ASSIGNMENT,
      ticketId,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { ordered: false });
    }

    // Send FCM push to all engineers who have a token
    for (const eng of engineers) {
      if (eng.fcmToken) {
        await sendFCMPush(eng.fcmToken, title, message).catch(() => {
          // Silent — don't block on individual FCM failures
        });
      }
    }
  } catch (err) {
    console.error('Failed to notify engineers:', (err as Error).message);
  }
};
