// src/middleware/uploadMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { generateUploadPath, FileUploadManager } from '../config/multer.config';

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        uploadPath?: string;
      }
    }
  }
}

export class UploadMiddleware {
  // Single file upload middleware
  static single(
    uploadType: 'images' | 'videos' | 'documents', 
    fieldName: string,
    category: string,
    options?: { 
      subCategory?: string 
      generateFileName?: (file: Express.Multer.File) => string 
    }
  ) {
    const uploadPath = generateUploadPath(category, options?.subCategory);
    
    const upload = FileUploadManager.createUploader(
      uploadType, 
      uploadPath, 
      options
    ).single(fieldName);

    return (req: Request, res: Response, next: NextFunction) => {
      upload(req, res, (err) => {
        if (err) {
          return res.status(400).json({
            message: 'File upload failed',
            error: err.message
          });
        }

        // Attach upload path to request for later use
        if (req.file) {
          req.file.uploadPath = path.relative(process.cwd(), req.file.path);
        }

        next();
      });
    };
  }

  // Multiple files upload middleware
  static multiple(
    uploadType: 'images' | 'videos' | 'documents', 
    fieldName: string,
    category: string,
    maxCount: number,
    options?: { 
      subCategory?: string 
      generateFileName?: (file: Express.Multer.File) => string 
    }
  ) {
    const uploadPath = generateUploadPath(category, options?.subCategory);
    
    const upload = FileUploadManager.createUploader(
      uploadType, 
      uploadPath, 
      options
    ).array(fieldName, maxCount);

    return (req: Request, res: Response, next: NextFunction) => {
      upload(req, res, (err) => {
        if (err) {
          return res.status(400).json({
            message: 'File upload failed',
            error: err.message
          });
        }

        // Attach upload paths to request
        if (req.files) {
          (req.files as Express.Multer.File[]).forEach(file => {
            file.uploadPath = path.relative(process.cwd(), file.path);
          });
        }

        next();
      });
    };
  }
}