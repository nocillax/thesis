import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef,
  UnauthorizedException,
  NotFoundException,
  Ip,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsString } from 'class-validator';
import { WalletLoginDto } from './wallet-login.dto';
import { BlockchainService } from '../blockchain/blockchain.service';
import { SessionService } from '../blockchain/services/session.service';
import type { Request } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @Inject(forwardRef(() => BlockchainService))
    private blockchainService: BlockchainService,
    @Inject(forwardRef(() => SessionService))
    private sessionService: SessionService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('wallet-login')
  async walletLogin(
    @Body() dto: WalletLoginDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    // Verify signature
    const { verified, walletAddress } = await this.authService.walletLogin(
      dto.walletAddress,
      dto.signature,
      dto.message,
    );

    if (!verified) {
      throw new UnauthorizedException('Wallet verification failed');
    }

    // Get user from blockchain
    try {
      const user =
        await this.blockchainService.getUserByWalletAddress(walletAddress);

      // Check if user is authorized
      if (!user.is_authorized) {
        throw new UnauthorizedException(
          'Access denied: Your account is not authorized to login. Please contact an administrator.',
        );
      }

      // Record login session
      await this.sessionService.createSession(
        walletAddress,
        user.username,
        ip,
        req.headers['user-agent'],
      );

      // Generate JWT token
      return this.authService.generateToken(
        walletAddress,
        user.username,
        user.is_admin,
        user.is_authorized,
      );
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // User not found in blockchain
      throw new NotFoundException(
        'User not registered. Please contact an administrator to register your wallet address.',
      );
    }
  }
}
