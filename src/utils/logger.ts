import { createLogger, format, transports } from 'winston';
import 'winston-mongodb'; // Import winston-mongodb
import { config } from '../config/config';

// Server Logger
export const serverLogger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: "logs/server.log" }),
    new transports.Console()
  ],
});

// Application Logger (stored in MongoDB)
export const appLogger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.MongoDB({
      level: 'info', // Log level
      db: config.MONGO_URI, // MongoDB connection string
      collection: 'logs', // Collection name
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    })
  ],
});

// Error Logger
export const errorLogger = createLogger({
  level: 'error',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: "logs/error.log" }),
    new transports.Console()
  ],
});

if (process.env.NODE_ENV !== "production") {
  serverLogger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    })
  );

  appLogger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    })
  );

  errorLogger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    })
  );
}
