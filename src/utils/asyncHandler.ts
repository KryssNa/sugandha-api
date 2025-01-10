import { NextFunction, Request, Response } from 'express';
import { AppError } from './AppError';

type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const asyncHandler =
  (fn: AsyncFunction) =>
    (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch((error) => {
        next(AppError.handleError(error));
      });
    };