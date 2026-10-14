import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(2, 255)
  fullName: string;

  @IsOptional()
  @IsString()
  @Length(5, 32)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telegramId?: string;

  @IsOptional()
  @IsBoolean()
  isClient?: boolean;

  @IsOptional()
  @IsBoolean()
  isEmployee?: boolean;
}