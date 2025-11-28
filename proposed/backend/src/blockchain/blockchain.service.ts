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
  'function issueCertificate(bytes32 cert_hash, string student_id, string student_name, string degree_program, uint16 cgpa, string issuing_authority, bytes signature) external',
  'function verifyCertificate(bytes32 cert_hash) external view returns (string student_id, uint256 version, string student_name, string degree_program, uint16 cgpa, string issuing_authority, address issuer, bool is_revoked, bytes signature, uint256 issuance_date)',
  'function revokeCertificate(bytes32 cert_hash) external',
  'function reactivateCertificate(bytes32 cert_hash) external',
  'function getActiveCertificate(string student_id) external view returns (tuple(bytes32 cert_hash, string student_id, uint256 version, string student_name, string degree_program, uint16 cgpa, string issuing_authority, address issuer, bool is_revoked, bytes signature, uint256 issuance_date))',
  'function getAllVersions(string student_id) external view returns (bytes32[])',
  'function student_to_latest_version(string student_id) external view returns (uint256)',
  'function student_to_active_cert_hash(string student_id) external view returns (bytes32)',
  'event CertificateIssued(bytes32 indexed cert_hash, string indexed student_id, uint256 version, address indexed issuer, uint256 block_number)',
  'event CertificateRevoked(bytes32 indexed cert_hash, address indexed revoked_by, uint256 block_number)',
  'event CertificateReactivated(bytes32 indexed cert_hash, address indexed reactivated_by, uint256 block_number)',
];

const USER_REGISTRY_ABI = [
  'function registerUser(address wallet_address, string username, string email) external',
  'function getUser(address wallet_address) external view returns (string username, string email, uint256 registration_date, bool is_authorized)',
  'function getUserByEmail(string email) external view returns (address wallet_address, string username, uint256 registration_date, bool is_authorized)',
  'function revokeUser(address wallet_address) external',
  'function reactivateUser(address wallet_address) external',
  'function isAuthorized(address wallet_address) external view returns (bool)',
  'function userExists(address wallet_address) external view returns (bool)',
  'event UserRegistered(address indexed wallet_address, string username, string email, uint256 registration_date)',
  'event UserRevoked(address indexed wallet_address)',
  'event UserReactivated(address indexed wallet_address)',
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

  // Compute keccak256 hash from certificate data (removed certificate_number)
  computeHash(
    student_id: string,
    student_name: string,
    degree_program: string,
    cgpa: number,
    version: number,
    issuance_date: number,
  ): string {
    const data =
      student_id +
      student_name +
      degree_program +
      cgpa.toString() +
      version.toString() +
      issuance_date.toString();
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  async issueCertificate(
    student_id: string,
    student_name: string,
    degree_program: string,
    cgpa: number,
    issuing_authority: string,
    username: string,
    walletAddress: string,
  ) {
    try {
      // Check if student already has an active certificate
      const latestVersion =
        await this.certificateContract.student_to_latest_version(student_id);
      const version = Number(latestVersion) + 1;

      const issuance_date = Math.floor(Date.now() / 1000);
      const cert_hash = this.computeHash(
        student_id,
        student_name,
        degree_program,
        cgpa,
        version,
        issuance_date,
      );

      // Get user's wallet from database
      const userWallet = await this.getUserWallet(username, walletAddress);

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
        student_id,
        version,
        cert_hash,
        transaction_hash: receipt.hash,
        block_number: receipt.blockNumber,
        signature,
      };
    } catch (error) {
      console.error('❌ Certificate issuance failed:', error);

      // Extract clean error message from smart contract revert
      if (error.reason) {
        throw new BadRequestException(error.reason);
      }

      // Handle CALL_EXCEPTION errors with revert data
      if (error.code === 'CALL_EXCEPTION' && error.revert?.args?.[0]) {
        throw new BadRequestException(error.revert.args[0]);
      }

      // Check for specific error messages
      if (error.message && error.message.includes('Not authorized')) {
        throw new BadRequestException('Not authorized to issue certificates');
      }

      throw new BadRequestException(
        error.message || 'Failed to issue certificate',
      );
    }
  }

  async verifyCertificate(cert_hash: string) {
    try {
      const result =
        await this.certificateContract.verifyCertificate(cert_hash);

      // Fetch issuer name from UserRegistry
      let issuerName = 'Unknown';
      try {
        if (this.userRegistryContract) {
          const userInfo = await this.userRegistryContract.getUser(
            result.issuer,
          );
          issuerName = userInfo.username;
        }
      } catch (error) {
        console.warn(`⚠️  Could not fetch issuer name for ${result.issuer}`);
      }

      return {
        cert_hash,
        student_id: result.student_id,
        version: Number(result.version),
        student_name: result.student_name,
        degree_program: result.degree_program,
        cgpa: Number(result.cgpa) / 100,
        issuing_authority: result.issuing_authority,
        issuer: result.issuer,
        issuer_name: issuerName,
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

      // Extract clean error message from smart contract revert
      if (error.reason) {
        throw new BadRequestException(error.reason);
      }

      // Handle CALL_EXCEPTION errors with revert data
      if (error.code === 'CALL_EXCEPTION' && error.revert?.args?.[0]) {
        throw new BadRequestException(error.revert.args[0]);
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
    try {
      if (!this.userRegistryContract) {
        throw new BadRequestException('UserRegistry not configured');
      }

      // Get user info from UserRegistry ONLY (pure blockchain data)
      const userInfo = await this.userRegistryContract.getUser(walletAddress);

      if (!userInfo.username || userInfo.username.length === 0) {
        throw new NotFoundException('User not found on blockchain');
      }

      return {
        wallet_address: walletAddress,
        username: userInfo.username,
        email: userInfo.email,
        registration_date: new Date(
          Number(userInfo.registration_date) * 1000,
        ).toISOString(),
        is_authorized: userInfo.is_authorized,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching user by wallet address:', error);
      throw new NotFoundException('User not found on blockchain');
    }
  }

  async getUserByWalletAddressWithDB(walletAddress: string) {
    try {
      // Get DB data ONLY - no blockchain merging to avoid conflicts
      const dbUser = await this.usersRepository.findOne({
        where: { wallet_address: walletAddress },
      });

      if (!dbUser) {
        throw new NotFoundException('User not found in database');
      }

      return {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        full_name: dbUser.full_name,
        wallet_address: dbUser.wallet_address,
        is_admin: dbUser.is_admin,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching user from database:', error);
      throw new BadRequestException('Failed to fetch user information');
    }
  }

  async revokeUserOnBlockchain(walletAddress: string) {
    try {
      if (!this.userRegistryContract) {
        throw new BadRequestException('UserRegistry not configured');
      }

      const tx = await this.userRegistryContract.revokeUser(walletAddress);
      await tx.wait();
      console.log(`✅ User revoked on blockchain: ${walletAddress}`);
    } catch (error) {
      console.error('❌ Failed to revoke user on blockchain:', error);
      throw new BadRequestException(
        error.message || 'Failed to revoke user on blockchain',
      );
    }
  }

  async reactivateUserOnBlockchain(walletAddress: string) {
    try {
      if (!this.userRegistryContract) {
        throw new BadRequestException('UserRegistry not configured');
      }

      const tx = await this.userRegistryContract.reactivateUser(walletAddress);
      await tx.wait();
      console.log(`✅ User reactivated on blockchain: ${walletAddress}`);
    } catch (error) {
      console.error('❌ Failed to reactivate user on blockchain:', error);
      throw new BadRequestException(
        error.message || 'Failed to reactivate user on blockchain',
      );
    }
  }

  async getAllCertificates() {
    try {
      // Get all CertificateIssued events from the blockchain
      const issuedFilter = this.certificateContract.filters.CertificateIssued();
      const issuedEvents =
        await this.certificateContract.queryFilter(issuedFilter);

      // For each event, get the full certificate details
      const certificates = await Promise.all(
        issuedEvents.map(async (event) => {
          if ('args' in event) {
            const cert_hash = event.args.cert_hash;
            try {
              const cert = await this.verifyCertificate(cert_hash);
              return cert;
            } catch (error) {
              // Certificate might have been issued but details not retrievable
              console.warn(`Could not retrieve certificate ${cert_hash}`);
              return null;
            }
          }
          return null;
        }),
      );

      // Filter out nulls and return
      return certificates.filter((cert) => cert !== null);
    } catch (error) {
      console.error('❌ Failed to get all certificates:', error);
      throw new BadRequestException(
        error.message || 'Failed to get all certificates',
      );
    }
  }

  async getAllUsersFromBlockchain() {
    try {
      if (!this.userRegistryContract) {
        throw new BadRequestException('UserRegistry not configured');
      }

      // Query all UserRegistered events from UserRegistry
      const registeredFilter =
        this.userRegistryContract.filters.UserRegistered();
      const registeredEvents =
        await this.userRegistryContract.queryFilter(registeredFilter);

      // Use Map to deduplicate by wallet address (keep latest)
      const usersMap = new Map<string, any>();

      for (const event of registeredEvents) {
        if ('args' in event) {
          const walletAddress = event.args.wallet_address;
          const username = event.args.username;
          const email = event.args.email;

          // Get current user info from UserRegistry (includes is_authorized)
          const userInfo =
            await this.userRegistryContract.getUser(walletAddress);

          usersMap.set(walletAddress, {
            wallet_address: walletAddress,
            username: username,
            email: email,
            is_authorized: userInfo.is_authorized,
          });
        }
      }

      // Convert Map to array
      return Array.from(usersMap.values());
    } catch (error) {
      console.error('❌ Failed to get all users from blockchain:', error);
      throw new BadRequestException(
        error.message || 'Failed to get all users from blockchain',
      );
    }
  }

  async getActiveCertificateByStudentId(student_id: string) {
    try {
      const activeCert =
        await this.certificateContract.getActiveCertificate(student_id);

      // Fetch issuer name from UserRegistry
      let issuerName = 'Unknown';
      try {
        if (this.userRegistryContract) {
          const userInfo = await this.userRegistryContract.getUser(
            activeCert.issuer,
          );
          issuerName = userInfo.username;
        }
      } catch (error) {
        console.warn(
          `⚠️  Could not fetch issuer name for ${activeCert.issuer}`,
        );
      }

      return {
        cert_hash: activeCert.cert_hash,
        student_id: activeCert.student_id,
        version: Number(activeCert.version),
        student_name: activeCert.student_name,
        degree_program: activeCert.degree_program,
        cgpa: Number(activeCert.cgpa) / 100,
        issuing_authority: activeCert.issuing_authority,
        issuer: activeCert.issuer,
        issuer_name: issuerName,
        is_revoked: activeCert.is_revoked,
        signature: activeCert.signature,
        issuance_date: new Date(
          Number(activeCert.issuance_date) * 1000,
        ).toISOString(),
      };
    } catch (error) {
      if (error.message && error.message.includes('No active certificate')) {
        throw new NotFoundException(
          `No active certificate found for student ${student_id}`,
        );
      }
      throw new BadRequestException(
        error.message || 'Failed to get active certificate',
      );
    }
  }

  async getAllVersionsByStudentId(student_id: string) {
    try {
      const hashes = await this.certificateContract.getAllVersions(student_id);

      // Get details for each version
      const versions = await Promise.all(
        hashes.map(async (hash: string) => {
          try {
            return await this.verifyCertificate(hash);
          } catch (error) {
            console.warn(`Could not retrieve certificate ${hash}`);
            return null;
          }
        }),
      );

      return versions.filter((cert) => cert !== null);
    } catch (error) {
      if (error.message && error.message.includes('No certificates found')) {
        throw new NotFoundException(
          `No certificates found for student ${student_id}`,
        );
      }
      throw new BadRequestException(
        error.message || 'Failed to get certificate versions',
      );
    }
  }
}
