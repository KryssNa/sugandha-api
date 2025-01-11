// routes/variant.routes.ts
import { Router } from 'express';
import { VariantController } from '../controllers/variant.controller';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { validateRequest } from '../middlewares/validate';
import {
  bulkStockUpdateSchema,
  createVariantSchema,
  updateVariantSchema
} from '../schemas/variant.schema';
import { UserRole } from '../types/user.types';

const router = Router();

router.use(authenticate, authorize([UserRole.ADMIN, UserRole.MANAGER]));

router.post(
  '/:productId',
  validateRequest(createVariantSchema),
  VariantController.createVariant
);

router.get(
  '/:productId',
  VariantController.getProductVariants
);

router.patch(
  '/:productId/:sku',
  validateRequest(updateVariantSchema),
  VariantController.updateVariant
);

router.delete(
  '/:productId/:sku',
  VariantController.deleteVariant
);

router.patch(
  '/:productId/:sku/stock',
  VariantController.updateStock
);

router.patch(
  '/:productId/bulk-stock-update',
  validateRequest(bulkStockUpdateSchema),
  VariantController.bulkStockUpdate
);

router.patch(
  '/:productId/reorder',
  VariantController.reorderVariants
);

export default router;