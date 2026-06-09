import { Request, Response, NextFunction } from "express";
import { jwtService, AuthUser } from "../services/jwt.service";

// ── Extend Express Request ────────────────────────────────────────────────────
// declare global {
//     namespace Express {
//         interface Request {
//             user?: AuthUser;
//         }
//     }
// }

// ── authenticate — required auth ─────────────────────────────────────────────
export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const token = jwtService.extractFromHeader(req.headers.authorization);
        const payload = jwtService.verifyAccessToken(token);

        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            plan: payload.plan,
        };

        next();
    } catch (err) {
        next(err);
    }
};

// ── optionalAuth — attaches user if token exists, doesn't fail if not ────────
export const optionalAuth = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return next();

        const token = jwtService.extractFromHeader(authHeader);
        const payload = jwtService.verifyAccessToken(token);

        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            plan: payload.plan,
        };
    } catch {
        // silently ignore — user stays undefined
    }

    next();
};