import { Request, Response, NextFunction } from "express";
import { googleAuthService } from "../services/google-auth.service";
import { ApiResponse } from "../../../common/response/ApiResponse";
import { User } from "../../../entities/User";
import { AppError } from "../../../common/errors/AppError";

export class GoogleAuthController {

    // GET /auth/google  → redirects to Google consent screen
    redirect(_req: Request, res: Response): void {
        // handled by passport middleware in the route
        res.status(200).json(ApiResponse.success(null, "Redirecting to Google..."));
    }

    // GET /auth/google/callback  → Google redirects here after consent
    callback(req: Request, res: Response, next: NextFunction): void {
        try {
            const user = req.user as User | undefined;

            if (!user) {
                return next(AppError.unauthorized("Google authentication failed"));
            }

            const result = googleAuthService.handleCallback(user);

            // Option A: return JSON (for mobile / SPA using popup)
            res.status(200).json(ApiResponse.success(result, "Google login successful"));

            // Option B: redirect with token in query (for traditional web flow)
            // res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${result.accessToken}`);
        } catch (err) {
            next(err);
        }
    }
}

export const googleAuthController = new GoogleAuthController();