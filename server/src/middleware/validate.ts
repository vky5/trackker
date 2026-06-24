import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import AppError from '../utils/appError';

type Source = 'body' | 'params' | 'query';

export const validate = (schema: ZodSchema, source: Source = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
      schema.parse(dataToValidate);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        return next(new AppError(`Validation failed: ${message}`, 400));
      }
      next(error);
    }
  };
};
