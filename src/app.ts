
import { config } from "dotenv";
import express from "express";
import { configureMiddleware } from "./config/middleware";
import { configureSecurity } from "./config/security";
import { errorHandler } from "./middlewares/error";
import { configureRoutes } from "./routes/index";

// Initialize express app
const app = express();

// Load environment variables
config({ path: ".env" });

// Configure basic middleware
configureMiddleware(app);

// Configure security settings
configureSecurity(app);

// Configure routes
configureRoutes(app);

// Error handling
app.use(errorHandler);

module.exports = app;
