import mongoose, { Document, Schema, Model } from 'mongoose';
import { NotificationType } from '@eps/shared';

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  ticketId?: mongoose.Types.ObjectId;
  isRead: boolean;
  sentAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    isRead: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

NotificationSchema.index({ userId: 1, isRead: 1, sentAt: -1 });

const Notification: Model<INotificationDocument> = mongoose.model<INotificationDocument>(
  'Notification',
  NotificationSchema
);
export default Notification;
