import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(32)
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'Пароль должен быть минимум 8 символов' })
  @MaxLength(64)
  password: string;
}