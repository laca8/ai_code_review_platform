import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Base } from "./Base";
import { Issue } from "./Issue";
import { User } from "./User";

@Entity("issue_comments")
export class IssueComment extends Base {
    @Column({ type: "text" })
    content!: string;

    // ── FKs ───────────────────────────────────────────────────────────────────
    @Index()
    @Column({ name: "issue_id" })
    issueId!: string;

    @ManyToOne(() => Issue, (issue) => issue.comments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "issue_id" })
    issue!: Issue;

    @Index()
    @Column({ name: "user_id" })
    userId!: string;

    @ManyToOne(() => User, (user) => user.issueComments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;
}