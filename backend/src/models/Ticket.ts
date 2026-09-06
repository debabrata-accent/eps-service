import mongoose, { Document, Schema, Model } from 'mongoose';
import { TicketStatus, EngineerStatus, Priority, PaymentStatus } from '@eps/shared';

export interface ITicketDocument extends Document {
  ticketNumber: string;
  ownerId: mongoose.Types.ObjectId;

  factoryOwnerName: string;
  companyName: string;
  siteAddress: string;
  contactPerson: string;
  phone: string;
  alternatePhone?: string;

  panelType: string;
  panelInstallationDate?: Date;

  issueTitle: string;
  issueDescription: string;
  priority: Priority;
  preferredVisitDate?: Date;
  safetyInstructions?: string;

  status: TicketStatus;
  engineerStatus?: EngineerStatus;

  assignedEngineerId?: mongoose.Types.ObjectId;
  assignedAt?: Date;

  quotedAmount?: number;
  advanceAmount?: number;
  paymentStatus: PaymentStatus;
  paymentId?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const TicketSchema = new Schema<ITicketDocument>(
  {
    ticketNumber: { type: String, required: true, unique: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    factoryOwnerName: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    siteAddress: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true },

    panelType: { type: String, required: true, trim: true },
    panelInstallationDate: { type: Date },

    issueTitle: { type: String, required: true, trim: true },
    issueDescription: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: Object.values(Priority),
      default: Priority.MEDIUM,
    },
    preferredVisitDate: { type: Date },
    safetyInstructions: { type: String, trim: true },

    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.DRAFT,
    },
    engineerStatus: {
      type: String,
      enum: Object.values(EngineerStatus),
    },

    assignedEngineerId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date },

    quotedAmount: { type: Number, min: 0 },
    advanceAmount: { type: Number, min: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.NOT_REQUIRED,
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },

    completedAt: { type: Date },
  },
  { timestamps: true }
);

TicketSchema.index({ ownerId: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ assignedEngineerId: 1 });
TicketSchema.index({ createdAt: -1 });
// ticketNumber already indexed via `unique: true` on the field

const Ticket: Model<ITicketDocument> = mongoose.model<ITicketDocument>('Ticket', TicketSchema);
export default Ticket;
