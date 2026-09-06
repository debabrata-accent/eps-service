import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { Role } from '@eps/shared';

const REFRESH_COOKIE = 'refreshToken';
const isProd = process.env.NODE_ENV === 'production';

// In production the frontend (Hostinger) and backend (Railway/Render) are on
// different domains, so the refresh cookie must be SameSite=None + Secure to be
// sent cross-site. Locally, Lax works fine over http.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as { username: string; password: string };

  const user = await User.findOne({ username: username.toLowerCase().trim() });
  if (!user) {
    sendError(res, 'Invalid username or password', 401);
    return;
  }

  if (!user.isActive) {
    sendError(res, 'Your account has been disabled. Contact admin.', 403);
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    sendError(res, 'Invalid username or password', 401);
    return;
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role as Role);
  const refreshToken = generateRefreshToken(user._id.toString());

  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);

  sendSuccess(res, {
    accessToken,
    user: {
      _id: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      companyName: user.companyName,
      engineerSpecialization: user.engineerSpecialization,
      isActive: user.isActive,
    },
  });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    sendError(res, 'Refresh token required', 401);
    return;
  }

  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    sendError(res, 'Server configuration error', 500);
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as { userId: string };
    const user = await User.findById(payload.userId).select('_id role isActive');
    if (!user || !user.isActive) {
      sendError(res, 'User not found or disabled', 401);
      return;
    }

    const newAccessToken = generateAccessToken(user._id.toString(), user.role as Role);
    sendSuccess(res, { accessToken: newAccessToken });
  } catch {
    sendError(res, 'Invalid or expired refresh token', 401);
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: COOKIE_OPTIONS.sameSite,
  });
  sendSuccess(res, null, 'Logged out successfully');
};
