import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumberString,
  Length,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @Length(2, 255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  managerId?: string;

  @IsOptional()
  @IsUUID()
  foremanId?: string;

  @IsOptional()
  @IsUUID()
  contractorId?: string;

  @IsOptional()
  @IsNumberString()
  foremanFee?: string;

  @IsOptional()
  @IsNumberString()
  contractorFee?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
  
  @IsOptional()
  @IsNumberString()
  clientPrice?: string;
}