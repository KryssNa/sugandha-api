import { Response } from 'express';
import { ApiResponseProps, ApiStatus, ApiErrorDetail, ApiResponseMetadata } from '../types/api.types';

export class ApiResponse {
  private static send<T>(
    res: Response,
    {
      success,
      status,
      statusCode,
      message,
      data,
      errors,
      metadata
    }: {
      success: boolean;
      status: ApiStatus;
      statusCode: number;
      message: string;
      data?: T;
      errors?: ApiErrorDetail[];
      metadata?: ApiResponseMetadata;
    }
  ): void {
    const response: ApiResponseProps<T> = {
      success,
      status,
      message,
      ...(data !== undefined && { data }),
      ...(errors && { errors }),
      ...(metadata && { metadata })
    };

    res.status(statusCode).json(response);
  }

  static success<T>(
    res: Response,
    {
      data,
      message = 'Success',
      statusCode = 200,
      metadata
    }: {
      data?: T | T[];
      message?: string;
      statusCode?: number;
      metadata?: ApiResponseMetadata;
    }
  ): void {
    this.send(res, {
      success: true,
      status: 'success',
      statusCode,
      message,
      data,
      metadata
    });
  }

  static error(
    res: Response,
    {
      message = 'Internal Server Error',
      statusCode = 500,
      errors
    }: {
      message?: string;
      statusCode?: number;
      errors?: ApiErrorDetail[];
    }
  ): void {
    this.send(res, {
      success: false,
      status: 'error',
      statusCode,
      message,
      errors
    });
  }

  static fail(
    res: Response,
    {
      message = 'Bad Request',
      statusCode = 400,
      errors
    }: {
      message?: string;
      statusCode?: number;
      errors?: ApiErrorDetail[];
    }
  ): void {
    this.send(res, {
      success: false,
      status: 'fail',
      statusCode,
      message,
      errors
    });
  }
}