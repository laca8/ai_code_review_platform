import { Repository } from 'typeorm'

import { PasswordService } from '../../../common/services/password.service'

import { User, UserPlan, UserRole } from '../../../entities/User'

import { RegisterDto } from '../dto/register.dto'

import { AppError } from '../../../common/errors/AppError'

import crypto from "crypto";
import { jwtService } from '../../../common/services/jwt.service'
import { emailService } from '../../../common/notifications/email/email.service'
import { LoginDto } from '../dto/login.dto'
export class AuthService {
    constructor(private readonly userRepo: Repository<User>) { }

    // ─────────────────────────────────────────────
    // REGISTER
    // ─────────────────────────────────────────────

    async register(data: RegisterDto): Promise<{ message: string }> {
        const { fullName, email, password } = data

        const existingUser = await this.userRepo.findOne({ where: { email } })
        if (existingUser) throw AppError.alreadyExists('User')

        const hashedPassword = await PasswordService.hash(password)
        const verificationToken = crypto.randomBytes(32).toString("hex")

        const user = this.userRepo.create({
            fullName,
            email,
            password: hashedPassword,
            emailVerified: false,
            role: UserRole.DEVELOPER,
            plan: UserPlan.FREE,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })

        await this.userRepo.save(user)

        // send email
        await emailService.sendEmailVerification(email, verificationToken)

        return { message: "Registration successful. Please verify your email." }
    }

    // ─────────────────────────────────────────────
    // Verify Email
    // ─────────────────────────────────────────────
    async verifyEmail(token: string): Promise<{ user: Omit<User, 'password' | 'githubAccessToken'>; accessToken: string; refreshToken: string }> {
        const user = await this.userRepo.findOne({
            where: { emailVerificationToken: token }
        })

        if (!user) throw AppError.notFound('User')

        if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
            throw AppError.badRequest("Verification token expired")
        }

        // update user
        user.emailVerified = true
        user.emailVerificationToken = null
        user.emailVerificationExpires = null
        await this.userRepo.save(user)

        // generate tokens only after verified
        const accessToken = jwtService.signAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role,
            plan: user.plan,
        })
        const refreshToken = jwtService.signRefreshToken(user.id)
        // send email
        await emailService.sendWelcome(user.email, user.fullName)
        return {
            user: this.sanitizeUser(user),
            accessToken,
            refreshToken,
        }
    }

    // ─────────────────────────────────────────────
    // Login
    // ─────────────────────────────────────────────
    async login(data: LoginDto): Promise<{
        user: Omit<User, "password" | "githubAccessToken">;
        accessToken: string;
        refreshToken: string;
    }> {
        const { email, password } = data;

        // ── 1. Find user ────────────────────────────────────────────────────────
        const user = await this.userRepo.findOne({ where: { email } });

        if (!user) {
            // same message for both cases — don't leak which one is wrong
            throw AppError.unauthorized("Invalid email or password");
        }

        // ── 2. Check password ───────────────────────────────────────────────────
        if (!user.password) {
            // OAuth-only account (GitHub / Google) — has no password
            throw AppError.badRequest(
                "This account uses social login. Please sign in with GitHub or Google."
            );
        }

        const isMatch = await PasswordService.compare(password, user.password);
        if (!isMatch) {
            throw AppError.unauthorized("Invalid email or password");
        }

        // ── 3. Check email verified ─────────────────────────────────────────────
        if (!user.emailVerified) {
            throw AppError.badRequest("Please verify your email before logging in");
        }

        // ── 4. Sign tokens ──────────────────────────────────────────────────────
        const accessToken = jwtService.signAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role,
            plan: user.plan,
        });

        const refreshToken = jwtService.signRefreshToken(user.id);

        return {
            user: this.sanitizeUser(user),
            accessToken,
            refreshToken,
        };
    }
    private sanitizeUser(user: User): Omit<User, "password" | "githubAccessToken"> {
        const { password, githubAccessToken, ...safeUser } = user;
        return safeUser as Omit<User, "password" | "githubAccessToken">;
    }

}