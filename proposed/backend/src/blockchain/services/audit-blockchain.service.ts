import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class AuditBlockchainService {
  private certificateContract: ethers.Contract;
  private provider: ethers.JsonRpcProvider;

  setCertificateContract(contract: ethers.Contract) {
    this.certificateContract = contract;
  }

  setProvider(provider: ethers.JsonRpcProvider) {
    this.provider = provider;
  }

  private async processEvent(
    event: any,
    action: 'ISSUED' | 'REVOKED' | 'REACTIVATED',
  ) {
    if (!('args' in event) || !event.blockNumber) return null;

    const block = await this.provider.getBlock(event.blockNumber);
    const baseLog = {
      action,
      cert_hash: event.args.cert_hash,
      block_number: Number(event.args.block_number),
      transaction_hash: event.transactionHash,
      timestamp: block ? new Date(block.timestamp * 1000).toISOString() : null,
    };

    if (action === 'ISSUED') {
      return {
        ...baseLog,
        issuer: event.args.issuer,
        ...(event.args.student_id && { student_id: event.args.student_id }),
        ...(event.args.version && { version: Number(event.args.version) }),
      };
    }

    if (action === 'REVOKED') {
      return {
        ...baseLog,
        ...(event.args.revoked_by && { revoked_by: event.args.revoked_by }),
      };
    }

    if (action === 'REACTIVATED') {
      return {
        ...baseLog,
        ...(event.args.reactivated_by && {
          reactivated_by: event.args.reactivated_by,
        }),
      };
    }

    return baseLog;
  }

  private async processEvents(
    issuedEvents: any[],
    revokedEvents: any[],
    reactivatedEvents: any[],
  ) {
    const allEvents = await Promise.all([
      ...issuedEvents.map((e) => this.processEvent(e, 'ISSUED')),
      ...revokedEvents.map((e) => this.processEvent(e, 'REVOKED')),
      ...reactivatedEvents.map((e) => this.processEvent(e, 'REACTIVATED')),
    ]);

    return allEvents
      .filter((e): e is NonNullable<typeof e> => e !== null && e !== undefined)
      .sort((a, b) => b.block_number - a.block_number);
  }

  private applyPagination(data: any[], page?: number, limit?: number) {
    if (!page || !limit) return data;

    const total_count = data.length;
    const total_pages = Math.ceil(total_count / limit);
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      data: data.slice(start, end),
      meta: {
        current_page: page,
        total_pages,
        total_count,
        has_more: page < total_pages,
      },
    };
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

    return this.processEvents(issuedEvents, revokedEvents, reactivatedEvents);
  }

  async getAllAuditLogs(page?: number, limit?: number) {
    const issuedFilter = this.certificateContract.filters.CertificateIssued();
    const revokedFilter = this.certificateContract.filters.CertificateRevoked();
    const reactivatedFilter =
      this.certificateContract.filters.CertificateReactivated();

    const [issuedEvents, revokedEvents, reactivatedEvents] = await Promise.all([
      this.certificateContract.queryFilter(issuedFilter),
      this.certificateContract.queryFilter(revokedFilter),
      this.certificateContract.queryFilter(reactivatedFilter),
    ]);

    const sorted = await this.processEvents(
      issuedEvents,
      revokedEvents,
      reactivatedEvents,
    );
    return this.applyPagination(sorted, page, limit);
  }

  async getUserAuditLogs(walletAddress: string, page?: number, limit?: number) {
    const issuedFilter = this.certificateContract.filters.CertificateIssued(
      null,
      null,
      null,
      walletAddress,
    );

    const revokedFilter = this.certificateContract.filters.CertificateRevoked(
      null,
      walletAddress,
    );

    const reactivatedFilter =
      this.certificateContract.filters.CertificateReactivated(
        null,
        walletAddress,
      );

    const [issuedEvents, revokedEvents, reactivatedEvents] = await Promise.all([
      this.certificateContract.queryFilter(issuedFilter),
      this.certificateContract.queryFilter(revokedFilter),
      this.certificateContract.queryFilter(reactivatedFilter),
    ]);

    const sorted = await this.processEvents(
      issuedEvents,
      revokedEvents,
      reactivatedEvents,
    );
    return this.applyPagination(sorted, page, limit);
  }
}
