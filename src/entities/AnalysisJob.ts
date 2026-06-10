import { Entity, Column, ManyToOne, OneToOne, JoinColumn, Index } from "typeorm";
import { Base } from "./Base";
import { User } from "./User";
import { Repository } from "./Repository";
import { AnalysisReport } from "./AnalysisReport";

export enum JobStatus {
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
}

export enum TriggerSource {
    MANUAL = "manual",
    WEBHOOK = "webhook",
    SCHEDULE = "schedule",
}

@Entity("analysis_jobs")
export class AnalysisJob extends Base {
    @Column({ name: "commit_sha", nullable: true, type: 'varchar' })
    commitSha!: string | null;

    @Column({ nullable: true, type: 'varchar' })
    branch!: string | null;

    @Column({ type: "enum", enum: JobStatus, default: JobStatus.PENDING })
    status!: JobStatus;

    @Column({ type: "enum", enum: TriggerSource, name: "triggered_by", default: TriggerSource.MANUAL })
    triggeredBy!: TriggerSource;

    @Column({ name: "files_analyzed", default: 0 })
    filesAnalyzed!: number;

    @Column({ name: "total_issues", default: 0 })
    totalIssues!: number;

    @Column({ name: "duration_ms", nullable: true, type: 'varchar' })
    durationMs!: number | null;

    @Column({ name: "error_message", nullable: true, type: "text" })
    errorMessage!: string | null;

    @Column({ name: "started_at", nullable: true, type: "timestamptz" })
    startedAt!: Date | null;

    @Column({ name: "completed_at", nullable: true, type: "timestamptz" })
    completedAt!: Date | null;

    // ── FKs ───────────────────────────────────────────────────────────────────
    @Index()
    @Column({ name: "repository_id" })
    repositoryId!: string;

    @ManyToOne(() => Repository, (repo) => repo.analysisJobs, { onDelete: "CASCADE" })
    @JoinColumn({ name: "repository_id" })
    repository!: Repository;

    @Index()
    @Column({ name: "user_id" })
    userId!: string;

    @ManyToOne(() => User, (user) => user.analysisJobs, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    // ── Relations ─────────────────────────────────────────────────────────────
    @OneToOne(() => AnalysisReport, (report) => report.job)
    report!: AnalysisReport;
}