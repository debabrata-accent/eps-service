import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, IJwtPayload } from '@eps/shared';
import { sendError } from '../utils/response';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IJwtPayload;
    }
  }
}

export const generateAccessToken = (userId: string, role: Role): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not set');
  return jwt.sign({ userId, role }, secret, { expiresIn: '15m' });
};

export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not set');
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

export const verifyAccessToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Access token required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    sendError(res, 'Server configuration error', 500);
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as IJwtPayload;
    req.user = payload;
    next();
  } catch {
    sendError(res, 'Invalid or expired access token', 401);
  }
};

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'Forbidden: insufficient permissions', 403);
      return;
    }
    next();
  };
};
