import express, { Request, Response } from "express";
import { config } from "../config/config";
import { csrfProtection } from "../middlewares/csrf";
import perfumeRoutes from "./ai-recommendation.routes";
import cartRoutes from "./cart.routes";
import categoryRoutes from "./category.routes";
import checkoutRoutes from "./checkout.routes";
import contactRoutes from "./contact.routes";
import logRoutes from "./log.routes";
import orderRoutes from "./order.routes";
import paymentRoutes from "./payment.routes";
import productRoutes from "./product.routes";
import sessionsRoutes from "./sessions.routes";
import uploadsRoutes from "./uploads.routes";
import authRoutes from "./user.routes";
import variantsRoutes from "./variant.routes";
import wishlistRoutes from "./wishlist.routes";

const protectedRoutes = [
    '/api/v1/auth',
    '/api/v1/users',
    '/api/v1/products',
    '/api/v1/categories',
    '/api/v1/variants',
    '/api/v1/uploads',
    '/api/v1/contact',
    '/api/v1/wishlist',
    '/api/v1/cart',
    '/api/v1/checkout',
    '/api/v1/orders',
    '/api/v1/payment',
    '/api/v1/session',
    "/api/v1/logs"
];

export const configureRoutes = (app: express.Application) => {
    // CSRF token endpoint
    app.get('/api/v1/auth/csrf-token', csrfProtection, (req: Request, res: Response) => {
        // Set explicit CORS headers for the token endpoint
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', config.CORS_ALLOWED_ORIGINS[1]);

        const token = req.csrfToken();
        res.json({ csrfToken: token });
    });

    // CSRF Protection for protected routes
    app.use((req, res, next) => {
        if (protectedRoutes.some(route => req.path.startsWith(route)) &&
            !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
            return csrfProtection(req, res, next);
        }
        next();
    });

    // Health check endpoint
    app.get("/api/v1/health", (req: Request, res: Response) => {
        res.status(200).json({ status: "healthy" });
    });

    // API Routes
    app.use("/api/v1/perfume", perfumeRoutes);
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/users", authRoutes);
    app.use("/api/v1/products", productRoutes);
    app.use("/api/v1/categories", categoryRoutes);
    app.use("/api/v1/variants", variantsRoutes);
    app.use("/api/v1/uploads", uploadsRoutes);
    app.use("/api/v1/contact", contactRoutes);
    app.use("/api/v1/wishlist", wishlistRoutes);
    app.use("/api/v1/cart", cartRoutes);
    app.use("/api/v1/checkout", checkoutRoutes);
    app.use("/api/v1/orders", orderRoutes);
    app.use("/api/v1/payment", paymentRoutes);
    app.use('/api/v1/session', sessionsRoutes);
    app.use("/api/v1/logs", logRoutes);
};