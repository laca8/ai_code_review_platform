import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { RegisterDto } from '../dto/register.dto'
import { validateDto } from '../../../common/validate/validate.dto'
import { asyncHandler } from '../../../common/middlewares'
import { LoginDto } from '../dto/login.dto'

const router = Router()

router.post("/register",
    validateDto(RegisterDto),
    asyncHandler((req, res, next) => authController.register(req, res, next))
)

router.get("/verify-email/:token",
    asyncHandler((req, res, next) => authController.verifyEmail(req, res, next))
)
router.post(
    "/login",
    validateDto(LoginDto),
    asyncHandler((req, res, next) => authController.login(req, res, next))
);
export default router