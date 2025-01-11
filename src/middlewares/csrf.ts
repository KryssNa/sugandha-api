import csurf from "csurf";

export const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600
  },
  ignoreMethods: ["GET", "HEAD", "OPTIONS"],
  value: (req) => {
    return req.headers["x-csrf-token"] as string ||
      req.headers["x-xsrf-token"] as string ||
      req.body._csrf;
  }
});