import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { createHash } from 'crypto';
import * as levenshtein from 'fast-levenshtein';
import * as path from 'path';
import * as fs from 'fs';

// Load ABIs from JSON files
const ABIS_PATH = path.join(process.cwd(), 'src', 'blockchain', 'abis');
const certificateAbiJson = JSON.parse(
  fs.readFileSync(path.join(ABIS_PATH, 'CertificateRegistry.json'), 'utf8'),
);
const userRegistryAbiJson = JSON.parse(
  fs.readFileSync(path.join(ABIS_PATH, 'UserRegistry.json'), 'utf8'),
);

const CONTRACT_ABI = certificateAbiJson.abi;
const USER_REGISTRY_ABI = userRegistryAbiJson.abi;

@Injectable()
export class BlockchainService implements OnModuleInit {
  private provider: ethers.JsonRpcProvider;
  private adminWallet: ethers.Wallet;
  private certificateContract: ethers.Contract;
  private userRegistryContract: ethers.Contract;

  constructor(private configService: ConfigService) {}

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
    }

    console.log('✅ Blockchain service initialized');
    console.log(`   RPC: ${rpcUrl}`);
    console.log(`   Certificate Contract: ${certificateAddress}`);
    console.log(`   User Registry Contract: ${userRegistryAddress}`);
  }

  async registerNewUser(
    username: string,
    email: string,
    is_admin: boolean = false,
  ) {
    if (!this.userRegistryContract) {
      throw new BadRequestException('UserRegistry not configured');
    }

    const newWallet = ethers.Wallet.createRandom();
    const walletAddress = newWallet.address;
    const privateKey = newWallet.privateKey;

    try {
      const tx = await this.userRegistryContract.registerUser(
        walletAddress,
        username,
        email,
        is_admin,
      );
      const receipt = await tx.wait();

      console.log(`✅ User registered: ${username} (${walletAddress})`);

      return {
        success: true,
        message:
          'User registered successfully. Import private key to Rabby wallet.',
        wallet_address: walletAddress,
        private_key: privateKey,
        username,
        email,
        is_admin,
        transaction_hash: receipt.hash,
        block_number: receipt.blockNumber,
      };
    } catch (error) {
      if (error.reason) {
        throw new BadRequestException(error.reason);
      }
      if (error.code === 'CALL_EXCEPTION' && error.revert?.args?.[0]) {
        throw new BadRequestException(error.revert.args[0]);
      }
      throw new BadRequestException(error.message || 'Failed to register user');
    }
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
    degree: string,
    program: string,
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
        `${degree} - ${program}`,
        cgpa,
        version,
        issuance_date,
      );

      // Backend signs with admin wallet (can be updated to accept user signatures in future)
      const signature = await this.adminWallet.signMessage(
        ethers.getBytes(cert_hash),
      );
      const cgpa_scaled = Math.round(cgpa * 100);

      // Admin wallet pays gas, but actual issuer is recorded
      const tx = await this.certificateContract.issueCertificate(
        cert_hash,
        student_id,
        student_name,
        degree,
        program,
        cgpa_scaled,
        issuing_authority,
        signature,
        walletAddress,
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
        degree: result.degree,
        program: result.program,
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

  async revokeCertificate(cert_hash: string, actor_address: string) {
    try {
      // Check current status - if already revoked, return success (idempotent)
      const cert = await this.verifyCertificate(cert_hash);
      if (cert.is_revoked) {
        return {
          success: true,
          cert_hash,
          message: 'Certificate already revoked',
          transaction_hash: null,
          block_number: null,
        };
      }

      const tx = await this.certificateContract.revokeCertificate(
        cert_hash,
        actor_address,
      );
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

  async reactivateCertificate(cert_hash: string, actor_address: string) {
    try {
      // Check current status - if already active, return success (idempotent)
      const cert = await this.verifyCertificate(cert_hash);
      if (!cert.is_revoked) {
        return {
          success: true,
          cert_hash,
          message: 'Certificate already active',
          transaction_hash: null,
          block_number: null,
        };
      }

      const tx = await this.certificateContract.reactivateCertificate(
        cert_hash,
        actor_address,
      );
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

    const allEvents = await Promise.all([
      ...issuedEvents
        .map(async (e) => {
          if ('args' in e && e.blockNumber) {
            const block = await this.provider.getBlock(e.blockNumber);
            return {
              action: 'ISSUED',
              cert_hash: e.args.cert_hash,
              issuer: e.args.issuer,
              block_number: Number(e.args.block_number),
              transaction_hash: e.transactionHash,
              timestamp: block
                ? new Date(block.timestamp * 1000).toISOString()
                : null,
            };
          }
        })
        .filter(Boolean),
      ...revokedEvents
        .map(async (e) => {
          if ('args' in e && e.blockNumber) {
            const block = await this.provider.getBlock(e.blockNumber);
            return {
              action: 'REVOKED',
              cert_hash: e.args.cert_hash,
              revoked_by: e.args.revoked_by,
              block_number: Number(e.args.block_number),
              transaction_hash: e.transactionHash,
              timestamp: block
                ? new Date(block.timestamp * 1000).toISOString()
                : null,
            };
          }
        })
        .filter(Boolean),
      ...reactivatedEvents
        .map(async (e) => {
          if ('args' in e && e.blockNumber) {
            const block = await this.provider.getBlock(e.blockNumber);
            return {
              action: 'REACTIVATED',
              cert_hash: e.args.cert_hash,
              reactivated_by: e.args.reactivated_by,
              block_number: Number(e.args.block_number),
              transaction_hash: e.transactionHash,
              timestamp: block
                ? new Date(block.timestamp * 1000).toISOString()
                : null,
            };
          }
        })
        .filter(Boolean),
    ]);

    return allEvents
      .filter((e): e is NonNullable<typeof e> => e !== undefined)
      .sort((a, b) => b.block_number - a.block_number); // Descending order (newest first)
  }

  async getAllAuditLogs(page?: number, limit?: number) {
    // Get all events without filtering by cert_hash
    const issuedFilter = this.certificateContract.filters.CertificateIssued();
    const revokedFilter = this.certificateContract.filters.CertificateRevoked();
    const reactivatedFilter =
      this.certificateContract.filters.CertificateReactivated();

    const [issuedEvents, revokedEvents, reactivatedEvents] = await Promise.all([
      this.certificateContract.queryFilter(issuedFilter),
      this.certificateContract.queryFilter(revokedFilter),
      this.certificateContract.queryFilter(reactivatedFilter),
    ]);

    const allEvents = await Promise.all([
      ...issuedEvents
        .map(async (e) => {
          if ('args' in e && e.blockNumber) {
            const block = await this.provider.getBlock(e.blockNumber);
            return {
              action: 'ISSUED',
              cert_hash: e.args.cert_hash,
              student_id: e.args.student_id,
              version: Number(e.args.version),
              issuer: e.args.issuer,
              block_number: Number(e.args.block_number),
              transaction_hash: e.transactionHash,
              timestamp: block
                ? new Date(block.timestamp * 1000).toISOString()
                : null,
            };
          }
        })
        .filter(Boolean),
      ...revokedEvents
        .map(async (e) => {
          if ('args' in e && e.blockNumber) {
            const block = await this.provider.getBlock(e.blockNumber);
            return {
              action: 'REVOKED',
              cert_hash: e.args.cert_hash,
              revoked_by: e.args.revoked_by,
              block_number: Number(e.args.block_number),
              transaction_hash: e.transactionHash,
              timestamp: block
                ? new Date(block.timestamp * 1000).toISOString()
                : null,
            };
          }
        })
        .filter(Boolean),
      ...reactivatedEvents
        .map(async (e) => {
          if ('args' in e && e.blockNumber) {
            const block = await this.provider.getBlock(e.blockNumber);
            return {
              action: 'REACTIVATED',
              cert_hash: e.args.cert_hash,
              reactivated_by: e.args.reactivated_by,
              block_number: Number(e.args.block_number),
              transaction_hash: e.transactionHash,
              timestamp: block
                ? new Date(block.timestamp * 1000).toISOString()
                : null,
            };
          }
        })
        .filter(Boolean),
    ]);

    const sorted = allEvents
      .filter((e): e is NonNullable<typeof e> => e !== undefined)
      .sort((a, b) => b.block_number - a.block_number); // Descending order (newest first)

    // Apply pagination if provided
    if (page && limit) {
      const total_count = sorted.length;
      const total_pages = Math.ceil(total_count / limit);
      const start = (page - 1) * limit;
      const end = start + limit;
      const data = sorted.slice(start, end);

      return {
        data,
        meta: {
          current_page: page,
          total_pages,
          total_count,
          has_more: page < total_pages,
        },
      };
    }

    return sorted;
  }

  async getUserAuditLogs(walletAddress: string, page?: number, limit?: number) {
    // Get all events where this user was the actor
    // For CertificateIssued: cert_hash, student_id, version, issuer are indexed
    const issuedFilter = this.certificateContract.filters.CertificateIssued(
      null, // cert_hash
      null, // student_id
      null, // version
      walletAddress, // issuer
    );

    // For CertificateRevoked: cert_hash, revoked_by are indexed
    const revokedFilter = this.certificateContract.filters.CertificateRevoked(
      null, // cert_hash
      walletAddress, // revoked_by
    );

    // For CertificateReactivated: cert_hash, reactivated_by are indexed
    const reactivatedFilter =
      this.certificateContract.filters.CertificateReactivated(
        null, // cert_hash
        walletAddress, // reactivated_by
      );

    const [issuedEvents, revokedEvents, reactivatedEvents] = await Promise.all([
      this.certificateContract.queryFilter(issuedFilter),
      this.certificateContract.queryFilter(revokedFilter),
      this.certificateContract.queryFilter(reactivatedFilter),
    ]);

    const allEvents = await Promise.all([
      ...issuedEvents
        .map(async (e) => {
          if ('args' in e && e.blockNumber) {
            const block = await this.provider.getBlock(e.blockNumber);
            return {
              action: 'ISSUED',
              cert_hash: e.args.cert_hash,
              student_id: e.args.student_id,
              version: Number(e.args.version),
              block_number: Number(e.args.block_number),
              transaction_hash: e.transactionHash,
              timestamp: block
                ? new Date(block.timestamp * 1000).toISOString()
                : null,
            };
          }
        })
        .filter(Boolean),
      ...revokedEvents
        .map(async (e) => {
          if ('args' in e && e.blockNumber) {
            const block = await this.provider.getBlock(e.blockNumber);
            return {
              action: 'REVOKED',
              cert_hash: e.args.cert_hash,
              block_number: Number(e.args.block_number),
              transaction_hash: e.transactionHash,
              timestamp: block
                ? new Date(block.timestamp * 1000).toISOString()
                : null,
            };
          }
        })
        .filter(Boolean),
      ...reactivatedEvents
        .map(async (e) => {
          if ('args' in e && e.blockNumber) {
            const block = await this.provider.getBlock(e.blockNumber);
            return {
              action: 'REACTIVATED',
              cert_hash: e.args.cert_hash,
              block_number: Number(e.args.block_number),
              transaction_hash: e.transactionHash,
              timestamp: block
                ? new Date(block.timestamp * 1000).toISOString()
                : null,
            };
          }
        })
        .filter(Boolean),
    ]);

    const sorted = allEvents
      .filter((e): e is NonNullable<typeof e> => e !== undefined)
      .sort((a, b) => b.block_number - a.block_number); // Descending order (newest first)

    // Apply pagination if provided
    if (page && limit) {
      const total_count = sorted.length;
      const total_pages = Math.ceil(total_count / limit);
      const start = (page - 1) * limit;
      const end = start + limit;
      const data = sorted.slice(start, end);

      return {
        data,
        meta: {
          current_page: page,
          total_pages,
          total_count,
          has_more: page < total_pages,
        },
      };
    }

    return sorted;
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
        is_admin: userInfo.is_admin,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching user by wallet address:', error);
      throw new NotFoundException('User not found on blockchain');
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

  async grantAdminToUser(walletAddress: string) {
    try {
      if (!this.userRegistryContract) {
        throw new BadRequestException('UserRegistry not configured');
      }

      const tx = await this.userRegistryContract.grantAdmin(walletAddress);
      await tx.wait();
      console.log(`✅ Admin privileges granted: ${walletAddress}`);
    } catch (error) {
      console.error('❌ Failed to grant admin privileges:', error);
      throw new BadRequestException(
        error.reason || error.message || 'Failed to grant admin privileges',
      );
    }
  }

  async revokeAdminFromUser(walletAddress: string) {
    try {
      if (!this.userRegistryContract) {
        throw new BadRequestException('UserRegistry not configured');
      }

      // Check if this is the last admin
      const allUsers = await this.getAllUsersFromBlockchain();
      const admins = allUsers.filter((user) => user.is_admin);

      // If this is the only admin left, prevent removal
      if (
        admins.length === 1 &&
        admins[0].wallet_address.toLowerCase() === walletAddress.toLowerCase()
      ) {
        throw new BadRequestException(
          'Cannot revoke admin privileges from the last remaining admin',
        );
      }

      const tx = await this.userRegistryContract.revokeAdmin(walletAddress);
      await tx.wait();
      console.log(`✅ Admin privileges revoked: ${walletAddress}`);
    } catch (error) {
      console.error('❌ Failed to revoke admin privileges:', error);
      throw new BadRequestException(
        error.reason || error.message || 'Failed to revoke admin privileges',
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
            is_admin: userInfo.is_admin,
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

  async enhancedSearch(query: string) {
    if (!query || query.trim().length === 0) {
      return { studentIds: [], certificates: [], users: [] };
    }

    const searchQuery = query.trim();

    try {
      // Search Student IDs (substring matching, case-insensitive)
      const allCerts = await this.getAllCertificates();
      const uniqueStudentIds = Array.from(
        new Set(allCerts.map((cert) => cert.student_id)),
      );
      const matchingStudentIds = uniqueStudentIds
        .filter((studentId) =>
          studentId.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .slice(0, 5); // Limit to 5 results

      // Search Certificate Hashes (exact matching, case-insensitive)
      const matchingCertificates = allCerts
        .filter(
          (cert) => cert.cert_hash.toLowerCase() === searchQuery.toLowerCase(),
        )
        .map((cert) => ({
          cert_hash: cert.cert_hash,
          student_id: cert.student_id,
          is_active: !cert.is_revoked,
        }))
        .slice(0, 5); // Limit to 5 results

      // Search Wallet Addresses (exact matching, case-insensitive)
      // Get all registered users
      const userRegisteredFilter =
        this.userRegistryContract.filters.UserRegistered();
      const userEvents =
        await this.userRegistryContract.queryFilter(userRegisteredFilter);

      const matchingUsers: Array<{
        wallet_address: string;
        username: string;
        email: string;
        is_authorized: boolean;
      }> = [];
      for (const event of userEvents) {
        if ('args' in event) {
          const walletAddress = event.args.wallet_address;
          if (walletAddress.toLowerCase() === searchQuery.toLowerCase()) {
            try {
              const user =
                await this.userRegistryContract.getUser(walletAddress);
              matchingUsers.push({
                wallet_address: walletAddress,
                username: user.username,
                email: user.email,
                is_authorized: user.is_authorized,
              });
            } catch (error) {
              console.warn('Failed to get user details:', walletAddress);
            }
          }
        }
      }

      return {
        studentIds: matchingStudentIds,
        certificates: matchingCertificates,
        users: matchingUsers.slice(0, 5), // Limit to 5 results
      };
    } catch (error) {
      console.error('Enhanced search error:', error);
      throw new BadRequestException('Failed to perform search');
    }
  }

  async getStats(walletAddress: string) {
    try {
      // Get all certificates by querying events
      const issuedFilter = this.certificateContract.filters.CertificateIssued();
      const issuedEvents =
        await this.certificateContract.queryFilter(issuedFilter);

      // Count active certificates (non-revoked)
      let activeCertificatesCount = 0;
      for (const event of issuedEvents) {
        if ('args' in event) {
          try {
            const cert = await this.certificateContract.verifyCertificate(
              event.args.cert_hash,
            );
            if (!cert.is_revoked) {
              activeCertificatesCount++;
            }
          } catch {
            // Skip certificates that can't be verified
          }
        }
      }

      // Get all users
      const userRegisteredFilter =
        this.userRegistryContract.filters.UserRegistered();
      const userEvents =
        await this.userRegistryContract.queryFilter(userRegisteredFilter);

      // Count authorized users
      let authorizedUsersCount = 0;
      for (const event of userEvents) {
        if ('args' in event) {
          try {
            const user = await this.userRegistryContract.getUser(
              event.args.wallet_address,
            );
            if (user.is_authorized) {
              authorizedUsersCount++;
            }
          } catch {
            // Skip users that can't be fetched
          }
        }
      }

      // Count certificates issued by this user
      const userIssuedFilter =
        this.certificateContract.filters.CertificateIssued(
          null,
          null,
          null,
          walletAddress,
        );
      const userIssuedEvents =
        await this.certificateContract.queryFilter(userIssuedFilter);
      const certificatesIssuedByMe = userIssuedEvents.length;

      // Get recent activity (last 3 logs for this user)
      const recentActivity = await this.getUserAuditLogs(walletAddress);
      const recentActivityData = Array.isArray(recentActivity)
        ? recentActivity.slice(0, 3)
        : recentActivity.data.slice(0, 3);

      return {
        active_certificates: activeCertificatesCount,
        authorized_users: authorizedUsersCount,
        certificates_issued_by_me: certificatesIssuedByMe,
        recent_activity: recentActivityData,
      };
    } catch (error) {
      console.error('Stats error:', error);
      throw new BadRequestException('Failed to fetch statistics');
    }
  }
}
