import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError';
import { ZodError } from 'zod';

interface ErrorWithCode extends Error {
  code?: number;
  keyValue?: Record<string, any>;
  errors?: Record<string, any>;
  path?: string;
  value?: any;
}

// Handle invalid MongoDB IDs (CastError)
const handleCastErrorDB = (err: ErrorWithCode): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle duplicate field errors
const handleDuplicateFieldsDB = (err: ErrorWithCode): AppError => {
  const keyValue = err.keyValue || {};
  const value = Object.keys(keyValue)
    .map((key) => `${key}: ${keyValue[key]}`)
    .join(', ');
  const message = `Duplicate field value: {${value}}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle Mongoose validation errors
const handleValidationErrorDB = (err: ErrorWithCode): AppError => {
  const errors = err.errors
    ? Object.values(err.errors).map((el: any) => el.message)
    : [];
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle Zod validation errors
const handleZodError = (err: ZodError): AppError => {
  const message = err.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  return new AppError(`Validation failed: ${message}`, 400);
};

// Development error response
const sendDevError = (err: any, res: Response) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  res.status(statusCode).json({
    status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Production error response
const sendProdError = (err: AppError, res: Response) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  if (err.isOperational) {
    res.status(statusCode).json({
      status,
      message: err.message,
    });
  } else {
    console.error('ERROR 💣:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

// Global Error Handler
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, res);
  } else {
    // Production
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err instanceof ZodError || err.name === 'ZodError') error = handleZodError(err);

    sendProdError(error, res);
  }
};
