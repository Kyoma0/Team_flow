import { IsString, IsOptional, IsDateString, MinLength, IsIn } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'COMPLETED', 'ARCHIVED'])
  status?: string;

  @IsOptional()
  @IsString()
  clientId?: string;
}
