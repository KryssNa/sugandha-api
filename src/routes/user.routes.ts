import { Router } from "express";
import { UserController } from "../controllers/user.controller";

import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { validateRequest } from "../middlewares/validate";
import { changePasswordSchema, createUserSchema, loginSchema, resetPasswordSchema, updateUserSchema } from "../schemas/user.schema";
import { UserRole } from "../types/user.types";

const router = Router();

// Public routes
router.post("/register", validateRequest(createUserSchema), UserController.register);
router.post("/login", validateRequest(loginSchema), UserController.login);

router.post("/verify-access-token", UserController.verifyAccessToken);

// Email Verification Routes
router.post("/verify-email", AuthController.verifyEmail);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/verify-reset-token", AuthController.verifyResetToken);
router.post("/reset-password", validateRequest(resetPasswordSchema), AuthController.resetPassword);

// Protected routes
router.use(authenticate);

router.post("/send-verification-email", authenticate, AuthController.initiateEmailVerification);
router.get("/getMe", authenticate, UserController.getMe);
router.get("/active-devices", authenticate, UserController.getActiveDevices);
router.post("/logout", authenticate, UserController.logout);
// router.post("/logout-all", authenticate, UserController.logoutAll);

// User routes
router.get("/profile", UserController.getUserProfile);
router.patch(
    "/profile",
    validateRequest(updateUserSchema),
    UserController.updateUserProfile
);
router.patch("/change-password", validateRequest(changePasswordSchema), UserController.changePassword);

// Two-Factor Authentication Routes
router.post("/2fa/setup", AuthController.setupTwoFactor);
router.post("/2fa/enable", AuthController.enableTwoFactor);
router.post("/2fa/disable", AuthController.disableTwoFactor);
router.post("/login-2fa", AuthController.loginWithTwoFactor);

// Admin routes
router.get("/", authorize([UserRole.ADMIN]), UserController.getUsers);

router.patch("/users/:id", authorize([UserRole.ADMIN]), UserController.updateUserProfile);

router.get('/admin/users', authenticate, UserController.getUsers);

export default router;
