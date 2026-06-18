import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class UpdateBoardDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
