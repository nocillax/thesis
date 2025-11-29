import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async walletLogin(walletAddress: string, signature: string, message: string) {
    try {
      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new UnauthorizedException('Invalid signature');
      }

      // Signature is valid - user owns this wallet
      return { verified: true, walletAddress: recoveredAddress };
    } catch (error) {
      console.error('Wallet login verification failed:', error);
      throw new UnauthorizedException('Invalid signature or wallet address');
    }
  }

  generateToken(walletAddress: string, username: string, isAdmin: boolean) {
    const payload = {
      walletAddress,
      username,
      isAdmin,
    };

    return {
      success: true,
      access_token: this.jwtService.sign(payload),
    };
  }
}
