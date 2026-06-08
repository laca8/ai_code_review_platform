import passport from "passport";
import { Strategy as GitHubStrategy, Profile } from "passport-github2";
import { AppDataSource } from "../../../config/database";
import { User, UserRole, UserPlan } from "../../../entities/User";

export const initGitHubStrategy = (): void => {
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID!,
                clientSecret: process.env.GITHUB_CLIENT_SECRET!,
                callbackURL: process.env.GITHUB_CALLBACK_URL!,
                scope: ["user:email"],
            },
            async (_accessToken: string, _refreshToken: string, profile: Profile, done: Function) => {
                try {
                    const userRepo = AppDataSource.getRepository(User);

                    const githubId = profile.id;
                    const fullName = profile.displayName || profile.username || "GitHub User";
                    const githubUsername = profile.username ?? null;

                    // GitHub bisa return multiple emails — kita ambil yang primary & verified
                    const email =
                        (profile.emails?.find((e: any) => e.primary && e.verified) ??
                            profile.emails?.[0])?.value ?? null;

                    if (!email) {
                        return done(new Error("No email returned from GitHub. Please make your email public in GitHub settings."), undefined);
                    }

                    // ── 1. Already linked with GitHub ─────────────────────────────────
                    let user = await userRepo.findOne({ where: { githubUserId: githubId } });
                    if (user) {
                        // update access token on every login
                        user.githubAccessToken = _accessToken;
                        user.githubUsername = githubUsername;
                        await userRepo.save(user);
                        return done(null, user);
                    }

                    // ── 2. Email exists but no GitHub link yet → link the account ─────
                    user = await userRepo.findOne({ where: { email } });
                    if (user) {
                        user.githubUserId = githubId;
                        user.githubUsername = githubUsername;
                        user.githubAccessToken = _accessToken;
                        user.emailVerified = true;
                        await userRepo.save(user);
                        return done(null, user);
                    }

                    // ── 3. New user → create account ──────────────────────────────────
                    const newUser = userRepo.create({
                        fullName,
                        email,
                        password: null,
                        githubUserId: githubId,
                        githubUsername,
                        githubAccessToken: _accessToken,
                        emailVerified: true,          // GitHub already verified it
                        role: UserRole.DEVELOPER,
                        plan: UserPlan.FREE,
                    });

                    const savedUser = await userRepo.save(newUser);
                    return done(null, savedUser);

                } catch (err) {
                    return done(err as Error, undefined);
                }
            }
        )
    );
};