import { Entity, Column, OneToOne, JoinColumn, Index } from "typeorm";
import { Base } from "./Base";
import { User } from "./User";


export enum SubscriptionStatus {
    ACTIVE = "active",
    CANCELLED = "cancelled",
    PAST_DUE = "past_due",
    TRIALING = "trialing",
}
export enum UserPlan {
    FREE = 'free',
    PRO = 'pro',
    TEAM = 'team'
}
console.log("UserPlan =", UserPlan);
console.log("SubscriptionStatus =", SubscriptionStatus);
@Entity("subscriptions")
export class Subscription extends Base {
    @Column({ type: "enum", enum: UserPlan, enumName: "user_plan_enum", })
    plan!: UserPlan;

    @Column({ type: "enum", enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
    status!: SubscriptionStatus;

    // ── Limits ────────────────────────────────────────────────────────────────
    @Column({ name: "repos_limit", default: 1 })
    reposLimit!: number;

    @Column({ name: "analyses_per_month", default: 5 })
    analysesPerMonth!: number;

    @Column({ name: "analyses_used", default: 0 })
    analysesUsed!: number;

    // ── Billing period ────────────────────────────────────────────────────────
    @Column({ name: "current_period_start", type: "timestamptz", nullable: true })
    currentPeriodStart!: Date | null;

    @Column({ name: "current_period_end", type: "timestamptz", nullable: true })
    currentPeriodEnd!: Date | null;

    // ── Stripe ────────────────────────────────────────────────────────────────
    @Column({ name: "stripe_customer_id", nullable: true, type: 'varchar' })
    stripeCustomerId!: string | null;

    @Column({ name: "stripe_subscription_id", nullable: true, type: 'varchar' })
    stripeSubscriptionId!: string | null;

    // ── FK ────────────────────────────────────────────────────────────────────
    @Index()
    @Column({ name: "user_id" })
    userId!: string;

    @OneToOne(() => User, (user) => user.subscription, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;
}