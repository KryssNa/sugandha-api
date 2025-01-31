import cors from "cors";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from 'express-rate-limit';
import helmet from "helmet";
import hpp from "hpp";
import { config } from "./config";
require('dotenv').config();

interface CorsPolicy {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
    credentials: boolean;
    optionsSuccessStatus: number;
}

export const configureSecurity = (app: express.Application) => {
    // CORS configuration
    const corsPolicy: CorsPolicy = {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const allowedOrigins = config.CORS_ALLOWED_ORIGINS;
            if (allowedOrigins.indexOf(origin) === -1) {
                const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials: true,
        optionsSuccessStatus: 200,
    };
    app.use(cors(corsPolicy));

    // Security middleware with enhanced headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", "https:", "data:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
                formAction: ["'self'"],
                upgradeInsecureRequests: null, // Forces HTTPS
                baseUri: ["'none'"], // Restricts base URI injections
                manifestSrc: ["'self'"]
            }
        },
        // Cross-Origin settings
        crossOriginEmbedderPolicy: false, // Prevents loading cross-origin resources
        crossOriginOpenerPolicy: { policy: "same-origin" }, // Controls cross-origin popups
        crossOriginResourcePolicy: { policy: "same-site" }, // Controls resource sharing



        // Additional security headers
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        },
        noSniff: true, // Prevents MIME type sniffing
        frameguard: { action: "deny" }, // Prevents clickjacking
        hidePoweredBy: true, // Removes X-Powered-By header
        dnsPrefetchControl: { allow: false }, // Controls DNS prefetching
        ieNoOpen: true, // Prevents IE from executing downloads
        originAgentCluster: true, // Enables Origin isolation

    }));

    // additional custom security headers
    app.use((req, res, next) => {
        // Allow credentials in headers
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        // Ensure CORS headers are present
        res.setHeader('Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept, x-csrf-token, x-xsrf-token');

        next();
    });

    // Prevent HTTP Parameter Pollution attacks
    app.use(hpp({
        whitelist: [] // any parameters that are allowed to be duplicated
    }));

    // MongoDB sanitization with enhanced options
    app.use(mongoSanitize({
        replaceWith: '_',
        onSanitize: ({ req, key }) => {
            console.warn(`This request[${key}] is sanitized`, req);
        }
    }));

    // rate limiting 
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 50, // limit each IP to 50 requests per windowMs
            message: "Too many request from this ip. Please try again later!"
        })
    );
};