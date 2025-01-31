import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import session from "express-session";
import path from "path";

export const configureMiddleware = (app: express.Application) => {
  // Basic middleware setup
  app.use(express.json({limit: '10kb'}));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(compression());
  app.use(morgan("dev"));

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1 * 60 * 1000,
      secure: true,
      httpOnly: false
    }
  }));

  // Session logging middleware
  app.use((req, res, next) => {
    if (req.session) {
      console.log(`Session ID: ${req.sessionID}`);
      console.log(`Session Data: ${JSON.stringify(req.session)}`);
    } else {
      console.log('No session initialized.');
    }
    next();
  });

  // Static files configuration
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  }));
};