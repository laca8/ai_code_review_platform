import { Entity, Column, OneToOne, OneToMany, ManyToOne, JoinColumn, Index } from "typeorm";
import { Base } from "./Base";
import { AnalysisJob } from "./AnalysisJob";
import { Repository } from "./Repository";
import { Issue } from "./Issue";

@Entity("analysis_reports")
export class AnalysisReport extends Base {
    // ── Issue counts per category ─────────────────────────────────────────────
    @Column({ name: "bugs_count", default: 0 })
    bugsCount!: number;

    @Column({ name: "security_count", default: 0 })
    securityCount!: number;

    @Column({ name: "code_smells_count", default: 0 })
    codeSmellsCount!: number;

    @Column({ name: "performance_count", default: 0 })
    performanceCount!: number;

    @Column({ name: "best_practices_count", default: 0 })
    bestPracticesCount!: number;

    @Column({ name: "refactoring_count", default: 0 })
    refactoringCount!: number;

    // ── Scores (0–100) ────────────────────────────────────────────────────────
    @Column({ name: "overall_score", type: "float", default: 0 })
    overallScore!: number;

    @Column({ name: "security_score", type: "float", default: 0 })
    securityScore!: number;

    @Column({ name: "maintainability_score", type: "float", default: 0 })
    maintainabilityScore!: number;

    @Column({ name: "performance_score", type: "float", default: 0 })
    performanceScore!: number;

    // ── AI-generated summary ──────────────────────────────────────────────────
    @Column({ type: "jsonb", nullable: true })
    summary!: {
        overview: string;
        criticalIssues: string[];
        topSuggestions: string[];
    } | null;

    // ── FKs ───────────────────────────────────────────────────────────────────
    @Index()
    @Column({ name: "job_id" })
    jobId!: string;

    @OneToOne(() => AnalysisJob, (job) => job.report, { onDelete: "CASCADE" })
    @JoinColumn({ name: "job_id" })
    job!: AnalysisJob;

    @Index()
    @Column({ name: "repository_id" })
    repositoryId!: string;

    @ManyToOne(() => Repository, { onDelete: "CASCADE" })
    @JoinColumn({ name: "repository_id" })
    repository!: Repository;

    // ── Relations ─────────────────────────────────────────────────────────────
    @OneToMany(() => Issue, (issue) => issue.report)
    issues!: Issue[];
}