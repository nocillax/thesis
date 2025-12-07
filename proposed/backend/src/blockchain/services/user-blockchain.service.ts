import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class UserBlockchainService {
  private userRegistryContract: ethers.Contract;

  setUserRegistryContract(contract: ethers.Contract) {
    this.userRegistryContract = contract;
  }

  private ensureContractInitialized(): void {
    if (!this.userRegistryContract) {
      throw new BadRequestException('UserRegistry not configured');
    }
  }

  private async executeTransaction(
    txPromise: Promise<any>,
    successMessage: string,
  ): Promise<any> {
    try {
      const tx = await txPromise;
      const receipt = await tx.wait();
      console.log(`✅ ${successMessage}`);
      return receipt;
    } catch (error) {
      throw new BadRequestException(
        error.reason || error.message || 'Transaction failed',
      );
    }
  }

  private formatUserInfo(walletAddress: string, userInfo: any): any {
    return {
      wallet_address: walletAddress,
      username: userInfo.username,
      email: userInfo.email,
      is_authorized: userInfo.is_authorized,
      is_admin: userInfo.is_admin,
    };
  }

  private async validateNotLastAdmin(walletAddress: string): Promise<void> {
    const allUsers = await this.getAllUsersFromBlockchain();
    const admins = allUsers.filter((user) => user.is_admin);

    if (
      admins.length === 1 &&
      admins[0].wallet_address.toLowerCase() === walletAddress.toLowerCase()
    ) {
      throw new BadRequestException(
        'Cannot revoke admin privileges from the last remaining admin',
      );
    }
  }

  async registerNewUser(
    username: string,
    email: string,
    is_admin: boolean = false,
  ) {
    this.ensureContractInitialized();

    const newWallet = ethers.Wallet.createRandom();
    const walletAddress = newWallet.address;

    try {
      const receipt = await this.executeTransaction(
        this.userRegistryContract.registerUser(
          walletAddress,
          username,
          email,
          is_admin,
        ),
        `User registered: ${username} (${walletAddress})`,
      );

      return {
        success: true,
        message:
          'User registered successfully. Import private key to Rabby wallet.',
        wallet_address: walletAddress,
        private_key: newWallet.privateKey,
        username,
        email,
        is_admin,
        transaction_hash: receipt.hash,
        block_number: receipt.blockNumber,
      };
    } catch (error) {
      if (error.code === 'CALL_EXCEPTION' && error.revert?.args?.[0]) {
        throw new BadRequestException(error.revert.args[0]);
      }
      throw error;
    }
  }

  async getUserByWalletAddress(walletAddress: string) {
    this.ensureContractInitialized();

    try {
      const userInfo = await this.userRegistryContract.getUser(walletAddress);

      if (!userInfo.username || userInfo.username.length === 0) {
        throw new NotFoundException('User not found on blockchain');
      }

      return {
        ...this.formatUserInfo(walletAddress, userInfo),
        registration_date: new Date(
          Number(userInfo.registration_date) * 1000,
        ).toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching user by wallet address:', error);
      throw new NotFoundException('User not found on blockchain');
    }
  }

  async getAllUsersFromBlockchain() {
    this.ensureContractInitialized();

    try {
      const registeredFilter =
        this.userRegistryContract.filters.UserRegistered();
      const registeredEvents =
        await this.userRegistryContract.queryFilter(registeredFilter);

      const usersMap = new Map<string, any>();

      for (const event of registeredEvents) {
        if ('args' in event) {
          const walletAddress = event.args.wallet_address;
          const userInfo =
            await this.userRegistryContract.getUser(walletAddress);

          usersMap.set(
            walletAddress,
            this.formatUserInfo(walletAddress, userInfo),
          );
        }
      }

      return Array.from(usersMap.values());
    } catch (error) {
      console.error('❌ Failed to get all users from blockchain:', error);
      throw new BadRequestException(
        error.message || 'Failed to get all users from blockchain',
      );
    }
  }

  async revokeUserOnBlockchain(walletAddress: string) {
    this.ensureContractInitialized();
    await this.executeTransaction(
      this.userRegistryContract.revokeUser(walletAddress),
      `User revoked on blockchain: ${walletAddress}`,
    );
  }

  async reactivateUserOnBlockchain(walletAddress: string) {
    this.ensureContractInitialized();
    await this.executeTransaction(
      this.userRegistryContract.reactivateUser(walletAddress),
      `User reactivated on blockchain: ${walletAddress}`,
    );
  }

  async grantAdminToUser(walletAddress: string) {
    this.ensureContractInitialized();
    await this.executeTransaction(
      this.userRegistryContract.grantAdmin(walletAddress),
      `Admin privileges granted: ${walletAddress}`,
    );
  }

  async revokeAdminFromUser(walletAddress: string) {
    this.ensureContractInitialized();
    await this.validateNotLastAdmin(walletAddress);
    await this.executeTransaction(
      this.userRegistryContract.revokeAdmin(walletAddress),
      `Admin privileges revoked: ${walletAddress}`,
    );
  }
}
