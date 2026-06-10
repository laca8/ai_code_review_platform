import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../../config/database";
import { AnalysisJob } from "../../../entities/AnalysisJob";
import { Repository } from "../../../entities/Repository";
import { User } from "../../../entities/User";
import { Subscription } from "../../../entities/Subscription";
import { AnalysisService } from "../services/analysis.service";
import { ApiResponse } from "../../../common/response/ApiResponse";

const jobRepo = AppDataSource.getRepository(AnalysisJob);
const repoRepo = AppDataSource.getRepository(Repository);
const userRepo = AppDataSource.getRepository(User);
const subscriptionRepo = AppDataSource.getRepository(Subscription);

const analysisService = new AnalysisService(jobRepo, repoRepo, userRepo, subscriptionRepo);

export class AnalysisController {

    // POST /analysis/:repoId/start
    async start(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.id;
            const { repoId } = req.params;
            const { branch, commitSha } = req.body;

            const job = await analysisService.startAnalysis(repoId, userId, undefined, branch, commitSha);

            res.status(202).json(ApiResponse.success(job, "Analysis started"));
        } catch (err) { next(err); }
    }

    // GET /analysis/:jobId/status
    async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.id;
            const { jobId } = req.params;

            const result = await analysisService.getJobStatus(jobId, userId);

            res.status(200).json(ApiResponse.success(result));
        } catch (err) { next(err); }
    }

    // GET /analysis/history
    async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.id;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;

            const { jobs, total } = await analysisService.getHistory(userId, page, limit);

            res.status(200).json(ApiResponse.paginated(jobs, total, page, limit));
        } catch (err) { next(err); }
    }

    // DELETE /analysis/:jobId/cancel
    async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.id;
            const { jobId } = req.params;

            const job = await analysisService.cancelJob(jobId, userId);

            res.status(200).json(ApiResponse.success(job, "Job cancelled"));
        } catch (err) { next(err); }
    }
}

export const analysisController = new AnalysisController();