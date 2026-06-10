import { Entity, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from "typeorm";
import { PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

// AuditLog is insert-only — no updatedAt needed, so we skip Base
@Entity("audit_logs")
export class AuditLog {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text" })
    action!: string;                      // e.g. "analysis.started", "user.login"

    @Column({ name: "entity_type", nullable: true, type: 'varchar' })
    entityType!: string | null;           // e.g. "AnalysisJob", "Repository"

    @Column({ name: "entity_id", nullable: true, type: 'varchar' })
    entityId!: string | null;

    @Column({ type: "jsonb", nullable: true })
    metadata!: Record<string, unknown> | null;

    @Column({ name: "ip_address", nullable: true, type: 'varchar' })
    ipAddress!: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    // ── FK ────────────────────────────────────────────────────────────────────
    @Index()
    @Column({ name: "user_id", nullable: true, type: 'varchar' })
    userId!: string | null;              // nullable for system-triggered actions

    @ManyToOne(() => User, (user) => user.auditLogs, { onDelete: "SET NULL", nullable: true })
    @JoinColumn({ name: "user_id" })
    user!: User | null;
}