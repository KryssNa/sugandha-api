// src/utils/AppError.ts
import e from 'express';
import { ZodError } from 'zod';

export type ApiStatus = 'error' | 'fail' | 'success';

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
  path?: (string | number)[];
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: ApiStatus;
  public readonly errors?: ApiErrorDetail[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors?: ApiErrorDetail[],
    status: ApiStatus = 'error',
    isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);

    this.statusCode = statusCode;
    this.status = status;
    this.errors = errors;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  static handleError(error: any): AppError {
    // logger.error('Error:', error);
    // Handle undefined user in request (missing authentication)
    if (error.message?.includes('Cannot read properties of undefined')) {
      // Check if the error is related to accessing user property
      if (error.stack?.includes('req.user')) {
        return new AppError(401, 'Authentication required', [
          {
            message: 'You must be logged in to access this resource',
            code: 'AUTHENTICATION_REQUIRED'
          }
        ], 'fail');
      }
    }

    // // Handle Zod validation errors
    // if (error instanceof ZodError) {
    //   const errors = error.errors.map(err => ({
    //     field: err.path.join('.'),
    //     message: err.message,
    //     code: err.code,
    //     path: err.path
    //   }));
    //   return new AppError(400, 'Validation failed', errors, 'fail');
    // }
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const errors = error.errors.map(err => {
        const fieldName = String(err.path.slice(-1)[0]); // Extract the last part of the path (field name) and convert to string
        return {
          field: fieldName,
          message: `${fieldName} is required`, // Customize message format
          code: err.code || 'INVALID_INPUT',
        };
      });

      const formattedMessage = errors
        .map(e => `${e.field}`)
        .join('; ');

      return new AppError(
        400,
        `Validation failed on field(s): ${formattedMessage}`,
        errors,
        'fail'
      );
    }


    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
      }));
      return new AppError(400, 'Validation failed', errors, 'fail');
    }

    // Handle mongoose CastError (invalid ID)
    if (error.name === 'CastError') {
      return new AppError(
        400,
        'Invalid ID format',
        [{ field: error.path, message: 'Please provide a valid ID' }],
        'fail'
      );
    }

    // Handle mongoose duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return new AppError(
        409,
        'Duplicate field value',
        [{ field, message: `This ${field} is already in use` }],
        'fail'
      );
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return new AppError(401, 'Invalid token', [{ message: 'Please log in again' }], 'fail');
    }

    if (error.name === 'TokenExpiredError') {
      return new AppError(401, 'Token expired', [{ message: 'Please log in again' }], 'fail');
    }

    // Handle bcrypt errors
    if (error.message?.includes('Illegal arguments')) {
      return new AppError(
        400,
        'Invalid credentials',
        [{ message: 'Email or password is incorrect' }],
        'fail'
      );
    }

    // If it's already an AppError, return it
    if (error instanceof AppError) {
      return error;
    }

    // Generic error handling
    return new AppError(
      error.statusCode || 500,
      error.message || 'Something went wrong',
      error.errors,
    );
  }

  // Utility methods for common errors
  static BadRequest(message: string, errors?: ApiErrorDetail[]): AppError {
    return new AppError(400, message, errors, 'fail');
  }

  static Unauthorized(message: string = 'Unauthorized', errors?: ApiErrorDetail[]): AppError {
    return new AppError(401, message, errors, 'fail');
  }

  static Forbidden(message: string = 'Forbidden', errors?: ApiErrorDetail[]): AppError {
    return new AppError(403, message, errors, 'fail');
  }

  static NotFound(message: string = 'Not found', errors?: ApiErrorDetail[]): AppError {
    return new AppError(404, message, errors, 'fail');
  }

  static ValidationError(errors: ApiErrorDetail[]): AppError {
    return new AppError(400, 'Validation failed', errors, 'fail');
  }

  static DatabaseError(message: string, errors?: ApiErrorDetail[]): AppError {
    return new AppError(500, message, errors, 'error', false);
  }

  static Conflict(message: string, errors?: ApiErrorDetail[]): AppError {
    return new AppError(409, message, errors, 'fail');
  }
  static InternalServerError(message: string, errors?: ApiErrorDetail[]): AppError {
    return new AppError(500, message, errors, 'error');
  }
}
