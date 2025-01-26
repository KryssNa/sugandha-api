// import { connectDB } from "./config/database";
// import { logger } from "./utils/logger";

// const express = require("express");
// const app = require("./app");

// const server = express();
// connectDB();
// server.use(app);

// const PORT = process.env.PORT;

// server.listen(PORT, () => {
//   console.log("server running in dev mode on port 5000");
// });

// const gracefulShutdown = async () => {
//   server.close(() => {
//     logger.info("Server closed");
//     process.exit(0);
//   });
// };

// process.on("SIGTERM", gracefulShutdown);
// process.on("SIGINT", gracefulShutdown);
// process.on("uncaughtException", (error) => {
//   logger.error("Uncaught exception", error);
//   process.exit(1);
// });

// process.on("unhandledRejection", (error) => {
//   logger.error("Unhandled rejection", error);
//   process.exit(1);
// });

import { connectDB } from "./config/database";
import { logger } from "./utils/logger";
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

const express = require("express");
const app = require("./app");

const server = express();
connectDB();
server.use(app);

const PORT = process.env.PORT || 443;

// SSL certificate configuration
const options = {
  key: fs.readFileSync(path.join(__dirname, '../server.key')),
  cert: fs.readFileSync(path.join(__dirname, '../server.crt')),
  requestCert: false,
  rejectUnauthorized: false
};

// Create HTTPS server
const httpsServer = https.createServer(options, server);

httpsServer.listen(PORT, () => {
  logger.info(`HTTPS Server running on port ${PORT}`);
});

const gracefulShutdown = async () => {
  httpsServer.close(() => {
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
