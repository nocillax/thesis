import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';

@Controller('api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('register')
  async register(
    @Body()
    body: {
      username: string;
      password: string;
      email: string;
      full_name: string;
      is_admin?: boolean;
    },
  ) {
    return this.usersService.create(
      body.username,
      body.password,
      body.email,
      body.full_name,
      body.is_admin || false,
    );
  }
}
