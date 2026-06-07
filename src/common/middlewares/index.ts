import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// ── 1. Security headers (helmet) ───────────────────────────────────────────
export const securityMiddleware = helmet();

// ── 2. CORS ────────────────────────────────────────────────────────────────
export const corsMiddleware = cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
});

// ── 3. Body parsers ────────────────────────────────────────────────────────
export const bodyParserMiddleware = [
    express.json({ limit: "10mb" }),
    express.urlencoded({ extended: true }),
];

// ── 4. Global rate limiter ─────────────────────────────────────────────────
export const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
});

// ── 5. Auth rate limiter (stricter — for login/register) ──────────────────
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many auth attempts, please try again later." },
});

// ── 6. Request logger ─────────────────────────────────────────────────────
export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
    if (process.env.APP_ENV !== "production") {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    }
    next();
};

// ── 7. Async wrapper — eliminates try/catch in every controller ───────────
export const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
        (req: Request, res: Response, next: NextFunction): void => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };

// ── Register all middlewares on the app ────────────────────────────────────
export const registerMiddlewares = (app: Application): void => {
    app.use(securityMiddleware);
    app.use(corsMiddleware);
    app.use(...bodyParserMiddleware);
    app.use(globalRateLimiter);
    app.use(requestLogger);
};
