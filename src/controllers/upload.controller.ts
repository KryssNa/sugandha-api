// src/controllers/uploadController.ts
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

export class UploadController {
    // Get full URL for uploaded file
    private static getFileUrl(filePath: string) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
    }

    // Single file upload
    static uploadSingleFile = asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            throw AppError.BadRequest('No file uploaded');
        }

        const fileUrl = req.file.uploadPath ? this.getFileUrl(req.file.uploadPath) : '';

        return ApiResponse.success(res, {
            message: 'File uploaded successfully',
            data: {
                fileUrl,
                originalName: req.file.originalname,
                fileName: req.file.filename,
                fileType: req.file.mimetype,
                fileSize: req.file.size
            }
        });
    }
    )

    // Multiple files upload
    static uploadMultipleFiles = asyncHandler(async (req: Request, res: Response) => {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return AppError.BadRequest('No files uploaded');
        }

        try {


            const uploadedFiles = files.map(file => ({
                fileUrl: file.uploadPath ? this.getFileUrl(file.uploadPath) : '',
                originalName: file.originalname,
                fileName: file.filename,
                fileType: file.mimetype,
                fileSize: file.size
            }));

            return ApiResponse.success(res, {
                message: 'Files uploaded successfully',
                data: uploadedFiles
            });
        } catch (error) {
            return AppError.InternalServerError(`${error}`);
        }
    })

    // Delete file
    static deleteFile = asyncHandler(async (req: Request, res: Response) => {
        const { filePath } = req.body;

        if (!filePath) {
            return AppError.BadRequest('No file path provided');
        }

        const fullPath = path.join(process.cwd(), filePath);

        // Validate file path is within uploads directory
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fullPath.startsWith(uploadsDir)) {
            return AppError.BadRequest('Invalid file path');
        }

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            return AppError.NotFound('File not found');
        }
        try {
            // Delete file
            fs.unlinkSync(fullPath);

            return ApiResponse.success(res, { message: 'File deleted successfully' });
        } catch (error) {
            return AppError.InternalServerError(String(error));
        }
    }
    )
}
