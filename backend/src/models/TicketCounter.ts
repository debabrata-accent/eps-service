import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITicketCounterDocument extends Document {
  year: number;
  seq: number;
}

const TicketCounterSchema = new Schema<ITicketCounterDocument>(
  {
    year: { type: Number, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

const TicketCounter: Model<ITicketCounterDocument> = mongoose.model<ITicketCounterDocument>(
  'TicketCounter',
  TicketCounterSchema
);
export default TicketCounter;
