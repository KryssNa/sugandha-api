// controllers/log.controller.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/apiResponse';
import { LogModel } from '../models/log.model';

export class LogController {
  static getLogs = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const logs = await LogModel.find()
      .sort({ timestamp: -1 }) // Sort by latest logs
      .skip(skip)
      .limit(limit);

    const total = await LogModel.countDocuments();

    ApiResponse.success(res, {
      data: logs,
      message: 'Logs retrieved successfully',
      metadata: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  });
}