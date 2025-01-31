// for handling errors in the application
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { IPBlockService } from "./rate_limiter";
import { errorLogger } from "../utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {

  // Log the error with additional context
  errorLogger.error({
    message: "Error occurred",
    errorName: err.constructor.name,
    errorMessage: err.message,
    errorStack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
  const ip = req.ip ?? '';

  // Log security events
  if (err instanceof AppError && err.statusCode === 401) {
    IPBlockService.recordAttempt(ip, req.path);
  }


  // Check if it's a Mongoose error
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    const mongoError = err as any;

    // Duplicate key error
    if (mongoError.code === 11000) {
      const field = Object.keys(mongoError.keyPattern || {})[0] || 'unknown';
      const value = mongoError.keyValue ? mongoError.keyValue[field] : 'value';

      res.status(409).json({
        success: false,
        status: "fail",
        message: `Duplicate key error`,
        errors: [
          {
            field,
            message: `${field} with value "${value}" already exists`,
            code: 'DUPLICATE_KEY'
          }
        ],
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }
  if ((err as any).code === "EBADCSRFTOKEN") {

    res.status(403).json({
      success: false,
      status: "fail",
      message: "Invalid CSRF token",
      errors: [
        {
          message: "CSRF token validation failed",
          code: 'INVALID_CSRF_TOKEN'
        }
      ],
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Existing error handlers remain the same
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      errors: err.errors || null,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Zod Validation Errors (existing handler)
  if (err instanceof ZodError) {
    const errors = err.errors.map((error) => {
      const field =
        error.path.length > 1
          ? error.path[error.path.length - 1]
          : error.path[0];

      let message = "";
      switch (error.code) {
        case "invalid_type":
          message =
            error.received === "undefined"
              ? `${field} is required`
              : `${field} must be a ${error.expected}`;
          break;
        case "too_small":
          message = `${field} must be at least ${error.minimum} characters`;
          break;
        case "too_big":
          message = `${field} must be at most ${error.maximum} characters`;
          break;
        case "invalid_string":
          message = `${field} is invalid`;
          break;
        default:
          message = error.message;
      }

      return {
        field: String(field),
        message,
        code: error.code
      };
    });

    res.status(400).json({
      success: false,
      status: "fail",
      message: "Validation failed",
      errors,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Add more specific error type checks
  if (err.name === 'CastError' || err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      status: "fail",
      message: "Invalid data format",
      errors: [
        {
          message: err.message,
          code: 'INVALID_DATA_FORMAT'
        }
      ],
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Catch-all for unhandled errors
  res.status(500).json({
    success: false,
    status: "error",
    message: "Internal server error",
    errors: [
      {
        message: err.message || 'Unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR'
      }
    ],
    timestamp: new Date().toISOString(),
  });
};