import { IsString, IsOptional } from 'class-validator';

export class AddMemberDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  username?: string;
}
