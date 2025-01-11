// src/routes/uploadRoutes.ts
import express from 'express';
import path from 'path';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { UploadMiddleware } from '../middlewares/upload';
import { UserRole } from '../types/user.types';

const router = express.Router();

// Profile Picture Upload
router.post(
    '/profile-picture',
    authenticate,
    UploadMiddleware.single(
        'images',
        'profilePicture',
        'profiles',
        {
            subCategory: 'avatars',
            generateFileName: (file) => `profile-${Date.now()}${path.extname(file.originalname)}`
        }
    ),
    UploadController.uploadSingleFile
);

// Product Image Upload
router.post(
    '/products/images',
    authenticate,
    authorize([UserRole.ADMIN, UserRole.MANAGER]),
    UploadMiddleware.multiple(
        'images',
        'images',
        'products',
        5,
        {
            subCategory: 'images'
        }
    ),
    UploadController.uploadMultipleFiles
);
// Product Image Upload
router.post(
    '/products/:productId/images',
    authenticate,
    authorize([UserRole.ADMIN, UserRole.MANAGER]),
    UploadMiddleware.multiple(
        'images',
        'images',
        'products',
        5,
        {
            subCategory: 'images'
        }
    ),
    UploadController.uploadMultipleFiles
);

// Video Upload (e.g., product demos)
router.post(
    '/products/:productId/videos',
    authenticate,
    authorize([UserRole.ADMIN, UserRole.MANAGER]),
    UploadMiddleware.single(
        'videos',
        'video',
        'products',
        {
            subCategory: 'demos'
        }
    ),
    UploadController.uploadSingleFile
);

// Generic file deletion
router.delete(
    '/files',
    authenticate,
    UploadController.deleteFile
);

export default router;