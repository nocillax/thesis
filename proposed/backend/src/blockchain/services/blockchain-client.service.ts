import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class BlockchainClientService {
  private provider: ethers.JsonRpcProvider;
  private adminWallet: ethers.Wallet;
  private certificateContract: ethers.Contract;
  private userRegistryContract: ethers.Contract;

  private loadAbi(filename: string): any {
    const ABIS_PATH = path.join(process.cwd(), 'src', 'blockchain', 'abis');
    const abiJson = JSON.parse(
      fs.readFileSync(path.join(ABIS_PATH, filename), 'utf8'),
    );
    return abiJson.abi;
  }

  async initialize(configService: ConfigService) {
    const rpcUrl =
      configService.get<string>('RPC_URL') || 'http://localhost:8545';
    const privateKey = configService.get<string>('PRIVATE_KEY') || '';
    const certificateAddress =
      configService.get<string>('CONTRACT_ADDRESS') || '';
    const userRegistryAddress =
      configService.get<string>('USER_REGISTRY_ADDRESS') || '';

    if (!privateKey || !certificateAddress) {
      throw new Error('Missing PRIVATE_KEY or CONTRACT_ADDRESS in environment');
    }

    const CONTRACT_ABI = this.loadAbi('CertificateRegistry.json');
    const USER_REGISTRY_ABI = this.loadAbi('UserRegistry.json');

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.adminWallet = new ethers.Wallet(privateKey, this.provider);
    this.certificateContract = new ethers.Contract(
      certificateAddress,
      CONTRACT_ABI,
      this.adminWallet,
    );

    if (userRegistryAddress) {
      this.userRegistryContract = new ethers.Contract(
        userRegistryAddress,
        USER_REGISTRY_ABI,
        this.adminWallet,
      );
    }

    console.log('✅ Blockchain service initialized');
    console.log(`   RPC: ${rpcUrl}`);
    console.log(`   Certificate Contract: ${certificateAddress}`);
    console.log(`   User Registry Contract: ${userRegistryAddress}`);
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  getAdminWallet(): ethers.Wallet {
    return this.adminWallet;
  }

  getCertificateContract(): ethers.Contract {
    return this.certificateContract;
  }

  getUserRegistryContract(): ethers.Contract {
    return this.userRegistryContract;
  }
}
