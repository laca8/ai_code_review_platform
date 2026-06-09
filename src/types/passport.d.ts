import { AuthUser } from "../common/jwt/jwt.service";

declare global {
    namespace Express {
        interface User extends AuthUser { }

        interface Request {
            user?: AuthUser;
        }
    }
}