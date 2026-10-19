import { IsEnum, IsOptional, IsUUID, IsNumberString, IsString } from 'class-validator';
import { TransactionType, TransactionCategory } from '../entities/transaction.enums';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}