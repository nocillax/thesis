import { Controller, Post, Body, HttpCode, HttpStatus, Inject, forwardRef } from '@nestjs/common';
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
      throw new Error('Wallet verification failed');
    }

    // Get user from blockchain
    const user = await this.blockchainService.getUserByWalletAddress(walletAddress);

    // Check if user is authorized
    if (!user.is_authorized) {
      throw new Error('User is not authorized');
    }

    // Generate JWT token
    return this.authService.generateToken(walletAddress, user.username, user.is_admin);
  }
}
