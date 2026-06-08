import { cleanupUnverifiedAccounts } from "./cleanup-unverified.job";

export const startJobs = (): void => {
    cleanupUnverifiedAccounts.start();
    console.log("[Jobs] cleanup-unverified started (runs every hour)");
};
