import { IsString, IsOptional, IsNumber, IsInt, Min, IsBoolean, IsArray } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  maxUsers: number;

  @IsNumber()
  @Min(0)
  maxStorage: number;

  @IsInt()
  @Min(0)
  maxProjects: number;

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
