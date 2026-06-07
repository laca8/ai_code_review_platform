export enum ErrorCode {
    // Auth
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",

    // Resource
    NOT_FOUND = "NOT_FOUND",
    ALREADY_EXISTS = "ALREADY_EXISTS",
    CONFLICT = "CONFLICT",


    // Validation
    VALIDATION_ERROR = "VALIDATION_ERROR",
    BAD_REQUEST = "BAD_REQUEST",

    // Business
    PLAN_LIMIT_EXCEEDED = "PLAN_LIMIT_EXCEEDED",
    ANALYSIS_FAILED = "ANALYSIS_FAILED",
    GITHUB_API_ERROR = "GITHUB_API_ERROR",

    // Server
    INTERNAL_ERROR = "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}


export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: ErrorCode;
    public readonly details?: unknown;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: number,
        errorCode: ErrorCode,
        details?: unknown,
        isOperational = true
    ) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.isOperational = isOperational;
        if (typeof (Error as any).captureStackTrace === "function") {
            (Error as any).captureStackTrace(this, this.constructor);
        } else {
            // Fallback for environments where captureStackTrace is not available
            this.stack = new Error(message).stack;
        }

    }


    // ── Static factory methods ──────────────────────────────────────────────

    static badRequest(message: string, details?: unknown) {
        return new AppError(message, 400, ErrorCode.BAD_REQUEST, details);
    }

    static unauthorized(message = "Unauthorized") {
        return new AppError(message, 401, ErrorCode.UNAUTHORIZED);
    }

    static forbidden(message = "Forbidden") {
        return new AppError(message, 403, ErrorCode.FORBIDDEN);
    }

    static notFound(resource: string) {
        return new AppError(`${resource} not found`, 404, ErrorCode.NOT_FOUND);
    }

    static conflict(message: string) {
        return new AppError(message, 409, ErrorCode.CONFLICT);
    }

    static alreadyExists(resource: string) {
        return new AppError(`${resource} already exists`, 409, ErrorCode.ALREADY_EXISTS);
    }

    static validation(message: string, details?: unknown) {
        return new AppError(message, 422, ErrorCode.VALIDATION_ERROR, details);
    }

    static planLimitExceeded(message: string) {
        return new AppError(message, 403, ErrorCode.PLAN_LIMIT_EXCEEDED);
    }

    static internal(message = "Internal server error") {
        return new AppError(message, 500, ErrorCode.INTERNAL_ERROR, undefined, false);
    }
}
