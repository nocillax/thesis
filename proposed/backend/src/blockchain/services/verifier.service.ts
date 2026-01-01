import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Verifier } from '../entities/verifier.entity';
import { VerificationLog } from '../entities/verification-log.entity';
import { BlockedVerifier } from '../entities/blocked-verifier.entity';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class VerifierService {
  constructor(
    @InjectRepository(Verifier)
    private verifierRepository: Repository<Verifier>,
    @InjectRepository(VerificationLog)
    private verificationLogRepository: Repository<VerificationLog>,
    @InjectRepository(BlockedVerifier)
    private blockedVerifierRepository: Repository<BlockedVerifier>,
    @Inject(RateLimitService)
    private rateLimitService: RateLimitService,
  ) {}

  async createOrGetVerifier(
    name: string,
    email: string,
    institution: string,
    website: string,
  ) {
    let verifier = await this.verifierRepository.findOne({ where: { email } });

    if (!verifier) {
      verifier = this.verifierRepository.create({
        name,
        email,
        institution,
        website,
        created_at: Math.floor(Date.now() / 1000),
      });
      await this.verifierRepository.save(verifier);
    } else {
      // Update verifier info if it changed
      verifier.name = name;
      verifier.institution = institution;
      verifier.website = website;
      await this.verifierRepository.save(verifier);
    }

    return verifier;
  }

  async logVerification(
    verifierId: number,
    certHash: string,
    ipAddress: string,
    userAgent?: string,
  ) {
    const log = this.verificationLogRepository.create({
      verifier_id: verifierId,
      cert_hash: certHash,
      ip_address: ipAddress,
      user_agent: userAgent,
      verified_at: Math.floor(Date.now() / 1000), // Unix timestamp in seconds, matching blockchain
    });

    return this.verificationLogRepository.save(log);
  }

  async isBlocked(ipAddress: string): Promise<boolean> {
    const blocked = await this.blockedVerifierRepository.findOne({
      where: {
        ip_address: ipAddress,
        blocked_until: MoreThan(Math.floor(Date.now() / 1000)),
      },
    });

    return !!blocked;
  }

  async blockVerifier(
    ipAddress: string,
    durationMinutes: number,
    reason: string,
    blockedByWalletAddress: string,
  ) {
    const blockedUntil = Math.floor(Date.now() / 1000) + durationMinutes * 60;

    const existing = await this.blockedVerifierRepository.findOne({
      where: { ip_address: ipAddress },
    });

    if (existing) {
      existing.blocked_until = blockedUntil;
      existing.reason = reason;
      existing.blocked_by_wallet_address = blockedByWalletAddress;
      return this.blockedVerifierRepository.save(existing);
    }

    const blocked = this.blockedVerifierRepository.create({
      ip_address: ipAddress,
      blocked_until: blockedUntil,
      reason,
      blocked_by_wallet_address: blockedByWalletAddress,
      created_at: Math.floor(Date.now() / 1000),
    });

    return this.blockedVerifierRepository.save(blocked);
  }

  async unblockVerifier(ipAddress: string) {
    await this.blockedVerifierRepository.delete({ ip_address: ipAddress });
    // Clear rate limit attempts cache when manually unblocking
    this.rateLimitService.clearAttempts(ipAddress);
  }

  async getAllVerificationLogs(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'verified_at',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const validSortFields = ['verified_at', 'id'];
    const orderField = validSortFields.includes(sortBy)
      ? sortBy
      : 'verified_at';

    // Build order object dynamically
    const orderObj: any = {};
    orderObj[orderField] = sortOrder;

    const [logs, total] = await this.verificationLogRepository.findAndCount({
      relations: ['verifier'],
      order: orderObj,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: logs,
      meta: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_count: total,
        has_more: page * limit < total,
      },
    };
  }

  async getBlockedVerifiers() {
    return this.blockedVerifierRepository.find({
      where: { blocked_until: MoreThan(Math.floor(Date.now() / 1000)) },
      order: { created_at: 'DESC' },
    });
  }
}
