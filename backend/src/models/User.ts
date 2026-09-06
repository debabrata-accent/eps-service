import mongoose, { Document, Schema, Model } from 'mongoose';
import { Role } from '@eps/shared';

export interface IUserDocument extends Document {
  username: string;
  passwordHash: string;
  role: Role;
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  engineerSpecialization?: string;
  isActive: boolean;
  fcmToken?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), required: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    engineerSpecialization: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    fcmToken: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

const User: Model<IUserDocument> = mongoose.model<IUserDocument>('User', UserSchema);
export default User;
