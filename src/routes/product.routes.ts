// src/routes/product.routes.ts
import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validate';
import {
    addReviewSchema,
    createProductSchema,
    productQuerySchema,
} from '../schemas/product.schema';
import { UserRole } from '../types/user.types';

const router = Router();

// Public routes
router.get('/', validateRequest(productQuerySchema), ProductController.getProducts);
router.get('/featured', ProductController.getFeaturedProducts);
router.get('/new-arrivals', ProductController.getNewArrivals);
router.get('/best-sellers', ProductController.getBestSellers);
router.get('/:id', ProductController.getProductById);
router.get('/slug/:slug', ProductController.getProductBySlug);
router.get('/:id/related', ProductController.getRelatedProducts);

// Protected routes - require authentication
router.use(authenticate);

// Reviews
router.post(
    '/:id/reviews',
    validateRequest(addReviewSchema),
    ProductController.addReview
);

router.use(authorize(UserRole.ADMIN))
// Admin/Manager only routes
router.post(
    '/',
    validateRequest(createProductSchema),
    ProductController.createProduct
);

router.patch(
    '/:id',
    // validateRequest(updateProductSchema),
    ProductController.updateProduct
);

router.delete('/:id', ProductController.deleteProduct);

// Inventory management
router.patch('/:id/stock', ProductController.updateStock);
router.patch('/:id/variant-stock', ProductController.updateVariantStock);

export default router;