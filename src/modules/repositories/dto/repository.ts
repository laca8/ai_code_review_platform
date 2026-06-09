import { IsString, IsOptional, IsBoolean, IsEnum } from "class-validator";
import { SourceType } from "../../../entities/Repository";

export class CreateRepositoryDto {
    @IsString()
    name!: string;

    @IsEnum(SourceType)
    sourceType!: SourceType;

    // ── GitHub source ─────────────────────────────────────────────────────────
    @IsOptional()
    @IsString()
    githubRepoId?: string;

    @IsOptional()
    @IsString()
    fullName?: string;              // "username/repo-name"

    @IsOptional()
    @IsString()
    cloneUrl?: string;

    @IsOptional()
    @IsString()
    defaultBranch?: string;

    @IsOptional()
    @IsBoolean()
    isPrivate?: boolean;

    @IsOptional()
    @IsString()
    description?: string;
}