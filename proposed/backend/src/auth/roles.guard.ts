import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private blockchainService: BlockchainService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.walletAddress) {
      throw new ForbiddenException('Authentication required');
    }

    try {
      // Check current authorization and admin status from blockchain
      const userInfo = await this.blockchainService.getUserByWalletAddress(
        user.walletAddress,
      );

      if (!userInfo.is_authorized) {
        throw new ForbiddenException('User is not authorized');
      }

      if (!userInfo.is_admin) {
        throw new ForbiddenException('Admin privileges required');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Authorization check failed');
    }
  }
}
