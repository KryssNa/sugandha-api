import compression from "compression";
import cors from "cors";
import { config } from "dotenv";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { errorHandler } from "./middlewares/error";
import perfumeRoutes from "./routes/ai-recommendation.routes";
import cartRoutes from "./routes/cart.routes";
import categoryRoutes from "./routes/category.routes";
import checkoutRoutes from "./routes/checkout.routes";
import contactRoutes from "./routes/contact.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import productRoutes from "./routes/product.routes";
import uploadsRoutes from "./routes/uploads.routes";
import authRoutes from "./routes/user.routes";
import variantsRoutes from "./routes/variant.routes";
import wishlistRoutes from "./routes/wishlist.routes";

const app = express();

// Load environment variables
config({
  path: ".env",
});

app.use(express.json());

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true, allowedHeaders: 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization',
  methods: 'GET, POST, PATCH, PUT, POST, DELETE, OPTIONS',
  optionsSuccessStatus: 200,

}));
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.get("/", (req: Request, res: Response) => {
  res.send("hello from server");
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
  },
}));

app.get('/test-image', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'uploads/products/images/49bfd2d3-8abb-49f2-9339-746978d7270a.png'));
});


// Routes
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

// Error handling
app.use(errorHandler);

module.exports = app;