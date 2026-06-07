import {
    Router,
} from 'express'
import { AuthController } from '../controllers/auth.controller'
import { RegisterDto } from '../dto/register.dto';
import { validateDto } from '../../../common/validate/validate.dto';
const router = Router()

// Initialize controller
const authController = new AuthController({} as any);
// Define routes
router.post('/register', validateDto(RegisterDto), authController.register);
router.get(
    "/verify-email",
    authController.verificationEmail
);

export default router;