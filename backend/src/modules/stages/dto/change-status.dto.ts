import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StageStatus } from '../entities/stage-status.enum';

export class ChangeStatusDto {
  @IsEnum(StageStatus)
  status: StageStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}