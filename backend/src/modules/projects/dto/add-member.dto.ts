import { IsUUID, IsString, IsOptional, IsBoolean } from 'class-validator';

export class AddMemberDto {
  @IsUUID()
  userId: string;

  @IsString()
  roleCode: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}