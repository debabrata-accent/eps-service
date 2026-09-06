import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPaymentDocument extends Document {
  ticketId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  totalAmount: number;
  advanceAmount: number;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: 'created' | 'paid' | 'failed';
  paidAt?: Date;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    advanceAmount: { type: Number, required: true, min: 0 },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
    },
    paidAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PaymentSchema.index({ ticketId: 1 });
PaymentSchema.index({ ownerId: 1 });
// razorpayOrderId already indexed via `unique: true` on the field

const Payment: Model<IPaymentDocument> = mongoose.model<IPaymentDocument>(
  'Payment',
  PaymentSchema
);
export default Payment;
