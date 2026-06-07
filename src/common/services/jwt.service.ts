import jwt, { SignOptions } from "jsonwebtoken";
import { AppError } from "../../common/errors/AppError";
import { UserRole, UserPlan } from "../../entities/User";

// ── Payload shape inside the token ───────────────────────────────────────────
export interface JwtPayload {
    sub: string;       // user id
    email: string;
    role: UserRole;
    plan: UserPlan;
    iat?: number;
    exp?: number;
}

// ── What gets attached to req.user ───────────────────────────────────────────
export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    plan: UserPlan;
}

class JwtService {
    private readonly accessSecret: string;
    private readonly refreshSecret: string;
    private readonly accessExpiresIn: string;
    private readonly refreshExpiresIn: string;

    constructor() {
        this.accessSecret = process.env.JWT_SECRET ?? "access_secret";
        this.refreshSecret = process.env.JWT_REFRESH_SECRET ?? "refresh_secret";
        this.accessExpiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
        this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? "30d";
    }

    // ── Sign ──────────────────────────────────────────────────────────────────

    signAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
        return jwt.sign(payload, this.accessSecret, {
            expiresIn: this.accessExpiresIn,
        } as SignOptions);
    }

    signRefreshToken(userId: string): string {
        return jwt.sign({ sub: userId }, this.refreshSecret, {
            expiresIn: this.refreshExpiresIn,
        } as SignOptions);
    }

    // ── Verify ────────────────────────────────────────────────────────────────

    verifyAccessToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, this.accessSecret) as JwtPayload;
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                throw AppError.unauthorized("Token expired");
            }
            throw AppError.unauthorized("Invalid token");
        }
    }

    verifyRefreshToken(token: string): { sub: string } {
        try {
            return jwt.verify(token, this.refreshSecret) as { sub: string };
        } catch {
            throw AppError.unauthorized("Invalid refresh token");
        }
    }

    // ── Extract from header ───────────────────────────────────────────────────

    extractFromHeader(authHeader?: string): string {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw AppError.unauthorized("No token provided");
        }
        return authHeader.split(" ")[1];
    }
}

export const jwtService = new JwtService();