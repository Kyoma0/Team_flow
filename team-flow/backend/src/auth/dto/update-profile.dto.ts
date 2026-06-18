import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,30}$/, { message: 'Username deve ter 3-30 caracteres (letras, números, _)' })
  username?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
