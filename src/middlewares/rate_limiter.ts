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
