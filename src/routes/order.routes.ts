// routes/contact.routes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

import { OrderController } from '../controllers/order.controller';
import { UserRole } from '../types/user.types';
import { activityLogger } from '../middlewares/activityLogger';


const router = Router();

router.route('/allOrders').get(authenticate, authorize([UserRole.ADMIN]),activityLogger, OrderController.getAllOrders);
router.route('/').get(authenticate,activityLogger, OrderController.getUserOrders);
router.route('/:orderId').get(authenticate,activityLogger, OrderController.getOrderDetails);
router.route('/:orderId/status').patch(authenticate,activityLogger, authorize([UserRole.ADMIN]), OrderController.updateOrderStatus);

export default router;