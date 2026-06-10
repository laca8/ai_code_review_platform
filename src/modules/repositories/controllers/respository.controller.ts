import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../../config/database";
import { Repository } from "../../../entities/Repository";
import { User } from "../../../entities/User";
import { RepositoriesService } from "../services/repository.service";
import { GitHubApiService } from "../services/github.service";
import { ApiResponse } from "../../../common/response/ApiResponse";

const repoRepo = AppDataSource.getRepository(Repository);
const userRepo = AppDataSource.getRepository(User);
const githubApi = new GitHubApiService();
const reposService = new RepositoriesService(repoRepo, userRepo, githubApi);

export class RepositoriesController {

    // POST /repositories
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req.user as any)?.id;
            const result = await reposService.create(userId, req.body);
            res.status(201).json(ApiResponse.created(result));
        } catch (err) { next(err); }
    }

    // GET /repositories
    async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req.user as any)?.id;
            const result = await reposService.findAll(userId);
            res.status(200).json(ApiResponse.success(result));
        } catch (err) { next(err); }
    }

    // GET /repositories/:id
    async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req.user as any)?.id;

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await reposService.findOne(String(id), userId);
            res.status(200).json(ApiResponse.success(result));
        } catch (err) { next(err); }
    }

    // DELETE /repositories/:id
    async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req.user as any)?.id;

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            await reposService.remove(String(id), userId);
            res.status(200).json(ApiResponse.success(null, "Repository removed successfully"));
        } catch (err) { next(err); }
    }

    // GET /repositories/github/list  → repos from GitHub API
    async listGithubRepos(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req.user as any)?.id;

            const result = await reposService.listGithubRepos(userId);
            res.status(200).json(ApiResponse.success(result));
        } catch (err) { next(err); }
    }

    // POST /repositories/:id/webhook/enable
    async enableWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req.user as any)?.id;

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await reposService.enableWebhook(String(id), userId);
            res.status(200).json(ApiResponse.success(result, "Webhook enabled successfully"));
        } catch (err) { next(err); }
    }

    // POST /repositories/:id/webhook/disable
    async disableWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req.user as any)?.id;

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await reposService.disableWebhook(String(id), userId);
            res.status(200).json(ApiResponse.success(result, "Webhook disabled successfully"));
        } catch (err) { next(err); }
    }

    // POST /repositories/webhook  → incoming webhook from GitHub
    async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req.user as any)?.id;

            const signature = req.headers["x-hub-signature-256"] as string;
            const repoFullName = req.body?.repository?.full_name;


            if (!signature || !repoFullName) {
                res.status(400).json({ message: "Invalid webhook payload" });
                return;
            }

            const result = await reposService.handleWebhook(req.body, signature, repoFullName);
            res.status(200).json(result);
        } catch (err) { next(err); }
    }
}

export const repositoriesController = new RepositoriesController();