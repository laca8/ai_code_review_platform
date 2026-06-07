import { Request, Response, NextFunction } from "express";
import { AppError, ErrorCode } from "./AppError";
import { ApiResponse } from "../response/ApiResponse";
import { EntityNotFoundError, QueryFailedError } from "typeorm";

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // ── 1. AppError (operational errors we threw ourselves) ────────────────
    if (err instanceof AppError) {
        res.status(err.statusCode).json(
            ApiResponse.error(err.message, err.errorCode, err.details)
        );
        return;
    }

    // ── 2. TypeORM: record not found ───────────────────────────────────────
    if (err instanceof EntityNotFoundError) {
        res.status(404).json(
            ApiResponse.error("Resource not found", ErrorCode.NOT_FOUND)
        );
        return;
    }

    // ── 3. TypeORM: DB query error (e.g. unique constraint) ───────────────
    if (err instanceof QueryFailedError) {
        const dbErr = err as QueryFailedError & { code?: string };

        if (dbErr.code === "23505") {
            res.status(409).json(
                ApiResponse.error("Resource already exists", ErrorCode.ALREADY_EXISTS)
            );
            return;
        }

        if (dbErr.code === "23503") {
            res.status(400).json(
                ApiResponse.error("Related resource not found", ErrorCode.BAD_REQUEST)
            );
            return;
        }

        res.status(500).json(
            ApiResponse.error("Database error", ErrorCode.INTERNAL_ERROR)
        );
        return;
    }

    // ── 4. JWT errors ──────────────────────────────────────────────────────
    if (err.name === "JsonWebTokenError") {
        res.status(401).json(
            ApiResponse.error("Invalid token", ErrorCode.UNAUTHORIZED)
        );
        return;
    }

    if (err.name === "TokenExpiredError") {
        res.status(401).json(
            ApiResponse.error("Token expired", ErrorCode.TOKEN_EXPIRED)
        );
        return;
    }

    // ── 5. SyntaxError (malformed JSON body) ──────────────────────────────
    if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json(
            ApiResponse.error("Invalid JSON", ErrorCode.BAD_REQUEST)
        );
        return;
    }

    // ── 6. Unknown errors (log & return generic message) ──────────────────
    console.error("Unhandled error:", err);

    res.status(500).json(
        ApiResponse.error(
            process.env.APP_ENV === "production"
                ? "Something went wrong"
                : err.message,
            ErrorCode.INTERNAL_ERROR
        )
    );
};

// ── 404 handler (route not found) ──────────────────────────────────────────
export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json(
        ApiResponse.error(
            `Route ${req.method} ${req.originalUrl} not found`,
            ErrorCode.NOT_FOUND
        )
    );
};
