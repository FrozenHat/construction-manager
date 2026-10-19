import { IsEnum, IsOptional, IsString, IsNumberString } from 'class-validator';
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

  // Новые поля: специалист/прораб может зафиксировать стоимость при принятии задачи
  @IsOptional()
  @IsNumberString()
  contractorFee?: string;

  @IsOptional()
  @IsNumberString()
  foremanFee?: string;
}