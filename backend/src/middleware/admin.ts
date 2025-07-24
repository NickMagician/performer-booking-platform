import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

// Admin middleware to check if user is admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated (should be handled by auth middleware first)
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Check if user is admin
    if (req.user.user_type !== 'ADMIN') {
      throw new AppError('Admin access required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
