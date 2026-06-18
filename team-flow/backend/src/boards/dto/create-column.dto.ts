import { IsString, IsOptional, IsInt, Min, IsIn } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsIn(['NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'IN_REVIEW', 'COMPLETED'])
  status: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
