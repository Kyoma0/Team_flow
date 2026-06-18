import { IsString, IsOptional, IsNumber, IsInt, Min, IsBoolean, IsArray } from 'class-validator';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStorage?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxProjects?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMonthly?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceYearly?: number;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
