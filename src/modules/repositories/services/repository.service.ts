import { Repository as TypeOrmRepo } from "typeorm";
import { Repository, SourceType } from "../../../entities/Repository";
import { User } from "../../../entities/User";
import { CreateRepositoryDto } from "../dto/repository";
import { AppError } from "../../../common/errors/AppError";
import { GitHubApiService } from "./github.service";
import crypto from "crypto";

export class RepositoriesService {
    constructor(
        private readonly repoRepo: TypeOrmRepo<Repository>,
        private readonly userRepo: TypeOrmRepo<User>,
        private readonly githubApi: GitHubApiService
    ) { }

    // ── Create ─────────────────────────────────────────────────────────────────
    async create(userId: string, data: CreateRepositoryDto): Promise<Repository> {

        // check plan limit
        const count = await this.repoRepo.count({ where: { userId } });
        const user = await this.userRepo.findOne({ where: { id: userId } });

        if (!user) throw AppError.notFound("User");

        const limits: Record<string, number> = { free: 1, pro: 5, team: Infinity };
        if (count >= limits[user.plan]) {
            throw AppError.planLimitExceeded(
                `Your ${user.plan} plan allows up to ${limits[user.plan]} repositories. Please upgrade.`
            );
        }

        // prevent duplicate github repo
        if (data.githubRepoId) {
            const exists = await this.repoRepo.findOne({
                where: { githubRepoId: data.githubRepoId, userId },
            });
            if (exists) throw AppError.alreadyExists("Repository");
        }

        const repository = this.repoRepo.create({
            ...data,
            userId,
            defaultBranch: data.defaultBranch ?? "main",
        });

        return this.repoRepo.save(repository);
    }

    // ── List user repos ────────────────────────────────────────────────────────
    async findAll(userId: string): Promise<Repository[]> {
        return this.repoRepo.find({
            where: { userId },
            order: { createdAt: "DESC" },
        });
    }

    // ── Get one ────────────────────────────────────────────────────────────────
    async findOne(id: string, userId: string): Promise<Repository> {
        const repo = await this.repoRepo.findOne({ where: { id, userId } });
        if (!repo) throw AppError.notFound("Repository");
        return repo;
    }

    // ── Delete ─────────────────────────────────────────────────────────────────
    async remove(id: string, userId: string): Promise<void> {
        const repo = await this.findOne(id, userId);

        // remove webhook from GitHub before deleting
        if (repo.webhookActive && repo.webhookId && repo.sourceType === SourceType.GITHUB) {
            const user = await this.userRepo.findOne({ where: { id: userId } });
            if (user?.githubAccessToken) {
                await this.githubApi.deleteWebhook(
                    repo.fullName!,
                    repo.webhookId,
                    user.githubAccessToken
                ).catch(() => { }); // don't fail if GitHub call fails
            }
        }

        await this.repoRepo.remove(repo);
    }

    // ── List GitHub repos from GitHub API ─────────────────────────────────────
    async listGithubRepos(userId: string): Promise<object[]> {
        const user = await this.userRepo.findOne({ where: { id: userId } });

        if (!user) throw AppError.notFound("User");
        if (!user.githubAccessToken) {
            throw AppError.badRequest("GitHub account not connected");
        }

        return this.githubApi.listUserRepos(user.githubAccessToken);
    }

    // ── Enable webhook ─────────────────────────────────────────────────────────
    async enableWebhook(id: string, userId: string): Promise<Repository> {
        const repo = await this.findOne(id, userId);

        if (repo.sourceType !== SourceType.GITHUB) {
            throw AppError.badRequest("Webhooks are only supported for GitHub repositories");
        }

        if (repo.webhookActive) {
            throw AppError.conflict("Webhook is already active for this repository");
        }

        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user?.githubAccessToken) {
            throw AppError.badRequest("GitHub account not connected");
        }

        const webhookSecret = crypto.randomBytes(32).toString("hex");
        const webhookUrl = `${process.env.APP_URL}/api/v1/repositories/webhook`;

        const { id: webhookId } = await this.githubApi.createWebhook(
            repo.fullName!,
            webhookUrl,
            webhookSecret,
            user.githubAccessToken
        );

        repo.webhookActive = true;
        repo.webhookId = String(webhookId);
        repo.webhookSecret = webhookSecret;

        return this.repoRepo.save(repo);
    }

    // ── Disable webhook ────────────────────────────────────────────────────────
    async disableWebhook(id: string, userId: string): Promise<Repository> {
        const repo = await this.findOne(id, userId);

        if (!repo.webhookActive || !repo.webhookId) {
            throw AppError.badRequest("Webhook is not active");
        }

        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (user?.githubAccessToken) {
            await this.githubApi.deleteWebhook(
                repo.fullName!,
                repo.webhookId,
                user.githubAccessToken
            ).catch(() => { });
        }

        repo.webhookActive = false;
        repo.webhookId = null;
        repo.webhookSecret = null;

        return this.repoRepo.save(repo);
    }

    // ── Handle incoming GitHub webhook ────────────────────────────────────────
    async handleWebhook(
        payload: any,
        signature: string,
        repoFullName: string
    ): Promise<{ message: string }> {

        const repo = await this.repoRepo.findOne({
            where: { fullName: repoFullName, webhookActive: true },
        });

        if (!repo || !repo.webhookSecret) {
            throw AppError.notFound("Repository");
        }

        // verify HMAC signature
        const expected = "sha256=" + crypto
            .createHmac("sha256", repo.webhookSecret)
            .update(JSON.stringify(payload))
            .digest("hex");

        if (signature !== expected) {
            throw AppError.unauthorized("Invalid webhook signature");
        }

        // only trigger analysis on push to default branch
        const isPushToDefault =
            payload.ref === `refs/heads/${repo.defaultBranch}`;

        if (!isPushToDefault) {
            return { message: "Ignored: not a push to default branch" };
        }

        // TODO: dispatch analysis job (Analysis Module)
        console.log(`[Webhook] Push detected on ${repo.fullName} — queuing analysis job`);

        return { message: "Webhook received. Analysis job queued." };
    }
}