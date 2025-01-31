// routes/log.routes.ts
import express from 'express';
import { LogController } from '../controllers/log.controller';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { UserRole } from '../types/user.types';

const router = express.Router();

// Fetch logs (admin only)
router.get('/', authenticate, authorize([UserRole.ADMIN]), LogController.getLogs);

export default router;