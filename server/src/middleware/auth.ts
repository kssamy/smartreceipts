import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header required.',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.',
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired',
      });
      return;
    }

    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId: string, email: string): string => {
  const jwtSecret = process.env.JWT_SECRET!;
  const jwtExpire = process.env.JWT_EXPIRE || '15m';

  // @ts-ignore - Type mismatch with jsonwebtoken library
  return jwt.sign({ userId, email }, jwtSecret, {
    expiresIn: jwtExpire,
  });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId: string, email: string): string => {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
  const jwtRefreshExpire = process.env.JWT_REFRESH_EXPIRE || '7d';

  // @ts-ignore - Type mismatch with jsonwebtoken library
  return jwt.sign({ userId, email }, jwtRefreshSecret, {
    expiresIn: jwtRefreshExpire,
  });
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
  return jwt.verify(token, jwtRefreshSecret) as JwtPayload;
};
