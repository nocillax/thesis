import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class CertificateBlockchainService {
  private certificateContract: ethers.Contract;
  private userRegistryContract: ethers.Contract;
  private adminWallet: ethers.Wallet;

  setCertificateContract(contract: ethers.Contract) {
    this.certificateContract = contract;
  }

  setUserRegistryContract(contract: ethers.Contract) {
    this.userRegistryContract = contract;
  }

  setAdminWallet(wallet: ethers.Wallet) {
    this.adminWallet = wallet;
  }

  private async getIssuerName(issuerAddress: string): Promise<string> {
    try {
      if (!this.userRegistryContract) return 'Unknown';
      const userInfo = await this.userRegistryContract.getUser(issuerAddress);
      return userInfo.username;
    } catch (error) {
      console.warn(`⚠️  Could not fetch issuer name for ${issuerAddress}`);
      return 'Unknown';
    }
  }

  private isCertificateNotFoundError(error: any): boolean {
    return error.message?.includes('Certificate does not exist');
  }

  private isNoCertificateFoundError(error: any): boolean {
    return error.message?.includes('No certificates found');
  }

  private isNoActiveCertificateError(error: any): boolean {
    return error.message?.includes('No active certificate');
  }

  private formatTimestamp(timestamp: number): string | null {
    return timestamp > 0 ? new Date(timestamp * 1000).toISOString() : null;
  }

  private handleCommonErrors(error: any, defaultMessage: string): never {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    if (error.reason) {
      throw new BadRequestException(error.reason);
    }

    if (error.code === 'CALL_EXCEPTION' && error.revert?.args?.[0]) {
      throw new BadRequestException(error.revert.args[0]);
    }

    throw new BadRequestException(error.message || defaultMessage);
  }

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

      const signature = await this.adminWallet.signMessage(
        ethers.getBytes(cert_hash),
      );
      const cgpa_scaled = Math.round(cgpa * 100);

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
      this.handleCommonErrors(error, 'Failed to issue certificate');
    }
  }

  async verifyCertificate(cert_hash: string) {
    try {
      const result =
        await this.certificateContract.verifyCertificate(cert_hash);
      const issuerName = await this.getIssuerName(result.issuer);
      const issuanceTimestamp = Number(result.issuance_date);

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
        issuance_date: this.formatTimestamp(issuanceTimestamp),
      };
    } catch (error) {
      if (this.isCertificateNotFoundError(error)) {
        throw new NotFoundException('Certificate does not exist');
      }
      throw new BadRequestException(
        error.message || 'Failed to verify certificate',
      );
    }
  }

  async revokeCertificate(cert_hash: string, actor_address: string) {
    try {
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
      this.handleCommonErrors(error, 'Failed to revoke certificate');
    }
  }

  async reactivateCertificate(cert_hash: string, actor_address: string) {
    try {
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
      this.handleCommonErrors(error, 'Failed to reactivate certificate');
    }
  }

  async getAllCertificates() {
    try {
      const issuedFilter = this.certificateContract.filters.CertificateIssued();
      const issuedEvents =
        await this.certificateContract.queryFilter(issuedFilter);

      const certificates = await Promise.all(
        issuedEvents.map(async (event) => {
          if ('args' in event) {
            const cert_hash = event.args.cert_hash;
            try {
              return await this.verifyCertificate(cert_hash);
            } catch (error) {
              console.warn(
                `Could not retrieve certificate ${cert_hash}:`,
                error.message,
              );
              return null;
            }
          }
          return null;
        }),
      );

      return certificates.filter((cert) => cert !== null);
    } catch (error) {
      console.error('❌ Failed to get all certificates:', error);
      throw new BadRequestException(
        error.message || 'Failed to get all certificates',
      );
    }
  }

  async getActiveCertificateByStudentId(student_id: string) {
    try {
      const activeCert =
        await this.certificateContract.getActiveCertificate(student_id);
      const issuerName = await this.getIssuerName(activeCert.issuer);
      const issuanceTimestamp = Number(activeCert.issuance_date);

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
        issuance_date: this.formatTimestamp(issuanceTimestamp),
      };
    } catch (error) {
      if (this.isNoActiveCertificateError(error)) {
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

      const versions = await Promise.all(
        hashes.map(async (hash: string) => {
          try {
            return await this.verifyCertificate(hash);
          } catch (error) {
            console.warn(
              `Could not retrieve certificate ${hash}:`,
              error.message,
            );
            return null;
          }
        }),
      );

      return versions.filter((cert) => cert !== null);
    } catch (error) {
      if (this.isNoCertificateFoundError(error)) {
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
      const allCerts = await this.getAllCertificates();
      const uniqueStudentIds = Array.from(
        new Set(allCerts.map((cert) => cert.student_id)),
      );
      const matchingStudentIds = uniqueStudentIds
        .filter((studentId) =>
          studentId.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .slice(0, 5);

      const matchingCertificates = allCerts
        .filter(
          (cert) => cert.cert_hash.toLowerCase() === searchQuery.toLowerCase(),
        )
        .map((cert) => ({
          cert_hash: cert.cert_hash,
          student_id: cert.student_id,
          is_active: !cert.is_revoked,
        }))
        .slice(0, 5);

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
        users: matchingUsers.slice(0, 5),
      };
    } catch (error) {
      console.error('Enhanced search error:', error);
      throw new BadRequestException('Failed to perform search');
    }
  }
}
