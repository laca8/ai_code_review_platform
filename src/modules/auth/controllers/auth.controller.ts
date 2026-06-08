import { Response, Request, NextFunction } from 'express'
import { AppDataSource } from '../../../config/database'
import { User } from '../../../entities/User'
import { AuthService } from '../services/auth.service'
import { ApiResponse } from '../../../common/response/ApiResponse'

const userRepo = AppDataSource.getRepository(User)
const authService = new AuthService(userRepo)

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await authService.register(req.body)
            res.status(201).json(ApiResponse.created(result))
        } catch (err) {
            next(err)
        }
    }

    async verifyEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const tokenParam = req.params.token
            const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam

            if (!token) {
                throw new Error('Verification token is required')
            }

            const result = await authService.verifyEmail(token)
            res.status(200).json(ApiResponse.success(result, "Email verified successfully"))
        } catch (err) {
            next(err)
        }
    }

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await authService.login(req.body);
            res.status(200).json(ApiResponse.success(result, "Logged in successfully"));
        } catch (err) {
            next(err);
        }
    }
}

export const authController = new AuthController()