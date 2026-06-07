export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiResponseShape<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: {
        code: string;
        details?: unknown;
    };
    meta?: PaginationMeta;
    timestamp: string;
}

export class ApiResponse {
    // ── Success ────────────────────────────────────────────────────────────

    static success<T>(
        data: T,
        message = "Success",
        meta?: PaginationMeta
    ): ApiResponseShape<T> {
        return {
            success: true,
            message,
            data,
            meta,
            timestamp: new Date().toISOString(),
        };
    }

    static created<T>(data: T, message = "Created successfully"): ApiResponseShape<T> {
        return ApiResponse.success(data, message);
    }

    static paginated<T>(
        data: T[],
        total: number,
        page: number,
        limit: number,
        message = "Success"
    ): ApiResponseShape<T[]> {
        return ApiResponse.success(data, message, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    }

    // ── Error ──────────────────────────────────────────────────────────────

    static error(
        message: string,
        code: string,
        details?: unknown
    ): ApiResponseShape<null> {
        return {
            success: false,
            message,
            error: { code, details },
            timestamp: new Date().toISOString(),
        };
    }
}
