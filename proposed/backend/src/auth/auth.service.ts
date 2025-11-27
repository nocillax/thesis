import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(username: string, pass: string) {
    const user = await this.usersService.findOne(username);

    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const payload = {
        username: user.username,
        sub: user.id,
        isAdmin: user.is_admin,
        walletAddress: user.wallet_address,
      };

      return {
        success: true,
        access_token: this.jwtService.sign(payload),
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }
}
