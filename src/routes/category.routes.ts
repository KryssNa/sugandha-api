// routes/category.routes.ts
import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { validateRequest } from "../middlewares/validate";
import { createCategorySchema, updateCategorySchema } from "../schemas/category.schema";
import { UserRole } from "../types/user.types";

const router = Router();

// Public routes
router.get("/", CategoryController.getCategories);
router.get("/:slug", CategoryController.getCategoryBySlug);

// Protected admin routes
router.use( authenticate, authorize([UserRole.ADMIN]));
router.post(
    "/",
    validateRequest(createCategorySchema),
    CategoryController.createCategory
);
router.patch(
    "/:id",
    validateRequest(updateCategorySchema),
    CategoryController.updateCategory
);
router.delete("/:id", CategoryController.deleteCategory);
router.get("/tree", CategoryController.getCategoryTree);

export default router;