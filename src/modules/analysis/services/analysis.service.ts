import { Repository as TypeOrmRepo } from "typeorm";
import crypto from "crypto";
import { AnalysisJob, JobStatus, TriggerSource } from "../../../entities/AnalysisJob";
import { Repository } from "../../../entities/Repository";
import { User } from "../../../entities/User";
import { Subscription } from "../../../entities/Subscription";
import { AppError } from "../../../common/errors/AppError";
import { analysisQueue, AnalysisJobData } from "../queue/analysis.queue";

export class AnalysisService {
    constructor(
        private readonly jobRepo: TypeOrmRepo<AnalysisJob>,
        private readonly repoRepo: TypeOrmRepo<Repository>,
        private readonly userRepo: TypeOrmRepo<User>,
        private readonly subscriptionRepo: TypeOrmRepo<Subscription>
    ) { }

    // ── Start analysis ────────────────────────────────────────────────────────
    async startAnalysis(
        repositoryId: string,
        userId: string,
        triggeredBy: TriggerSource = TriggerSource.MANUAL,
        branch?: string,
        commitSha?: string
    ): Promise<AnalysisJob> {

        // ── 1. Get repo ───────────────────────────────────────────────────────
        const repo = await this.repoRepo.findOne({ where: { id: repositoryId, userId } });
        if (!repo) throw AppError.notFound("Repository");

        if (!repo.cloneUrl) throw AppError.badRequest("Repository has no clone URL");

        // ── 2. Check subscription limit ───────────────────────────────────────
        const subscription = await this.subscriptionRepo.findOne({ where: { userId } });
        if (subscription) {
            if (subscription.analysesUsed >= subscription.analysesPerMonth) {
                throw AppError.planLimitExceeded(
                    `You have reached your monthly analysis limit (${subscription.analysesPerMonth}). Please upgrade your plan.`
                );
            }
        }

        // ── 3. Check no running job for same repo ────────────────────────────
        const runningJob = await this.jobRepo.findOne({
            where: { repositoryId, status: JobStatus.RUNNING },
        });
        if (runningJob) {
            throw AppError.conflict("An analysis is already running for this repository");
        }

        // ── 4. Create job record ──────────────────────────────────────────────
        const analysisJob = this.jobRepo.create({
            repositoryId,
            userId,
            branch: branch ?? repo.defaultBranch,
            commitSha: commitSha ?? null,
            status: JobStatus.PENDING,
            triggeredBy,
        });

        const savedJob = await this.jobRepo.save(analysisJob);

        // ── 5. Dispatch to Bull queue ─────────────────────────────────────────
        const jobData: AnalysisJobData = {
            jobId: savedJob.id,
            repositoryId,
            userId,
            cloneUrl: repo.cloneUrl,
            branch: branch ?? repo.defaultBranch,
            commitSha: commitSha ?? null,
            triggeredBy,
        };

        await analysisQueue.add(jobData, { jobId: savedJob.id });

        // ── 6. Increment analyses used ────────────────────────────────────────
        if (subscription) {
            subscription.analysesUsed += 1;
            await this.subscriptionRepo.save(subscription);
        }

        return savedJob;
    }

    // ── Get job status ────────────────────────────────────────────────────────
    async getJobStatus(jobId: string, userId: string): Promise<{
        job: AnalysisJob;
        progress: number;
    }> {
        const job = await this.jobRepo.findOne({
            where: { id: jobId, userId },
            relations: ["report"],
        });

        if (!job) throw AppError.notFound("Analysis job");

        // get progress from Bull queue
        let progress = 0;
        const bullJob = await analysisQueue.getJob(jobId);
        if (bullJob) {
            progress = await bullJob.progress() as number;
        } else if (job.status === JobStatus.COMPLETED) {
            progress = 100;
        }

        return { job, progress };
    }

    // ── Get analysis history ──────────────────────────────────────────────────
    async getHistory(
        userId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ jobs: AnalysisJob[]; total: number }> {

        const [jobs, total] = await this.jobRepo.findAndCount({
            where: { userId },
            order: { createdAt: "DESC" },
            skip: (page - 1) * limit,
            take: limit,
            relations: ["repository"],
        });

        return { jobs, total };
    }

    // ── Cancel job ────────────────────────────────────────────────────────────
    async cancelJob(jobId: string, userId: string): Promise<AnalysisJob> {
        const job = await this.jobRepo.findOne({ where: { id: jobId, userId } });
        if (!job) throw AppError.notFound("Analysis job");

        if (job.status !== JobStatus.PENDING) {
            throw AppError.badRequest("Only pending jobs can be cancelled");
        }

        // remove from Bull queue
        const bullJob = await analysisQueue.getJob(jobId);
        if (bullJob) await bullJob.remove();

        job.status = JobStatus.CANCELLED;
        return this.jobRepo.save(job);
    }
}