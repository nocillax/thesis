import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
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

  // Protected: Get user by ID
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  // Protected: Revoke user access
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch(':id/revoke')
  revoke(@Param('id') id: string) {
    return this.usersService.revokeUser(id);
  }

  // Protected: Reactivate user access
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.usersService.reactivateUser(id);
  }
}
