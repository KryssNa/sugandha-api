import { NextFunction, Request, Response } from "express";
import { appLogger, errorLogger } from "../utils/logger";

// Middleware to log user activity
export const activityLogger = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const email = req.user?.email;
        const sessionId = req.session?.id; // Assuming sessionId is stored in req.session.id
        const action = `${req.method} ${req.originalUrl}`;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent') || '';

        // Exclude sensitive fields from the request body
        const { password, ...safeBody } = req.body;
        // Log the activity
        appLogger.info('User activity', {
            email,
            sessionId,
            action,
            ipAddress,
            userAgent,
            details: {
                body: safeBody, // Log sanitized request body
                params: req.params,
                query: req.query,
            },
        });

        next();
    } catch (error) {
        errorLogger.error('Error logging activity:', error);
        next(error);
    }
};