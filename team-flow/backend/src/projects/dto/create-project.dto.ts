import { IsString, IsOptional, IsDateString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  name: string;

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
  clientId?: string;
}
