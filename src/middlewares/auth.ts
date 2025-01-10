// src/middleware/auth.middleware.ts
import { NextFunction, Request, Response } from "express";
import { UserDocument } from "../models/user.model";
import { UserService } from "../services/user.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { verifyAccessToken } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

export const authenticate = asyncHandler(async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(401, "Authentication failed", [
        { message: "No token provided" }
      ]);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AppError(401, "Authentication failed", [
        { message: "Token is missing" }
      ]);
    }

    try {
      const payload = await verifyAccessToken(token);

      if (!payload?.userId) {
        throw new AppError(401, "Authentication failed", [
          { message: "Invalid token payload" }
        ]);
      }

      const user = await UserService.findById(`${payload.userId}`);

      if (!user) {
        throw new AppError(401, "Authentication failed", [
          { message: "User not found or deactivated" }
        ]);
      }

      if (!user.isActive) {
        throw new AppError(401, "Authentication failed", [
          { message: "Account is deactivated" }
        ]);
      }

      req.user = user;
      next();
    } catch (error: any) {
      console.error("Token Verification Error:", error);

      // Handle jose-specific errors
      if (error.code === 'ERR_JWT_EXPIRED') {
        throw new AppError(401, "Authentication failed", [
          { message: "Token has expired" }
        ]);
      }

      if (error.code === 'ERR_JWS_INVALID') {
        throw new AppError(401, "Authentication failed", [
          { message: "Invalid token signature" }
        ]);
      }

      if (error.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
        throw new AppError(401, "Authentication failed", [
          { message: "Token validation failed" }
        ]);
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(401, "Authentication failed", [
        { message: "Token verification failed" }
      ]);
    }
  } catch (error) {
    console.error("Authentication Error:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, "Authentication failed", [
      { message: "Invalid or expired token" }
    ]);
  }
});