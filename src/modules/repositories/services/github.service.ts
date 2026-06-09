import axios from "axios";
import { AppError } from "../../../common/errors/AppError";

const GITHUB_API = "https://api.github.com";

export class GitHubApiService {

    private headers(token: string) {
        return {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        };
    }

    // ── List user repos ────────────────────────────────────────────────────────
    async listUserRepos(accessToken: string): Promise<object[]> {
        try {
            const { data } = await axios.get(`${GITHUB_API}/user/repos`, {
                headers: this.headers(accessToken),
                params: { per_page: 100, sort: "updated", affiliation: "owner" },
            });

            return data.map((r: any) => ({
                githubRepoId: String(r.id),
                name: r.name,
                fullName: r.full_name,
                description: r.description,
                cloneUrl: r.clone_url,
                defaultBranch: r.default_branch,
                isPrivate: r.private,
                language: r.language,
                updatedAt: r.updated_at,
            }));
        } catch (err: any) {
            throw AppError.badRequest(`GitHub API error: ${err.message}`);
        }
    }

    // ── Create webhook ─────────────────────────────────────────────────────────
    async createWebhook(
        fullName: string,   // "username/repo"
        webhookUrl: string,
        webhookSecret: string,
        accessToken: string
    ): Promise<{ id: number }> {
        try {
            const { data } = await axios.post(
                `${GITHUB_API}/repos/${fullName}/hooks`,
                {
                    name: "web",
                    active: true,
                    events: ["push", "pull_request"],
                    config: {
                        url: webhookUrl,
                        content_type: "json",
                        secret: webhookSecret,
                        insecure_ssl: "0",
                    },
                },
                { headers: this.headers(accessToken) }
            );

            return { id: data.id };
        } catch (err: any) {
            if (err.response?.status === 422) {
                throw AppError.conflict("Webhook already exists on this repository");
            }
            throw AppError.badRequest(`Failed to create webhook: ${err.message}`);
        }
    }

    // ── Delete webhook ─────────────────────────────────────────────────────────
    async deleteWebhook(
        fullName: string,
        webhookId: string,
        accessToken: string
    ): Promise<void> {
        try {
            await axios.delete(
                `${GITHUB_API}/repos/${fullName}/hooks/${webhookId}`,
                { headers: this.headers(accessToken) }
            );
        } catch (err: any) {
            // 404 means already deleted — ignore
            if (err.response?.status !== 404) {
                throw AppError.badRequest(`Failed to delete webhook: ${err.message}`);
            }
        }
    }
}

export const githubApiService = new GitHubApiService();