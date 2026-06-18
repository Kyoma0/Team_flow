import { IsString, IsOptional, IsIn, IsDateString, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'IN_REVIEW', 'COMPLETED'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  boardColumnId?: string;

  @IsOptional()
  @IsString()
  recurring?: string;

  @IsOptional()
  @IsDateString()
  repeatUntil?: string;
}
