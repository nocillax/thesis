import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import {
  IsString,
  IsBoolean,
  IsOptional,
  MinLength,
  IsEmail,
} from 'class-validator';

class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;
}

@Controller('api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Protected: Only logged-in Admins can view all users
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Protected: Only logged-in Admins can create new users
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(
      dto.username,
      dto.email,
      dto.password,
      dto.full_name,
      dto.isAdmin,
    );
  }
}
