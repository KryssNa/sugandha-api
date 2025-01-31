import { Router } from 'express';
import { activityLogger } from '../middlewares/activityLogger'; // Import the middleware
import { UserController } from '../controllers/user.controller';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, secureAuthentication } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { rateLimiter } from '../middlewares/rate_limiter';
import { validateRequest } from '../middlewares/validate';
import { changePasswordSchema, createUserSchema, loginSchema, resetPasswordSchema, updateUserSchema } from '../schemas/user.schema';
import { UserRole } from '../types/user.types';

const router = Router();

// Public routes
router.post("/register", validateRequest(createUserSchema), UserController.register);
router.post("/login", validateRequest(loginSchema), rateLimiter(15, 15 * 60 * 1000), UserController.login);

// Apply activity logger to specific routes
router.post("/verify-access-token", activityLogger, UserController.verifyAccessToken);
router.post("/refresh-token", activityLogger, UserController.refreshToken);

// Email Verification Routes
router.post("/forgot-password", activityLogger, AuthController.forgotPassword);
router.post("/verify-reset-token", activityLogger, AuthController.verifyResetToken);
router.post("/reset-password", validateRequest(resetPasswordSchema), activityLogger, AuthController.resetPassword);
router.post("/login-2fa", activityLogger, AuthController.loginWithTwoFactor);

// Protected routes
router.use(authenticate);

router.post("/verify-email", activityLogger, AuthController.verifyEmail);
router.post("/email/verify/send", authenticate, activityLogger, AuthController.initiateEmailVerification);
router.get("/getMe", authenticate, activityLogger, UserController.getMe);
router.get("/active-devices", authenticate, activityLogger, UserController.getActiveDevices);
router.post("/logout", authenticate, activityLogger, UserController.logout);

// User routes
router.get("/profile", activityLogger, UserController.getUserProfile);
router.patch("/profile", validateRequest(updateUserSchema), activityLogger, UserController.updateUserProfile);
router.post("/password/update", validateRequest(changePasswordSchema), activityLogger, UserController.changePassword);

// Two-Factor Authentication Routes
router.get("/2fa", activityLogger, AuthController.getTwoFactorDetails);
router.post("/2fa/setup", activityLogger, AuthController.setupTwoFactor);
router.post("/2fa/enable", activityLogger, AuthController.enableTwoFactor);
router.post("/2fa/disable", activityLogger, AuthController.disableTwoFactor);

// Admin routes
router.get("/", authorize([UserRole.ADMIN]), activityLogger, UserController.getUsers);
router.patch("/users/:id", authorize([UserRole.ADMIN]), activityLogger, UserController.updateUserProfile);
router.get('/admin/users',authorize([UserRole.ADMIN]) , activityLogger, UserController.getUsers);

export default router;