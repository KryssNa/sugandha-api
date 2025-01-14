// middleware/optionalAuth.middleware.ts
import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/user.service";
import { verifyAccessToken } from "../utils/jwt";

export const optionalAuthenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            // No token - proceed as guest
            req.user = undefined;
            return next();
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            req.user = undefined;
            return next();
        }

        try {
            const payload = await verifyAccessToken(token);

            if (payload?.userId) {
                const user = await UserService.findById(`${payload.userId}`);
                if (user && user.isActive) {
                    req.user = user;
                }
            }
        } catch (error) {
            // Token verification failed - proceed as guest
            req.user = undefined;
        }

        next();
    } catch (error) {
        next(error);
    }
};