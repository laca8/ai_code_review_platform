import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1781000169449 implements MigrationInterface {
    name = 'Init1781000169449'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."repositories_source_type_enum" AS ENUM('github', 'upload')`);
        await queryRunner.query(`CREATE TABLE "repositories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "full_name" character varying, "description" character varying, "github_repo_id" character varying, "clone_url" character varying, "default_branch" character varying NOT NULL DEFAULT 'main', "is_private" boolean NOT NULL DEFAULT false, "source_type" "public"."repositories_source_type_enum" NOT NULL DEFAULT 'github', "webhook_active" boolean NOT NULL DEFAULT false, "webhook_id" character varying, "webhook_secret" character varying, "last_analyzed_at" TIMESTAMP WITH TIME ZONE, "user_id" uuid NOT NULL, CONSTRAINT "UQ_1737947e7f09f3968cb93720f67" UNIQUE ("github_repo_id"), CONSTRAINT "PK_ef0c358c04b4f4d29b8ca68ddff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_01d0a80f46bb43811628f4174f" ON "repositories"  ("user_id") `);
        await queryRunner.query(`ALTER TABLE "repositories" ADD CONSTRAINT "FK_01d0a80f46bb43811628f4174f6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repositories" DROP CONSTRAINT "FK_01d0a80f46bb43811628f4174f6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01d0a80f46bb43811628f4174f"`);
        await queryRunner.query(`DROP TABLE "repositories"`);
        await queryRunner.query(`DROP TYPE "public"."repositories_source_type_enum"`);
    }

}
