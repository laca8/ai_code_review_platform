import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1781093638545 implements MigrationInterface {
    name = 'Init1781093638545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "issue_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "content" text NOT NULL, "issue_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_c650a2d6817045a0c8ce74f09f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5031938a085cb5bea6ed4eaeb5" ON "issue_comments"  ("issue_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_82241ad0bc78588595cdf7c574" ON "issue_comments"  ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."issues_category_enum" AS ENUM('bug', 'security', 'code_smell', 'performance', 'best_practice', 'refactoring')`);
        await queryRunner.query(`CREATE TYPE "public"."issues_severity_enum" AS ENUM('critical', 'high', 'medium', 'low', 'info')`);
        await queryRunner.query(`CREATE TABLE "issues" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "category" "public"."issues_category_enum" NOT NULL, "severity" "public"."issues_severity_enum" NOT NULL, "file_path" character varying NOT NULL, "line_start" integer NOT NULL, "line_end" character varying, "rule_id" character varying, "title" text NOT NULL, "description" text NOT NULL, "code_snippet" text, "suggestion" text, "confidence_score" double precision NOT NULL DEFAULT '1', "is_false_positive" boolean NOT NULL DEFAULT false, "report_id" uuid NOT NULL, CONSTRAINT "PK_9d8ecbbeff46229c700f0449257" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ed053abd3cb52b6e89650ca93a" ON "issues"  ("report_id") `);
        await queryRunner.query(`CREATE TABLE "analysis_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "bugs_count" integer NOT NULL DEFAULT '0', "security_count" integer NOT NULL DEFAULT '0', "code_smells_count" integer NOT NULL DEFAULT '0', "performance_count" integer NOT NULL DEFAULT '0', "best_practices_count" integer NOT NULL DEFAULT '0', "refactoring_count" integer NOT NULL DEFAULT '0', "overall_score" double precision NOT NULL DEFAULT '0', "security_score" double precision NOT NULL DEFAULT '0', "maintainability_score" double precision NOT NULL DEFAULT '0', "performance_score" double precision NOT NULL DEFAULT '0', "summary" jsonb, "job_id" uuid NOT NULL, "repository_id" uuid NOT NULL, CONSTRAINT "REL_a9f914c4fb5435ee4e0b551a59" UNIQUE ("job_id"), CONSTRAINT "PK_57fb44575f3a632424433c8edb4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a9f914c4fb5435ee4e0b551a59" ON "analysis_reports"  ("job_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0eacdf249411dd79d5ba96ef5d" ON "analysis_reports"  ("repository_id") `);
        await queryRunner.query(`CREATE TYPE "public"."analysis_jobs_status_enum" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled')`);
        await queryRunner.query(`CREATE TYPE "public"."analysis_jobs_triggered_by_enum" AS ENUM('manual', 'webhook', 'schedule')`);
        await queryRunner.query(`CREATE TABLE "analysis_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "commit_sha" character varying, "branch" character varying, "status" "public"."analysis_jobs_status_enum" NOT NULL DEFAULT 'pending', "triggered_by" "public"."analysis_jobs_triggered_by_enum" NOT NULL DEFAULT 'manual', "files_analyzed" integer NOT NULL DEFAULT '0', "total_issues" integer NOT NULL DEFAULT '0', "duration_ms" character varying, "error_message" text, "started_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "repository_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_ed5ebf2c133df30c3fb2f633836" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6f9d22b39e52b62a286ff17bd1" ON "analysis_jobs"  ("repository_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_839a130dd1268940e2df4e2cef" ON "analysis_jobs"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" text NOT NULL, "entity_type" character varying, "entity_id" character varying, "metadata" jsonb, "ip_address" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bd2726fd31b35443f2245b93ba" ON "audit_logs"  ("user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."user_plan_enum" AS ENUM('free', 'pro', 'team')`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'cancelled', 'past_due', 'trialing')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "plan" "public"."user_plan_enum" NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'active', "repos_limit" integer NOT NULL DEFAULT '1', "analyses_per_month" integer NOT NULL DEFAULT '5', "analyses_used" integer NOT NULL DEFAULT '0', "current_period_start" TIMESTAMP WITH TIME ZONE, "current_period_end" TIMESTAMP WITH TIME ZONE, "stripe_customer_id" character varying, "stripe_subscription_id" character varying, "user_id" uuid NOT NULL, CONSTRAINT "REL_d0a95ef8a28188364c546eb65c" UNIQUE ("user_id"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d0a95ef8a28188364c546eb65c" ON "subscriptions"  ("user_id") `);
        await queryRunner.query(`ALTER TABLE "issue_comments" ADD CONSTRAINT "FK_5031938a085cb5bea6ed4eaeb53" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issue_comments" ADD CONSTRAINT "FK_82241ad0bc78588595cdf7c5748" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "issues" ADD CONSTRAINT "FK_ed053abd3cb52b6e89650ca93ac" FOREIGN KEY ("report_id") REFERENCES "analysis_reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "analysis_reports" ADD CONSTRAINT "FK_a9f914c4fb5435ee4e0b551a594" FOREIGN KEY ("job_id") REFERENCES "analysis_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "analysis_reports" ADD CONSTRAINT "FK_0eacdf249411dd79d5ba96ef5d5" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "analysis_jobs" ADD CONSTRAINT "FK_6f9d22b39e52b62a286ff17bd16" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "analysis_jobs" ADD CONSTRAINT "FK_839a130dd1268940e2df4e2cef6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`);
        await queryRunner.query(`ALTER TABLE "analysis_jobs" DROP CONSTRAINT "FK_839a130dd1268940e2df4e2cef6"`);
        await queryRunner.query(`ALTER TABLE "analysis_jobs" DROP CONSTRAINT "FK_6f9d22b39e52b62a286ff17bd16"`);
        await queryRunner.query(`ALTER TABLE "analysis_reports" DROP CONSTRAINT "FK_0eacdf249411dd79d5ba96ef5d5"`);
        await queryRunner.query(`ALTER TABLE "analysis_reports" DROP CONSTRAINT "FK_a9f914c4fb5435ee4e0b551a594"`);
        await queryRunner.query(`ALTER TABLE "issues" DROP CONSTRAINT "FK_ed053abd3cb52b6e89650ca93ac"`);
        await queryRunner.query(`ALTER TABLE "issue_comments" DROP CONSTRAINT "FK_82241ad0bc78588595cdf7c5748"`);
        await queryRunner.query(`ALTER TABLE "issue_comments" DROP CONSTRAINT "FK_5031938a085cb5bea6ed4eaeb53"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d0a95ef8a28188364c546eb65c"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_plan_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bd2726fd31b35443f2245b93ba"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_839a130dd1268940e2df4e2cef"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6f9d22b39e52b62a286ff17bd1"`);
        await queryRunner.query(`DROP TABLE "analysis_jobs"`);
        await queryRunner.query(`DROP TYPE "public"."analysis_jobs_triggered_by_enum"`);
        await queryRunner.query(`DROP TYPE "public"."analysis_jobs_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0eacdf249411dd79d5ba96ef5d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a9f914c4fb5435ee4e0b551a59"`);
        await queryRunner.query(`DROP TABLE "analysis_reports"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ed053abd3cb52b6e89650ca93a"`);
        await queryRunner.query(`DROP TABLE "issues"`);
        await queryRunner.query(`DROP TYPE "public"."issues_severity_enum"`);
        await queryRunner.query(`DROP TYPE "public"."issues_category_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_82241ad0bc78588595cdf7c574"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5031938a085cb5bea6ed4eaeb5"`);
        await queryRunner.query(`DROP TABLE "issue_comments"`);
    }

}
