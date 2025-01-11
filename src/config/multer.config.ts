// src/config/multerConfig.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Custom error for file upload
class FileUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileUploadError';
  }
}

// Upload configuration types
export interface UploadOptions {
  allowedMimeTypes?: string[];
  maxFileSize?: number;
  generateFileName?: (file: Express.Multer.File) => string;
}

// Default upload configurations
const DEFAULT_CONFIG = {
  images: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  videos: {
    allowedMimeTypes: [
      'video/mp4', 
      'video/mpeg', 
      'video/quicktime', 
      'video/x-msvideo'
    ],
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  documents: {
    allowedMimeTypes: [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  }
};

export class FileUploadManager {
  // Create upload directory
  private static createUploadDirectory(uploadPath: string) {
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
  }

  // Generate unique filename
  private static generateUniqueFileName(file: Express.Multer.File) {
    const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
    return uniqueSuffix;
  }

  // Create storage configuration
  private static createStorage(uploadPath: string, options?: UploadOptions) {
    this.createUploadDirectory(uploadPath);

    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const filename = options?.generateFileName 
          ? options.generateFileName(file)
          : this.generateUniqueFileName(file);
        cb(null, filename);
      }
    });
  }

  // Create file filter
  private static createFileFilter(options?: UploadOptions) {
    return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedTypes = options?.allowedMimeTypes || [];
      const maxFileSize = options?.maxFileSize || Infinity;

      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        return cb(new FileUploadError('Invalid file type'));
      }

      cb(null, true);
    };
  }

  // Create upload instance
  static createUploader(
    uploadType: keyof typeof DEFAULT_CONFIG, 
    uploadPath: string, 
    options?: UploadOptions
  ) {
    const mergedOptions = {
      ...DEFAULT_CONFIG[uploadType],
      ...options
    };

    return multer({
      storage: this.createStorage(uploadPath, mergedOptions),
      fileFilter: this.createFileFilter(mergedOptions),
      limits: {
        fileSize: mergedOptions.maxFileSize
      }
    });
  }
}

// Utility function to generate upload path
export const generateUploadPath = (
  category: string, 
  subCategory?: string
) => {
  const basePath = path.join(process.cwd(), 'uploads');
  return subCategory 
    ? path.join(basePath, category, subCategory)
    : path.join(basePath, category);
};