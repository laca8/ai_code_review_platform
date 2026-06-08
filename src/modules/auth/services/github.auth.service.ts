import { User } from "../../../entities/User";
import { jwtService } from "../../../common/services/jwt.service";

export class GitHubAuthService {

    handleCallback(user: User): {
        user: Omit<User, "password" | "githubAccessToken">;
        accessToken: string;
        refreshToken: string;
    } {
        const accessToken = jwtService.signAccessToken({
            sub: user.id,
            email: user.email,
            role: user.role,
            plan: user.plan,
        });

        const refreshToken = jwtService.signRefreshToken(user.id);

        const { password, githubAccessToken, ...safeUser } = user;

        return {
            user: safeUser as Omit<User, "password" | "githubAccessToken">,
            accessToken,
            refreshToken,
        };
    }
}

export const githubAuthService = new GitHubAuthService();