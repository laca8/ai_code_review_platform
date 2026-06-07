import { Response, Request, NextFunction } from 'express'


import { AuthService } from '../services/auth.service'

import { ApiResponse } from '../../../common/response/ApiResponse'
import { AppError } from '../../../common/errors/AppError';


export class AuthController {
    constructor(private readonly authService: AuthService) { }

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await this.authService.register(req.body);

            return res.status(201).json(
                ApiResponse.success(user, "User registered successfully")
            );
        } catch (err) {
            next(err);
        }
    };

    verificationEmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { token } = req.query;
            if (!token || typeof token !== 'string') {
                throw AppError.badRequest('Verification token is required')
            }
            const result = await this.authService.verificationEmail(token);
            return res.status(200).json(ApiResponse.success(result, "Email verified successfully"));
        } catch (err) {
            next(err)
        }
    }
}
