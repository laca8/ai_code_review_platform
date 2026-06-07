import { Repository } from 'typeorm'

import { PasswordService } from '../../../common/services/password.service'

import { User, UserPlan, UserRole } from '../../../entities/User'

import { RegisterDto } from '../dto/register.dto'

import { AppError } from '../../../common/errors/AppError'

import crypto from "crypto";
import { ApiResponse } from '../../../common/response/ApiResponse'
export class AuthService {
    constructor(private readonly userRepo: Repository<User>) { }

    // ─────────────────────────────────────────────
    // REGISTER
    // ─────────────────────────────────────────────

    async register(data: RegisterDto): Promise<User> {
        const { fullName, email, password } = data



        const existingUser = await this.userRepo.findOne({ where: { email } })

        if (existingUser) {
            throw AppError.alreadyExists('User')
        }
        // ─────────────────────────────────────────────
        // Hashed Password
        // ─────────────────────────────────────────────
        const hashedPassword = await PasswordService.hash(password)
        // ─────────────────────────────────────────────
        // Verification Email
        // ─────────────────────────────────────────────
        const verificationToken =
            crypto.randomBytes(32).toString("hex");

        // ─────────────────────────────────────────────
        // Create User
        // ─────────────────────────────────────────────

        const user = this.userRepo.create({
            fullName,
            email,
            password: hashedPassword,
            emailVerified: false,
            role: UserRole.DEVELOPER,
            plan: UserPlan.FREE,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        })



        // ─────────────────────────────────────────────
        // Save User
        // ─────────────────────────────────────────────
        const savedUser = await this.userRepo.save(user);

        // ─────────────────────────────────────────────
        // Return sanitized user (without password)
        // ─────────────────────────────────────────────
        return savedUser
    }

    async verificationEmail(token: string): Promise<{ message: string }> {
        const user = await this.userRepo.findOne({ where: { emailVerificationToken: token } })

        if (!user) {
            throw AppError.notFound('User')
        }

        if (
            !user.emailVerificationExpires ||
            user.emailVerificationExpires <
            new Date()
        ) {
            throw AppError.badRequest(
                "Verification token expired"
            );
        }
        if (
            !user.emailVerificationExpires ||
            user.emailVerificationExpires <
            new Date()
        ) {
            throw AppError.badRequest(
                "Verification token expired"
            );
        }
        if (
            !user.emailVerificationExpires ||
            user.emailVerificationExpires <
            new Date()
        ) {
            throw AppError.badRequest(
                "Verification token expired"
            );
        }

        return {
            message: "Email verified successfully"
        };
    }

}