import { Request } from "express";
import rateLimit from "express-rate-limit";

// Rate limiting middleware
export const perfumeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: "Too many requests. Please try again later.",
  },
});

export const rateLimiter = (
  maxRequests: number = 10,
  timeWindow: number = 15 * 60 * 1000 // 15 minutes
) => {
  return rateLimit({
    windowMs: timeWindow, // Time window in milliseconds
    max: maxRequests, // Limit each IP to X requests per windowMs
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers

    // Custom message and status code
    message: {
      message: 'Too many requests, please try again later'
    },
    statusCode: 429,

    // Optional: Custom key generator (useful for proxied requests)
    keyGenerator: (req: Request) =>
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'
  });
};

// Advanced IP-based blocking
export class IPBlockService {
  private static blockedIPs: Map<string, {
    blockUntil: Date;
    attempts: number
  }> = new Map();

  static isBlocked(ip: string): boolean {
    const blockEntry = this.blockedIPs.get(ip);
    if (!blockEntry) return false;
    return blockEntry.blockUntil > new Date();
  }

  static recordAttempt(ip: string, endpoint: string) {
    const now = new Date();
    let blockEntry = this.blockedIPs.get(ip);

    if (!blockEntry) {
      blockEntry = { attempts: 1, blockUntil: now };
    } else {
      blockEntry.attempts++;
    }

    // Block after 15 requests
    if (blockEntry.attempts > 15) {
      const blockDuration = 15 * 60 * 1000; // 15 minutes
      blockEntry.blockUntil = new Date(now.getTime() + blockDuration);
    }

    this.blockedIPs.set(ip, blockEntry);
  }

  static clearAttempts(ip: string) {
    this.blockedIPs.delete(ip);
  }
}
