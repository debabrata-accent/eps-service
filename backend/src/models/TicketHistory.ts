import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITicketHistoryDocument extends Document {
  ticketId: mongoose.Types.ObjectId;
  oldStatus: string;
  newStatus: string;
  changedBy: mongoose.Types.ObjectId;
  note?: string;
  timestamp: Date;
}

const TicketHistorySchema = new Schema<ITicketHistoryDocument>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    oldStatus: { type: String, default: '' }, // empty for the initial creation record
    newStatus: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

TicketHistorySchema.index({ ticketId: 1, timestamp: -1 });

const TicketHistory: Model<ITicketHistoryDocument> = mongoose.model<ITicketHistoryDocument>(
  'TicketHistory',
  TicketHistorySchema
);
export default TicketHistory;
