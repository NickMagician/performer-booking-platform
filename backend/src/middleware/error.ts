import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { config } from '../config';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Custom error class for API errors
 */
export class AppError extends Error implements ApiError {
  public statusCode: number;
  public code?: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle Zod validation errors
 */
const handleZodError = (error: ZodError): AppError => {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return new AppError(
    `Validation error: ${errors.map(e => `${e.field}: ${e.message}`).join(', ')}`,
    400,
    'VALIDATION_ERROR'
  );
};

/**
 * Handle Prisma errors
 */
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = error.meta?.target as string[] | undefined;
      const fieldName = field?.[0] || 'field';
      return new AppError(
        `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} already exists`,
        409,
        'DUPLICATE_ENTRY'
      );

    case 'P2025':
      // Record not found
      return new AppError('Record not found', 404, 'NOT_FOUND');

    case 'P2003':
      // Foreign key constraint violation
      return new AppError('Referenced record does not exist', 400, 'INVALID_REFERENCE');

    case 'P2014':
      // Invalid ID
      return new AppError('Invalid ID provided', 400, 'INVALID_ID');

    default:
      return new AppError('Database error occurred', 500, 'DATABASE_ERROR');
  }
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error | ApiError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Handle different types of errors
  if (error instanceof ZodError) {
    appError = handleZodError(error);
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error instanceof AppError) {
    appError = error;
  } else {
    // Generic error
    appError = new AppError(
      config.isDevelopment ? error.message : 'Internal server error',
      500,
      'INTERNAL_ERROR'
    );
  }

  // Log error in development
  if (config.isDevelopment) {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  }

  // Send error response
  res.status(appError.statusCode).json({
    success: false,
    error: appError.message,
    code: appError.code,
    ...(config.isDevelopment && { stack: error.stack }),
  });
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
