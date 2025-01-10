import { connectDB } from "./config/database";
import { logger } from "./utils/logger";

const express = require("express");
const app = require("./app");

const server = express();
connectDB();
server.use(app);

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log("server running in dev mode on port 5000");
});

const gracefulShutdown = async () => {
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  logger.error("Unhandled rejection", error);
  process.exit(1);
});
