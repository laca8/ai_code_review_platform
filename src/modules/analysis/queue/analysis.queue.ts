import Bull from "bull";

export interface AnalysisJobData {
    jobId: string;
    repositoryId: string;
    userId: string;
    cloneUrl: string;
    branch: string;
    commitSha: string | null;
    triggeredBy: "manual" | "webhook" | "schedule";
}

export const analysisQueue = new Bull<AnalysisJobData>("analysis", {
    redis: {
        host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
    },
    defaultJobOptions: {
        attempts: 3,                    // retry 3 times on failure
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 50,               // keep last 50 completed jobs in Redis
        removeOnFail: 20,
    },
});