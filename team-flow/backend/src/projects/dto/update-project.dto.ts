import { IsString, IsOptional, IsDateString, MinLength, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

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
  @Transform(({ value }) => value || undefined)
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value || undefined)
  endDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'COMPLETED', 'ARCHIVED'])
  status?: string;

  @IsOptional()
  @IsString()
  clientId?: string;
}
