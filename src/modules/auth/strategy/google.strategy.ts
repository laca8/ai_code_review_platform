import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { AppDataSource } from "../../../config/database";
import { User, UserRole, UserPlan } from "../../../entities/User";

export const initGoogleStrategy = (): void => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                callbackURL: process.env.GOOGLE_CALLBACK_URL!,
                scope: ["profile", "email"],
            },
            async (_accessToken, _refreshToken, profile: Profile, done) => {
                try {
                    const userRepo = AppDataSource.getRepository(User);

                    const email = profile.emails?.[0]?.value;
                    const fullName = profile.displayName;
                    const googleId = profile.id;

                    if (!email) {
                        return done(new Error("No email returned from Google"), undefined);
                    }

                    // ── 1. Already linked with Google ─────────────────────────────────
                    let user = await userRepo.findOne({ where: { googleUserId: googleId } });
                    if (user) return done(null, user);

                    // ── 2. Email exists but no Google link yet → link the account ─────
                    user = await userRepo.findOne({ where: { email } });
                    if (user) {
                        user.googleUserId = googleId;
                        user.emailVerified = true;       // trust Google's verified email
                        await userRepo.save(user);
                        return done(null, user);
                    }

                    // ── 3. New user → create account ──────────────────────────────────
                    const newUser = userRepo.create({
                        fullName,
                        email,
                        password: null,             // no password for OAuth users
                        googleUserId: googleId,
                        emailVerified: true,             // Google already verified it
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