import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { connectDB } from "./config/database";
import { serverLogger } from './utils/logger';

const express = require("express");
const app = require("./app");

const server = express();
connectDB();
server.use(app);

const PORT = process.env.PORT || 5050 ;

// SSL certificate configuration
const options = {
  key: fs.readFileSync(path.join(__dirname, '../certificates/localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certificates/localhost.pem')),
  requestCert: false,
  rejectUnauthorized: false
};

// Create HTTPS server
const httpsServer = https.createServer(options, server);

server.listen(PORT, () => {
  serverLogger.info(`HTTPS Server running on port ${PORT}`);
});

const gracefulShutdown = async () => {
  httpsServer.close(() => {
    serverLogger.info("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
process.on("uncaughtException", (error) => {
  serverLogger.error("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  serverLogger.error("Unhandled rejection", error);
  process.exit(1);
});
