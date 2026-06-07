import { IsEmail, IsOptional, IsString } from "class-validator";

export class GithubRegisterDto {
    @IsString()
    githubUserId!: string;

    @IsString()
    githubUsername!: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    fullName?: string;
}