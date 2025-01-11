// routes/session.routes.ts
import { Router } from 'express';
import { SessionController } from '../controllers/sessions.controller';
import { authenticate } from '../middlewares/auth';
import { rateLimiter } from '../middlewares/rate_limiter';

const router = Router();

router.use(authenticate);

// Get all active sessions
router.get(
    '/',
    rateLimiter(100, 15 * 60 * 1000), // 100 requests per 15 minutes
    SessionController.getActiveSessions
);

// Terminate specific session
router.delete(
    '/:deviceId',
    rateLimiter(20, 15 * 60 * 1000), // 20 requests per 15 minutes
    SessionController.terminateSession
);

// Terminate all sessions except current
router.delete(
    '/',
    rateLimiter(10, 15 * 60 * 1000), // 10 requests per 15 minutes
    SessionController.terminateAllSessions
);

// Update session activity (for keeping session alive)
router.patch(
    '/:deviceId/activity',
    rateLimiter(300, 15 * 60 * 1000), // 300 requests per 15 minutes
    SessionController.updateSessionActivity
);

export default router;