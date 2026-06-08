import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/database";
import { redis } from "./config/redis";
import { registerMiddlewares } from "./common/middlewares";
import { errorHandler, notFoundHandler } from "./common/errors/errorHandler";
import { startJobs } from "./jobs";
import passport from "passport";
import { initGoogleStrategy } from "./modules/auth/strategy/google.strategy";

const app = express();

registerMiddlewares(app);

app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const start = async () => {
    // ── 1. Database ───────────────────────────────
    await connectDB();
    // ── init passport strategies ──────────────────
    app.use(passport.initialize());
    initGoogleStrategy();


    // ── 2. Redis ──────────────────────────────────
    redis.on("connect", () => console.log("✅ Redis connected"));
    redis.on("error", (e) => console.error("❌ Redis error:", e));

    // ── 2. Jobs ──────────────────────────────────
    startJobs();
    // ── 3. Routes ──────────────────────────────────
    const authRoutes = (await import("./modules/auth/routes/auth.route")).default;
    const googleRoutes = (await import("./modules/auth/routes/google.auth.route")).default;
    const githubRoutes = (await import("./modules/auth/routes/github.auth.route")).default;

    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/auth", googleRoutes);
    app.use("/api/v1/auth", githubRoutes);

    // ── 4. Error handlers ─────────────────────────
    app.use(notFoundHandler);
    app.use(errorHandler);

    // ── 5. Listen ─────────────────────────────────
    const PORT = process.env.APP_PORT ?? 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} [${process.env.APP_ENV}]`);
    });
};

start();

export default app;