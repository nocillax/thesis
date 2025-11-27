import {
  Injectable,
  OnModuleInit,
  Inject,
  forwardRef,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import * as crypto from 'crypto';

const CONTRACT_ABI = [
  'function registerIssuer(string name) external',
  'function getIssuerName(address issuer) external view returns (string)',
  'function issueCertificate(bytes32 cert_hash, string certificate_number, string student_id, string student_name, string degree_program, uint16 cgpa, string issuing_authority, bytes signature) external',
  'function verifyCertificate(bytes32 cert_hash) external view returns (string certificate_number, string student_id, string student_name, string degree_program, uint16 cgpa, string issuing_authority, address issuer, string issuer_name, bool is_revoked, bytes signature, uint256 issuance_date)',
  'function revokeCertificate(bytes32 cert_hash) external',
  'function reactivateCertificate(bytes32 cert_hash) external',
  'event CertificateIssued(bytes32 indexed cert_hash, address indexed issuer, uint256 block_number)',
  'event CertificateRevoked(bytes32 indexed cert_hash, address indexed revoked_by, uint256 block_number)',
  'event CertificateReactivated(bytes32 indexed cert_hash, address indexed reactivated_by, uint256 block_number)',
];

const USER_REGISTRY_ABI = [
  'function registerUser(address wallet_address, string username, string email) external',
  'function getUser(address wallet_address) external view returns (string username, string email, uint256 registration_date, bool is_active)',
  'function getUserByEmail(string email) external view returns (address wallet_address, string username, uint256 registration_date, bool is_active)',
  'function userExists(address wallet_address) external view returns (bool)',
];

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly ENCRYPTION_KEY =
    process.env.MASTER_ENCRYPTION_KEY ||
    'default-master-key-change-in-production';
  private provider: ethers.JsonRpcProvider;
  private adminWallet: ethers.Wallet;
  private certificateContract: ethers.Contract;
  private userRegistryContract: ethers.Contract;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const rpcUrl =
      this.configService.get<string>('RPC_URL') || 'http://localhost:8545';
    const privateKey = this.configService.get<string>('PRIVATE_KEY') || '';
    const certificateAddress =
      this.configService.get<string>('CONTRACT_ADDRESS') || '';
    const userRegistryAddress =
      this.configService.get<string>('USER_REGISTRY_ADDRESS') || '';

    if (!privateKey || !certificateAddress) {
      throw new Error('Missing PRIVATE_KEY or CONTRACT_ADDRESS in environment');
    }

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
      console.log(`   User Registry: ${userRegistryAddress}`);
    }

    console.log('✅ Blockchain service initialized');
    console.log(`   RPC: ${rpcUrl}`);
    console.log(`   Contract: ${certificateAddress}`);
    console.log(`   Admin Wallet: ${this.adminWallet.address}`);
  }

  // Decrypt user's private key from database so we can sign blockchain transactions
  // Format stored in DB: "iv:encrypted_data" (both as hex strings)
  private decryptPrivateKey(encryptedKey: string): string {
    const algorithm = 'aes-256-ctr';
    // Hash the master key to get a consistent 32-byte encryption key
    const key = crypto
      .createHash('sha256')
      .update(this.ENCRYPTION_KEY)
      .digest();
    // Split the stored format: "iv:encrypted"
    const parts = encryptedKey.split(':');
    const iv = Buffer.from(parts[0], 'hex'); // Initialization vector (16 bytes)
    const encrypted = Buffer.from(parts[1], 'hex'); // The actual encrypted private key
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    // Decrypt and convert back to the original private key string
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  private async getUserWallet(
    username: string,
    walletAddress: string,
  ): Promise<ethers.Wallet> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) {
      throw new Error('User not found');
    }

    const privateKey = this.decryptPrivateKey(user.encrypted_private_key);
    return new ethers.Wallet(privateKey, this.provider);
  }

  async registerUserOnBlockchain(
    walletAddress: string,
    username: string,
    email: string,
  ) {
    if (!this.userRegistryContract) {
      console.warn('⚠️  UserRegistry contract not configured');
      return;
    }

    const tx = await this.userRegistryContract.registerUser(
      walletAddress,
      username,
      email,
    );
    await tx.wait();
  }

  async registerIssuer(name: string, userWallet?: ethers.Wallet) {
    const wallet = userWallet || this.adminWallet;
    const contractWithSigner = this.certificateContract.connect(wallet) as any;
    const tx = await contractWithSigner.registerIssuer(name);
    await tx.wait();
    console.log(`✅ Issuer registered: ${name} (${wallet.address})`);
  }

  // Compute keccak256 hash from certificate data
  computeHash(
    student_id: string,
    student_name: string,
    degree_program: string,
    cgpa: number,
    certificate_number: string,
    issuance_date: number,
  ): string {
    const data =
      student_id +
      student_name +
      degree_program +
      cgpa.toString() +
      certificate_number +
      issuance_date.toString();
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  async issueCertificate(
    certificate_number: string,
    student_id: string,
    student_name: string,
    degree_program: string,
    cgpa: number,
    issuing_authority: string,
    username: string,
    walletAddress: string,
  ) {
    try {
      const issuance_date = Math.floor(Date.now() / 1000);
      const cert_hash = this.computeHash(
        student_id,
        student_name,
        degree_program,
        cgpa,
        certificate_number,
        issuance_date,
      );

      // Get user's wallet from database
      const userWallet = await this.getUserWallet(username, walletAddress);

      // Register issuer if not already registered (username as issuer_name)
      try {
        const existingName = await (
          this.certificateContract as any
        ).getIssuerName(userWallet.address);
        if (!existingName || existingName.length === 0) {
          await this.registerIssuer(username, userWallet);
        }
      } catch (error) {
        console.error('⚠️  Failed to check/register issuer:', error.message);
      }

      const signature = await userWallet.signMessage(
        ethers.getBytes(cert_hash),
      );
      const cgpa_scaled = Math.round(cgpa * 100);

      // Use user's wallet to sign transaction
      const contractWithUserSigner = this.certificateContract.connect(
        userWallet,
      ) as any;

      const tx = await contractWithUserSigner.issueCertificate(
        cert_hash,
        certificate_number,
        student_id,
        student_name,
        degree_program,
        cgpa_scaled,
        issuing_authority,
        signature,
      );

      const receipt = await tx.wait();

      return {
        success: true,
        certificate_number,
        cert_hash,
        transaction_hash: receipt.hash,
        block_number: receipt.blockNumber,
        signature,
      };
    } catch (error) {
      console.error('❌ Certificate issuance failed:', error);
      throw new BadRequestException(
        error.message || 'Failed to issue certificate',
      );
    }
  }

  async verifyCertificate(cert_hash: string) {
    try {
      const result =
        await this.certificateContract.verifyCertificate(cert_hash);

      return {
        cert_hash,
        certificate_number: result.certificate_number,
        student_id: result.student_id,
        student_name: result.student_name,
        degree_program: result.degree_program,
        cgpa: Number(result.cgpa) / 100,
        issuing_authority: result.issuing_authority,
        issuer: result.issuer,
        issuer_name: result.issuer_name,
        is_revoked: result.is_revoked,
        signature: result.signature,
        issuance_date: new Date(
          Number(result.issuance_date) * 1000,
        ).toISOString(),
      };
    } catch (error) {
      if (
        error.message &&
        error.message.includes('Certificate does not exist')
      ) {
        throw new NotFoundException('Certificate does not exist');
      }
      throw new BadRequestException(
        error.message || 'Failed to verify certificate',
      );
    }
  }

  async revokeCertificate(cert_hash: string) {
    try {
      // Check current status before revoking
      const cert = await this.verifyCertificate(cert_hash);
      if (cert.is_revoked) {
        throw new BadRequestException('Certificate is already revoked');
      }

      const tx = await this.certificateContract.revokeCertificate(cert_hash);
      const receipt = await tx.wait();

      return {
        success: true,
        cert_hash,
        transaction_hash: receipt.hash,
        block_number: receipt.blockNumber,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to revoke certificate',
      );
    }
  }

  async reactivateCertificate(cert_hash: string) {
    try {
      // Check current status before reactivating
      const cert = await this.verifyCertificate(cert_hash);
      if (!cert.is_revoked) {
        throw new BadRequestException('Certificate is already active');
      }

      const tx =
        await this.certificateContract.reactivateCertificate(cert_hash);
      const receipt = await tx.wait();

      return {
        success: true,
        cert_hash,
        transaction_hash: receipt.hash,
        block_number: receipt.blockNumber,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to reactivate certificate',
      );
    }
  }

  async getAuditLogs(cert_hash: string) {
    const issuedFilter =
      this.certificateContract.filters.CertificateIssued(cert_hash);
    const revokedFilter =
      this.certificateContract.filters.CertificateRevoked(cert_hash);
    const reactivatedFilter =
      this.certificateContract.filters.CertificateReactivated(cert_hash);

    const [issuedEvents, revokedEvents, reactivatedEvents] = await Promise.all([
      this.certificateContract.queryFilter(issuedFilter),
      this.certificateContract.queryFilter(revokedFilter),
      this.certificateContract.queryFilter(reactivatedFilter),
    ]);

    const allEvents = [
      ...issuedEvents
        .map((e) => {
          if ('args' in e) {
            return {
              action: 'ISSUED',
              cert_hash: e.args.cert_hash,
              issuer: e.args.issuer,
              block_number: Number(e.args.block_number),
              transaction_hash: e.transactionHash,
            };
          }
        })
        .filter(Boolean),
      ...revokedEvents
        .map((e) => {
          if ('args' in e) {
            return {
              action: 'REVOKED',
              cert_hash: e.args.cert_hash,
              revoked_by: e.args.revoked_by,
              block_number: Number(e.args.block_number),
              transaction_hash: e.transactionHash,
            };
          }
        })
        .filter(Boolean),
      ...reactivatedEvents
        .map((e) => {
          if ('args' in e) {
            return {
              action: 'REACTIVATED',
              cert_hash: e.args.cert_hash,
              reactivated_by: e.args.reactivated_by,
              block_number: Number(e.args.block_number),
              transaction_hash: e.transactionHash,
            };
          }
        })
        .filter(Boolean),
    ];

    return allEvents
      .filter((e): e is NonNullable<typeof e> => e !== undefined)
      .sort((a, b) => a.block_number - b.block_number);
  }

  async getUserByWalletAddress(walletAddress: string) {
    if (!this.userRegistryContract) {
      throw new Error('UserRegistry contract not configured');
    }

    const result = await this.userRegistryContract.getUser(walletAddress);

    return {
      wallet_address: walletAddress,
      username: result.username,
      email: result.email,
      registration_date: new Date(
        Number(result.registration_date) * 1000,
      ).toISOString(),
      is_active: result.is_active,
    };
  }
}
