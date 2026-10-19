import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TaskStatus, PauseReason } from '../entities/task-status.enum';

export class ChangeTaskStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsEnum(PauseReason)
  pauseReason?: PauseReason;

  @IsOptional()
  @IsString()
  pauseComment?: string;
}