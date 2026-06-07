import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

import { connectDB } from "./config/database";
import { redis } from "./config/redis";
import { registerMiddlewares } from "./common/middlewares";
import { errorHandler, notFoundHandler } from "./common/errors/errorHandler";

const app = express();

// ── Database connection ────────────────────────────────────────────────────
connectDB();

// ── Redis connection ─────────────────────────────────────────────────────────
redis.on("connect", () => {
    console.log("✅ Redis connected");
});

redis.on("error", (error) => {
    console.error("❌ Redis error:", error);
});
// ── Middlewares ─────────────────────────────────────────────────────────────
registerMiddlewares(app);

// ── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────────────────────────
// app.use("/api/v1/auth",         authRoutes);
// app.use("/api/v1/users",        userRoutes);
// app.use("/api/v1/repositories", repositoryRoutes);
// app.use("/api/v1/analysis",     analysisRoutes);
// app.use("/api/v1/reports",      reportRoutes);

// ── 404 ─────────────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.APP_PORT ?? 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.APP_ENV}]`);
});

export default app;
