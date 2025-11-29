import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsBoolean()
  @IsOptional()
  is_admin?: boolean;
}
