import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from "typeorm";
import { Base } from "./Base";
import { User } from "./User";


export enum SourceType {
    GITHUB = "github",
    UPLOAD = "upload",
}

@Entity("repositories")
export class Repository extends Base {
    @Column()
    name!: string;

    @Column({ name: "full_name", nullable: true, type: 'varchar' })
    fullName!: string | null;             // e.g. "username/repo-name"

    @Column({ nullable: true, type: 'varchar' })
    description!: string | null;

    @Column({ name: "github_repo_id", nullable: true, unique: true, type: 'varchar' })
    githubRepoId!: string | null;

    @Column({ name: "clone_url", nullable: true, type: 'varchar' })
    cloneUrl!: string | null;

    @Column({ name: "default_branch", default: "main" })
    defaultBranch!: string;

    @Column({ name: "is_private", default: false })
    isPrivate!: boolean;

    @Column({ type: "enum", enum: SourceType, name: "source_type", default: SourceType.GITHUB })
    sourceType!: SourceType;

    @Column({ name: "webhook_active", default: false })
    webhookActive!: boolean;

    @Column({ name: "webhook_id", nullable: true, type: 'varchar' })
    webhookId!: string | null;

    @Column({ name: "webhook_secret", nullable: true, type: 'varchar' })
    webhookSecret!: string | null;

    @Column({ name: "last_analyzed_at", nullable: true, type: "timestamptz" })
    lastAnalyzedAt!: Date | null;

    // ── FK ────────────────────────────────────────────────────────────────────
    @Index()
    @Column({ name: "user_id" })
    userId!: string;

    @ManyToOne(() => User, (user) => user.repositories, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;


}