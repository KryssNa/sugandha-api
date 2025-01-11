// src/server.ts
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { csrfProtection } from "./middlewares/csrf";
import { errorHandler } from "./middlewares/error";
import perfumeRoutes from "./routes/ai-recommendation.routes";
import cartRoutes from "./routes/cart.routes";
import categoryRoutes from "./routes/category.routes";
import checkoutRoutes from "./routes/checkout.routes";
import contactRoutes from "./routes/contact.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import productRoutes from "./routes/product.routes";
import sessionsRoutes from "./routes/sessions.routes";
import uploadsRoutes from "./routes/uploads.routes";
import authRoutes from "./routes/user.routes";
import variantsRoutes from "./routes/variant.routes";
import wishlistRoutes from "./routes/wishlist.routes";

// Initialize express app
const app = express();

// Load environment variables
config({
  path: ".env",
});

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(cors({
  origin: ["https://localhost:3000", "https://localhost:3000"],
  credentials: true,
  allowedHeaders: 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization, X-CSRF-Token',
  methods: 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  optionsSuccessStatus: 200,
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  }
}));

app.use(compression());
app.use(morgan("dev"));

// Static files configuration
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
  },
}));

// CSRF Protection Configuration
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
  '/api/v1/session'
];

// CSRF middleware for protected routes
app.use((req, res, next) => {
  if (protectedRoutes.some(route => req.path.startsWith(route)) &&
    !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return csrfProtection(req, res, next);
  }
  next();
});

// CSRF token endpoint
app.get('/api/v1/auth/csrf-token', csrfProtection, (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken() });
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

// Error handling
app.use(errorHandler);

module.exports = app;