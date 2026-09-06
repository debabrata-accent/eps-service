import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IServiceReportDocument extends Document {
  ticketId: mongoose.Types.ObjectId;
  engineerId: mongoose.Types.ObjectId;
  visitNotes: string;
  rootCause: string;
  solutionProvided: string;
  sparePartsUsed?: string;
  completionNote: string;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceReportSchema = new Schema<IServiceReportDocument>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, unique: true },
    engineerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    visitNotes: { type: String, required: true, trim: true },
    rootCause: { type: String, required: true, trim: true },
    solutionProvided: { type: String, required: true, trim: true },
    sparePartsUsed: { type: String, trim: true },
    completionNote: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

ServiceReportSchema.index({ engineerId: 1 });

const ServiceReport: Model<IServiceReportDocument> = mongoose.model<IServiceReportDocument>(
  'ServiceReport',
  ServiceReportSchema
);
export default ServiceReport;
