import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { Role } from '@eps/shared';

const SALT_ROUNDS = 12;

const safeUser = (user: any) => ({
  _id: user._id,
  username: user.username,
  role: user.role,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  companyName: user.companyName,
  engineerSpecialization: user.engineerSpecialization,
  isActive: user.isActive,
  createdBy: user.createdBy,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const { role, isActive, page = '1', limit = '20' } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, parseInt(limit));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 }).lean(),
    User.countDocuments(filter),
  ]);

  sendPaginated(res, users.map(safeUser), total, pageNum, limitNum);
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const {
    username, password, role, fullName, email, phone,
    companyName, engineerSpecialization,
  } = req.body;

  const exists = await User.findOne({ username: username.toLowerCase().trim() });
  if (exists) {
    sendError(res, 'Username already taken', 409);
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    username: username.toLowerCase().trim(),
    passwordHash,
    role,
    fullName,
    email: email.toLowerCase().trim(),
    phone,
    companyName,
    engineerSpecialization,
    createdBy: req.user!.userId,
  });

  sendSuccess(res, safeUser(user.toObject()), 'User created successfully', 201);
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id).lean();
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }
  sendSuccess(res, safeUser(user));
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { fullName, email, phone, companyName, engineerSpecialization } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { fullName, email, phone, companyName, engineerSpecialization } },
    { new: true, runValidators: true }
  ).lean();

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }
  sendSuccess(res, safeUser(user), 'User updated');
};

export const disableUser = async (req: Request, res: Response): Promise<void> => {
  // CE cannot disable themselves
  if (req.params.id === req.user!.userId) {
    sendError(res, 'You cannot disable your own account', 400);
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { isActive: false } },
    { new: true }
  ).lean();

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }
  sendSuccess(res, safeUser(user), 'User disabled');
};

export const updateFcmToken = async (req: Request, res: Response): Promise<void> => {
  const { fcmToken } = req.body;
  await User.findByIdAndUpdate(req.user!.userId, { $set: { fcmToken } });
  sendSuccess(res, null, 'FCM token updated');
};
