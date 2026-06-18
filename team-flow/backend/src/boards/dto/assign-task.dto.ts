import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AssignTaskDto {
  @IsString()
  taskId: string;

  @IsString()
  columnId: string;

  @IsNumber()
  @IsOptional()
  position?: number;
}
