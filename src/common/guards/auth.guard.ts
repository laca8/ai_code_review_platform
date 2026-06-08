import { Request, Response, NextFunction } from "express";
import { UserRole, UserPlan } from "../../entities/User";
import { AppError } from "../errors/AppError";

// ── requireRole ───────────────────────────────────────────────────────────────
// Usage: router.delete("/users/:id", authenticate, requireRole(UserRole.ADMIN), handler)

export const requireRole = (...roles: UserRole[]) =>
    (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            return next(AppError.unauthorized());
        }

        if (!roles.includes(req.user.role)) {
            return next(AppError.forbidden("Insufficient permissions"));
        }

        next();
    };

// ── requirePlan ───────────────────────────────────────────────────────────────
// Usage: router.post("/analysis", authenticate, requirePlan(UserPlan.PRO, UserPlan.TEAM), handler)

export const requirePlan = (...plans: UserPlan[]) =>
    (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            return next(AppError.unauthorized());
        }

        if (!plans.includes(req.user.plan)) {
            return next(
                AppError.planLimitExceeded(
                    `This feature requires one of the following plans: ${plans.join(", ")}`
                )
            );
        }

        next();
    };

// ── requireOwner ─────────────────────────────────────────────────────────────
// Ensures the logged-in user owns the resource (or is admin)
// Usage: router.get("/repos/:userId", authenticate, requireOwner("userId"), handler)

export const requireOwner = (paramKey = "userId") =>
    (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            return next(AppError.unauthorized());
        }

        const resourceOwnerId = req.params[paramKey];
        const isOwner = req.user.id === resourceOwnerId;
        const isAdmin = req.user.role === UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            return next(AppError.forbidden("You don't have access to this resource"));
        }

        next();
    };