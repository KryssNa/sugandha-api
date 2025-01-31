import csurf from "csurf";

// CSRF protection middleware
export const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 24 * 60 * 60 * 1000 // 24 hours instead of 1 hour for better UX
  },
  ignoreMethods: ["GET", "HEAD", "OPTIONS"],
  value: (req) => {
    // Convert header names to lowercase for case-insensitive comparison
    const token =
      req.headers["x-csrf-token"] ||
      req.headers["x-xsrf-token"] ||
      req.body._csrf;

    if (!token) {
      console.warn('No CSRF token found in request');
    }
    return token as string;
  }
});