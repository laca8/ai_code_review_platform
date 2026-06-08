import cron from "node-cron";
import { LessThan } from "typeorm";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";

// ── runs every hour ───────────────────────────────────────────────────────────
export const cleanupUnverifiedAccounts = cron.schedule(
    "0 * * * *",
    async () => {
        try {
            const userRepo = AppDataSource.getRepository(User);

            const now = new Date();

            const result = await userRepo.delete({
                emailVerified: false,
                emailVerificationExpires: LessThan(now),
            });

            if (result.affected && result.affected > 0) {
                console.log(
                    `[Cleanup Job] Deleted ${result.affected} unverified account(s) at ${now.toISOString()}`
                );
            }
        } catch (err) {
            console.error("[Cleanup Job] Failed:", err);
        }
    },
);