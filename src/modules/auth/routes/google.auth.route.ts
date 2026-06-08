import { Router } from "express";
import passport from "passport";
import { googleAuthController } from "../controllers/google.auth.controller";

const router = Router();

// ── Step 1: redirect user to Google consent screen ───────────────────────────
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
    })
);

// ── Step 2: Google redirects back here ───────────────────────────────────────
router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: "/api/v1/auth/google/failed",
    }),
    (req, res, next) => googleAuthController.callback(req, res, next)
);

// ── Failure fallback ─────────────────────────────────────────────────────────
router.get("/google/failed", (_req, res) => {
    res.status(401).json({ success: false, message: "Google authentication failed" });
});

export default router;