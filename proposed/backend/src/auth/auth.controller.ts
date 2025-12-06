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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsString } from 'class-validator';
import { WalletLoginDto } from './wallet-login.dto';
import { BlockchainService } from '../blockchain/blockchain.service';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @Inject(forwardRef(() => BlockchainService))
    private blockchainService: BlockchainService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('wallet-login')
  async walletLogin(@Body() dto: WalletLoginDto) {
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
