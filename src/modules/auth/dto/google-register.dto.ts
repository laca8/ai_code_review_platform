import { IsEmail, IsOptional, IsString } from "class-validator";

export class GoogleRegisterDto {
    @IsString()
    googleUserId!: string;

    @IsEmail()
    email!: string;

    @IsOptional()
    @IsString()
    fullName?: string;
}