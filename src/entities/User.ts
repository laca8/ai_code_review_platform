import { Column, Entity, OneToMany, OneToOne } from 'typeorm'

import { Base } from './Base'
import { Repository } from './Repository';
import { AnalysisJob } from './AnalysisJob';
import { IssueComment } from './IssueComment';
import { AuditLog } from './AuditLog';
import { Subscription } from './Subscription';

export enum UserRole {
    ADMIN = 'admin',
    DEVELOPER = 'developer'
}

export enum UserPlan {
    FREE = 'free',
    PRO = 'pro',
    TEAM = 'team'
}

@Entity('users')
export class User extends Base {
    @Column({ name: "full_name" })
    fullName!: string;

    @Column({ unique: true })
    email!: string;


    @Column({ name: "password", type: "varchar", nullable: true })
    password!: string | null;

    @Column({ type: "enum", enum: UserRole, default: UserRole.DEVELOPER })
    role!: UserRole;

    @Column({ type: "enum", enum: UserPlan, default: UserPlan.FREE })
    plan!: UserPlan;

    @Column({ name: "email_verified", default: false })
    emailVerified!: boolean;
    @Column({
        name: "email_verification_token",
        type: "varchar",
        nullable: true
    })
    emailVerificationToken!: string | null;

    @Column({
        name: "email_verification_expires",
        type: "timestamp",
        nullable: true
    })
    emailVerificationExpires!: Date | null;

    // ── GitHub OAuth ──────────────────────────────────────────────────────────
    @Column({ name: "github_user_id", type: "varchar", nullable: true })
    githubUserId!: string | null;

    @Column({ name: "github_username", type: "varchar", nullable: true })
    githubUsername!: string | null;

    @Column({ name: "github_access_token", type: "varchar", nullable: true })
    githubAccessToken!: string | null;    // store encrypted in production

    // ── Google OAuth ──────────────────────────────────────────────────────────
    @Column({ name: "google_user_id", type: "varchar", nullable: true })
    googleUserId!: string | null;


    // ── Relations ─────────────────────────────────────────────────────────────
    @OneToMany(() => Repository, (repo) => repo.user)
    repositories!: Repository[];

    @OneToMany(() => AnalysisJob, (job) => job.user)
    analysisJobs!: AnalysisJob[];

    @OneToMany(() => IssueComment, (comment) => comment.user)
    issueComments!: IssueComment[];


    @OneToOne(() => Subscription, (sub) => sub.user)
    subscription!: Subscription;

    @OneToMany(() => AuditLog, (log) => log.user)
    auditLogs!: AuditLog[];
}