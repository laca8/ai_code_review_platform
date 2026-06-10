import Bull from "bull";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import Anthropic from "@anthropic-ai/sdk";
import { AppDataSource } from "../../../config/database";
import { AnalysisJob, JobStatus } from "../../../entities/AnalysisJob";
import { AnalysisReport } from "../../../entities/AnalysisReport";
import { Issue, IssueCategory, IssueSeverity } from "../../../entities/Issue";
import { Repository } from "../../../entities/Repository";
import { analysisQueue, AnalysisJobData } from "../queue/analysis.queue";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── File extensions to analyze ────────────────────────────────────────────────
const SUPPORTED_EXTENSIONS = [
    ".ts", ".tsx", ".js", ".jsx",
    ".py", ".java", ".go", ".rb",
    ".php", ".cs", ".cpp", ".c",
];

const MAX_FILE_SIZE_BYTES = 50_000; // skip files over 50kb
const MAX_FILES = 50;     // max files per analysis

// ── Main processor ────────────────────────────────────────────────────────────
export const registerAnalysisProcessor = (): void => {
    analysisQueue.process(3, async (job: Bull.Job<AnalysisJobData>) => {
        const { jobId, cloneUrl, branch, repositoryId } = job.data;

        const jobRepo = AppDataSource.getRepository(AnalysisJob);
        const reportRepo = AppDataSource.getRepository(AnalysisReport);
        const issueRepo = AppDataSource.getRepository(Issue);
        const repoRepo = AppDataSource.getRepository(Repository);

        const analysisJob = await jobRepo.findOne({ where: { id: jobId } });
        if (!analysisJob) throw new Error(`AnalysisJob ${jobId} not found`);

        const startedAt = new Date();
        const tmpDir = path.join("/tmp", `analysis_${jobId}`);

        try {
            // ── 1. Mark as running ────────────────────────────────────────────────
            analysisJob.status = JobStatus.RUNNING;
            analysisJob.startedAt = startedAt;
            await jobRepo.save(analysisJob);
            await job.progress(5);

            // ── 2. Clone repo ─────────────────────────────────────────────────────
            execSync(`git clone --depth=1 --branch=${branch} ${cloneUrl} ${tmpDir}`, {
                timeout: 60_000,
                stdio: "pipe",
            });
            await job.progress(20);

            // ── 3. Collect files ──────────────────────────────────────────────────
            const files = collectFiles(tmpDir);
            await job.progress(30);

            // ── 4. Analyze each file with Claude ─────────────────────────────────
            const allIssues: Omit<Issue, "id" | "createdAt" | "updatedAt" | "report" | "comments">[] = [];
            let filesAnalyzed = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const content = fs.readFileSync(file, "utf-8");
                const relPath = file.replace(tmpDir + "/", "");

                const fileIssues = await analyzeFile(relPath, content);
                allIssues.push(...fileIssues);
                filesAnalyzed++;

                // update progress 30% → 85%
                await job.progress(30 + Math.floor((i / files.length) * 55));
            }

            await job.progress(88);

            // ── 5. Save report ────────────────────────────────────────────────────
            const counts = countByCategory(allIssues);
            const scores = calculateScores(allIssues);

            const report = reportRepo.create({
                jobId: jobId,
                repositoryId,
                bugsCount: counts.bug,
                securityCount: counts.security,
                codeSmellsCount: counts.code_smell,
                performanceCount: counts.performance,
                bestPracticesCount: counts.best_practice,
                refactoringCount: counts.refactoring,
                overallScore: scores.overall,
                securityScore: scores.security,
                maintainabilityScore: scores.maintainability,
                performanceScore: scores.performance,
                summary: {
                    overview: `Analyzed ${filesAnalyzed} files. Found ${allIssues.length} issues.`,
                    criticalIssues: allIssues.filter(i => i.severity === IssueSeverity.CRITICAL).map(i => i.title),
                    topSuggestions: allIssues.slice(0, 3).map(i => i.suggestion ?? i.title),
                },
            });

            const savedReport = await reportRepo.save(report);

            // ── 6. Save issues ────────────────────────────────────────────────────
            if (allIssues.length > 0) {
                const issueEntities = allIssues.map(issue =>
                    issueRepo.create({ ...issue, reportId: savedReport.id })
                );
                await issueRepo.save(issueEntities);
            }

            await job.progress(95);

            // ── 7. Mark job as completed ──────────────────────────────────────────
            const completedAt = new Date();
            analysisJob.status = JobStatus.COMPLETED;
            analysisJob.completedAt = completedAt;
            analysisJob.durationMs = completedAt.getTime() - startedAt.getTime();
            analysisJob.filesAnalyzed = filesAnalyzed;
            analysisJob.totalIssues = allIssues.length;
            await jobRepo.save(analysisJob);

            // update repo last analyzed
            await repoRepo.update(repositoryId, { lastAnalyzedAt: completedAt });

            await job.progress(100);

        } catch (err: any) {
            // ── Mark job as failed ────────────────────────────────────────────────
            analysisJob.status = JobStatus.FAILED;
            analysisJob.errorMessage = err.message;
            analysisJob.completedAt = new Date();
            await jobRepo.save(analysisJob);
            throw err;

        } finally {
            // ── Cleanup cloned repo ───────────────────────────────────────────────
            if (fs.existsSync(tmpDir)) {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        }
    });

    // ── Queue event listeners ─────────────────────────────────────────────────
    analysisQueue.on("failed", (job, err) => {
        console.error(`[Analysis Queue] Job ${job.id} failed:`, err.message);
    });

    analysisQueue.on("completed", (job) => {
        console.log(`[Analysis Queue] Job ${job.id} completed`);
    });

    console.log("[Analysis Queue] Processor registered (concurrency: 3)");
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function collectFiles(dir: string): string[] {
    const results: string[] = [];

    const walk = (current: string) => {
        if (results.length >= MAX_FILES) return;

        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            if (["node_modules", ".git", "dist", "build", ".next"].includes(entry.name)) continue;

            const fullPath = path.join(current, entry.name);

            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                const size = fs.statSync(fullPath).size;
                if (SUPPORTED_EXTENSIONS.includes(ext) && size <= MAX_FILE_SIZE_BYTES) {
                    results.push(fullPath);
                }
            }
        }
    };

    walk(dir);
    return results;
}

async function analyzeFile(
    filePath: string,
    content: string
): Promise<Omit<Issue, "id" | "createdAt" | "updatedAt" | "report" | "comments" | "reportId">[]> {
    try {
        const response = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            messages: [{
                role: "user",
                content: `You are an expert code reviewer. Analyze this file and return a JSON array of issues.

File: ${filePath}

\`\`\`
${content.slice(0, 8000)}
\`\`\`

Return ONLY a valid JSON array (no markdown, no explanation) with this exact shape:
[
  {
    "category": "bug" | "security" | "code_smell" | "performance" | "best_practice" | "refactoring",
    "severity": "critical" | "high" | "medium" | "low" | "info",
    "lineStart": number,
    "lineEnd": number | null,
    "ruleId": string | null,
    "title": string,
    "description": string,
    "codeSnippet": string | null,
    "suggestion": string | null,
    "confidenceScore": number (0-1)
  }
]

If no issues found, return an empty array [].`,
            }],
        });

        const text = response.content[0].type === "text" ? response.content[0].text : "[]";
        const parsed = JSON.parse(text.trim());

        return parsed.map((issue: any) => ({
            category: issue.category as IssueCategory,
            severity: issue.severity as IssueSeverity,
            filePath,
            lineStart: issue.lineStart ?? 1,
            lineEnd: issue.lineEnd ?? null,
            ruleId: issue.ruleId ?? null,
            title: issue.title,
            description: issue.description,
            codeSnippet: issue.codeSnippet ?? null,
            suggestion: issue.suggestion ?? null,
            confidenceScore: issue.confidenceScore ?? 0.8,
            isFalsePositive: false,
        }));

    } catch {
        return []; // don't fail the whole job for one file
    }
}

function countByCategory(issues: any[]): Record<string, number> {
    const counts: Record<string, number> = {
        bug: 0, security: 0, code_smell: 0,
        performance: 0, best_practice: 0, refactoring: 0,
    };
    for (const issue of issues) counts[issue.category] = (counts[issue.category] ?? 0) + 1;
    return counts;
}

function calculateScores(issues: any[]): Record<string, number> {
    const severityWeight: Record<string, number> = {
        critical: 20, high: 10, medium: 5, low: 2, info: 0,
    };

    const totalPenalty = issues.reduce((sum, i) => sum + (severityWeight[i.severity] ?? 0), 0);

    const securityPenalty = issues
        .filter(i => i.category === "security")
        .reduce((sum, i) => sum + (severityWeight[i.severity] ?? 0), 0);

    const perfPenalty = issues
        .filter(i => i.category === "performance")
        .reduce((sum, i) => sum + (severityWeight[i.severity] ?? 0), 0);

    const clamp = (n: number) => Math.max(0, Math.min(100, n));

    return {
        overall: clamp(100 - totalPenalty),
        security: clamp(100 - securityPenalty * 2),
        maintainability: clamp(100 - totalPenalty * 0.8),
        performance: clamp(100 - perfPenalty * 1.5),
    };
}