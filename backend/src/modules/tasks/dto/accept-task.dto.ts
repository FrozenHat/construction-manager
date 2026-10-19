import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class AcceptTaskDto {
  @IsNumberString()
  contractorFee: string; // Свой гонорар

  @IsOptional()
  @IsString()
  comment?: string;
}