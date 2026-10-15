import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  Length,
} from 'class-validator';
import { ProjectStatus } from '../entities/project.entity';

export class CreateProjectDto {
  @IsString()
  @Length(2, 255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  plannedEnd?: string;
}