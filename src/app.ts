import compression from "compression";
import cors from "cors";
import { config } from "dotenv";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error";
import perfumeRoutes from "./routes/ai-recommendation.routes";
import authRoutes from "./routes/user.routes";
import productRoutes from "./routes/product.routes";

const app = express();

// Load environment variables
config({
  path: ".env",
});

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.get("/", (req: Request, res: Response) => {
  res.send("hello from server");
});

// Routes
app.use("/api/v1/perfume", perfumeRoutes);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);


// Error handling
app.use(errorHandler);


module.exports = app;
