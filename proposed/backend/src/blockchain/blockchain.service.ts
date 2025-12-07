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
import { UserBlockchainService } from './services/user-blockchain.service';
import { CertificateBlockchainService } from './services/certificate-blockchain.service';
import { AuditBlockchainService } from './services/audit-blockchain.service';
import { BlockchainClientService } from './services/blockchain-client.service';

@Injectable()
export class BlockchainService implements OnModuleInit {
  constructor(
    private configService: ConfigService,
    private blockchainClient: BlockchainClientService,
    private userBlockchainService: UserBlockchainService,
    private certificateBlockchainService: CertificateBlockchainService,
    private auditBlockchainService: AuditBlockchainService,
  ) {}

  async onModuleInit() {
    await this.blockchainClient.initialize(this.configService);

    const provider = this.blockchainClient.getProvider();
    const adminWallet = this.blockchainClient.getAdminWallet();
    const certificateContract = this.blockchainClient.getCertificateContract();
    const userRegistryContract =
      this.blockchainClient.getUserRegistryContract();

    this.certificateBlockchainService.setCertificateContract(
      certificateContract,
    );
    this.certificateBlockchainService.setAdminWallet(adminWallet);

    this.auditBlockchainService.setProvider(provider);
    this.auditBlockchainService.setCertificateContract(certificateContract);

    if (userRegistryContract) {
      this.userBlockchainService.setUserRegistryContract(userRegistryContract);
      this.certificateBlockchainService.setUserRegistryContract(
        userRegistryContract,
      );
    }
  }

  async registerNewUser(
    username: string,
    email: string,
    is_admin: boolean = false,
  ) {
    return this.userBlockchainService.registerNewUser(
      username,
      email,
      is_admin,
    );
  }

  computeHash(
    student_id: string,
    student_name: string,
    degree_program: string,
    cgpa: number,
    version: number,
    issuance_date: number,
  ): string {
    return this.certificateBlockchainService.computeHash(
      student_id,
      student_name,
      degree_program,
      cgpa,
      version,
      issuance_date,
    );
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
    return this.certificateBlockchainService.issueCertificate(
      student_id,
      student_name,
      degree,
      program,
      cgpa,
      issuing_authority,
      username,
      walletAddress,
    );
  }

  async verifyCertificate(cert_hash: string) {
    return this.certificateBlockchainService.verifyCertificate(cert_hash);
  }

  async revokeCertificate(cert_hash: string, actor_address: string) {
    return this.certificateBlockchainService.revokeCertificate(
      cert_hash,
      actor_address,
    );
  }

  async reactivateCertificate(cert_hash: string, actor_address: string) {
    return this.certificateBlockchainService.reactivateCertificate(
      cert_hash,
      actor_address,
    );
  }

  async getAuditLogs(cert_hash: string) {
    return this.auditBlockchainService.getAuditLogs(cert_hash);
  }

  async getAllAuditLogs(page?: number, limit?: number) {
    return this.auditBlockchainService.getAllAuditLogs(page, limit);
  }

  async getUserAuditLogs(walletAddress: string, page?: number, limit?: number) {
    return this.auditBlockchainService.getUserAuditLogs(
      walletAddress,
      page,
      limit,
    );
  }

  async getUserByWalletAddress(walletAddress: string) {
    return this.userBlockchainService.getUserByWalletAddress(walletAddress);
  }

  async revokeUserOnBlockchain(walletAddress: string) {
    return this.userBlockchainService.revokeUserOnBlockchain(walletAddress);
  }

  async reactivateUserOnBlockchain(walletAddress: string) {
    return this.userBlockchainService.reactivateUserOnBlockchain(walletAddress);
  }

  async grantAdminToUser(walletAddress: string) {
    return this.userBlockchainService.grantAdminToUser(walletAddress);
  }

  async revokeAdminFromUser(walletAddress: string) {
    return this.userBlockchainService.revokeAdminFromUser(walletAddress);
  }

  async getAllCertificates() {
    return this.certificateBlockchainService.getAllCertificates();
  }

  async getAllUsersFromBlockchain() {
    return this.userBlockchainService.getAllUsersFromBlockchain();
  }

  async getActiveCertificateByStudentId(student_id: string) {
    return this.certificateBlockchainService.getActiveCertificateByStudentId(
      student_id,
    );
  }

  async getAllVersionsByStudentId(student_id: string) {
    return this.certificateBlockchainService.getAllVersionsByStudentId(
      student_id,
    );
  }

  async enhancedSearch(query: string) {
    return this.certificateBlockchainService.enhancedSearch(query);
  }

  async getStats(walletAddress: string) {
    try {
      const certificateContract =
        this.blockchainClient.getCertificateContract();
      const userRegistryContract =
        this.blockchainClient.getUserRegistryContract();

      const issuedFilter = certificateContract.filters.CertificateIssued();
      const issuedEvents = await certificateContract.queryFilter(issuedFilter);

      let activeCertificatesCount = 0;
      for (const event of issuedEvents) {
        if ('args' in event) {
          try {
            const cert = await certificateContract.verifyCertificate(
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

      const userRegisteredFilter =
        userRegistryContract.filters.UserRegistered();
      const userEvents =
        await userRegistryContract.queryFilter(userRegisteredFilter);

      let authorizedUsersCount = 0;
      for (const event of userEvents) {
        if ('args' in event) {
          try {
            const user = await userRegistryContract.getUser(
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

      const userIssuedFilter = certificateContract.filters.CertificateIssued(
        null,
        null,
        null,
        walletAddress,
      );
      const userIssuedEvents =
        await certificateContract.queryFilter(userIssuedFilter);
      const certificatesIssuedByMe = userIssuedEvents.length;

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
