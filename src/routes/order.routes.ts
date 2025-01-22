// routes/contact.routes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

import { OrderController } from '../controllers/order.controller';
import { UserRole } from '../types/user.types';


const router = Router();

router.route('/allOrders').get(authenticate, authorize([UserRole.ADMIN]), OrderController.getAllOrders);
router.route('/').get(authenticate, OrderController.getUserOrders);
router.route('/:orderId').get(authenticate, OrderController.getOrderDetails);
router.route('/:orderId/status').patch(authenticate, authorize([UserRole.ADMIN]), OrderController.updateOrderStatus);

export default router;