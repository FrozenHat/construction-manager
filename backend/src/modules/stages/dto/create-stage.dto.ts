import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  Length,
} from 'class-validator';

export class CreateStageDto {
  @IsString()
  @Length(2, 255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  responsibleId?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}