import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from "typeorm";
import { Base } from "./Base";
import { AnalysisReport } from "./AnalysisReport";
import { IssueComment } from "./IssueComment";

export enum IssueCategory {
    BUG = "bug",
    SECURITY = "security",
    CODE_SMELL = "code_smell",
    PERFORMANCE = "performance",
    BEST_PRACTICE = "best_practice",
    REFACTORING = "refactoring",
}

export enum IssueSeverity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    INFO = "info",
}

@Entity("issues")
export class Issue extends Base {
    @Column({ type: "enum", enum: IssueCategory })
    category!: IssueCategory;

    @Column({ type: "enum", enum: IssueSeverity })
    severity!: IssueSeverity;

    @Column({ name: "file_path" })
    filePath!: string;

    @Column({ name: "line_start" })
    lineStart!: number;

    @Column({ name: "line_end", nullable: true, type: 'varchar' })
    lineEnd!: number | null;

    @Column({ name: "rule_id", nullable: true, type: 'varchar' })
    ruleId!: string | null;               // e.g. "no-unused-vars", "sql-injection"

    @Column({ type: "text" })
    title!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ name: "code_snippet", type: "text", nullable: true })
    codeSnippet!: string | null;          // the problematic code

    @Column({ type: "text", nullable: true })
    suggestion!: string | null;           // the fixed code

    @Column({ name: "confidence_score", type: "float", default: 1 })
    confidenceScore!: number;             // 0–1, set by AI

    @Column({ name: "is_false_positive", default: false })
    isFalsePositive!: boolean;

    // ── FK ────────────────────────────────────────────────────────────────────
    @Index()
    @Column({ name: "report_id" })
    reportId!: string;

    @ManyToOne(() => AnalysisReport, (report) => report.issues, { onDelete: "CASCADE" })
    @JoinColumn({ name: "report_id" })
    report!: AnalysisReport;

    // ── Relations ─────────────────────────────────────────────────────────────
    @OneToMany(() => IssueComment, (comment) => comment.issue)
    comments!: IssueComment[];
}