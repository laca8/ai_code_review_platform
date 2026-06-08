import { Router } from "express";
import passport from "passport";
import { githubAuthController } from "../controllers/github.auth.controller";

const router = Router();

// ── Step 1: redirect user to GitHub consent screen ───────────────────────────
router.get(
    "/github",
    passport.authenticate("github", {
        scope: ["user:email"],
        session: false,
    })
);

// ── Step 2: GitHub redirects back here ───────────────────────────────────────
router.get(
    "/github/callback",
    passport.authenticate("github", {
        session: false,
        failureRedirect: "/api/v1/auth/github/failed",
    }),
    (req, res, next) => githubAuthController.callback(req, res, next)
);

// ── Failure fallback ─────────────────────────────────────────────────────────
router.get("/github/failed", (_req, res) => {
    res.status(401).json({ success: false, message: "GitHub authentication failed" });
});

export default router;