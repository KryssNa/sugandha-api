import { Router } from "express";
import { UserController } from "../controllers/user.controller";

import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { validateRequest } from "../middlewares/validate";
import { createUserSchema, loginSchema, updateUserSchema } from "../schemas/user.schema";
import { UserRole } from "../types/user.types";

const router = Router();

// Public routes
router.post("/register", validateRequest(createUserSchema), UserController.register);
router.post("/login", validateRequest(loginSchema), UserController.login);

router.get("/getMe", authenticate, UserController.getMe);

router.post("/logout", authenticate, UserController.logout);

router.post("/verify-access-token", UserController.verifyAccessToken);

// Protected routes
router.use(authenticate);

// User routes
router.get("/profile", UserController.getUserProfile);
router.patch(
    "/profile",
    validateRequest(updateUserSchema),
    UserController.updateUserProfile
);

// Admin routes
router.get("/users", authorize([UserRole.ADMIN]), UserController.getUsers);

router.patch("/users/:id", authorize([UserRole.ADMIN]), UserController.updateUserProfile);

router.get('/admin/users', authenticate, UserController.getUsers);

export default router;
