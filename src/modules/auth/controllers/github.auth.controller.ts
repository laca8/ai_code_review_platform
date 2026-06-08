import { Request, Response, NextFunction } from "express";
import { githubAuthService } from "../services/github.auth.service";
import { ApiResponse } from "../../../common/response/ApiResponse";
import { User } from "../../../entities/User";
import { AppError } from "../../../common/errors/AppError";

export class GitHubAuthController {

    // GET /auth/github → redirects to GitHub consent screen
    redirect(_req: Request, res: Response): void {
        res.status(200).json(ApiResponse.success(null, "Redirecting to GitHub..."));
    }

    // GET /auth/github/callback → GitHub redirects here after consent
    callback(req: Request, res: Response, next: NextFunction): void {
        try {
            const user = req.user as User | undefined;

            if (!user) {
                return next(AppError.unauthorized("GitHub authentication failed"));
            }

            const result = githubAuthService.handleCallback(user);

            // Option A: JSON response (for SPA / mobile)
            res.status(200).json(ApiResponse.success(result, "GitHub login successful"));

            // Option B: redirect with token (for traditional web flow)
            // res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${result.accessToken}`);
        } catch (err) {
            next(err);
        }
    }
}

export const githubAuthController = new GitHubAuthController();