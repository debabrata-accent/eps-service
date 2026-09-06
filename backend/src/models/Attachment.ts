import mongoose, { Document, Schema, Model } from 'mongoose';
import { FileType, FileCategory } from '@eps/shared';

export interface IAttachmentDocument extends Document {
  ticketId: mongoose.Types.ObjectId;
  fileType: FileType;
  fileCategory: FileCategory;
  cloudUrl: string;
  publicId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AttachmentSchema = new Schema<IAttachmentDocument>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    fileType: { type: String, enum: Object.values(FileType), required: true },
    fileCategory: { type: String, enum: Object.values(FileCategory), required: true },
    cloudUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AttachmentSchema.index({ ticketId: 1 });

const Attachment: Model<IAttachmentDocument> = mongoose.model<IAttachmentDocument>(
  'Attachment',
  AttachmentSchema
);
export default Attachment;
