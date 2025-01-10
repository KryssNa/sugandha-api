import { NextFunction, Request, Response } from "express";
import { MongoError } from "mongodb";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error({
    message: "Error occurred",
    error: err instanceof AppError ? err.errors : err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Custom App Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      status: "error",
      message: err.message,
      errors: err.errors || null,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // MongoDB Duplicate Key Error
  if (err instanceof MongoError && err.code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    res.status(409).json({
      success: false,
      status: "fail",
      message: `${field} already exists`,
      errors: [
        {
          field,
          message: `${field} already exists in the database`,
        },
      ],
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((error) => {
      // Get the field name, handling nested paths
      const field =
        error.path.length > 1
          ? error.path[error.path.length - 1]
          : error.path[0];

      // Map Zod error codes to messages
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
        case "invalid_string":
          message = `${field} is invalid`;
          break;
        default:
          message = error.message;
      }

      return {
        field: String(field),
        message,
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

  // Generic Errors
  res.status(500).json({
    success: false,
    status: "error",
    message: "Something broke!",
    timestamp: new Date().toISOString(),
  });
};
