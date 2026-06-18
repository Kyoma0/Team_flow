import { IsString, IsOptional, IsArray, ValidateNested, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class CreateColumnDto {
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

export class CreateBoardDto {
  @IsString()
  name: string;

  @IsString()
  projectId: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateColumnDto)
  columns?: CreateColumnDto[];
}
