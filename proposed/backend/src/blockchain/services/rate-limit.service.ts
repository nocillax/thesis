import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import NodeCache from 'node-cache';
import { BlockedVerifier } from '../entities/blocked-verifier.entity';

interface VerificationAttempt {
  count: number;
  timestamps: number[];
}

@Injectable()
export class RateLimitService {
  private cache: NodeCache;
  private readonly ATTEMPT_WINDOW = 15 * 60; // 15 minutes in seconds
  private readonly MAX_ATTEMPTS = 5;
  private readonly BLOCK_DURATION = 60 * 60; // 60 minutes in seconds

  constructor(
    @InjectRepository(BlockedVerifier)
    private blockedVerifierRepository: Repository<BlockedVerifier>,
  ) {
    // Cache with 15 minute TTL for attempt tracking
    this.cache = new NodeCache({
      stdTTL: this.ATTEMPT_WINDOW,
      checkperiod: 60, // Check for expired keys every 60 seconds
    });
  }

  /**
   * Check if IP is currently blocked
   * Checks both cache and database for active blocks
   */
  async isBlocked(ipAddress: string): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);

    // Check database for active blocks
    const dbBlock = await this.blockedVerifierRepository.findOne({
      where: { ip_address: ipAddress },
    });

    if (dbBlock && dbBlock.blocked_until > now) {
      return true;
    }

    // If block expired, remove from database
    if (dbBlock && dbBlock.blocked_until <= now) {
      await this.blockedVerifierRepository.remove(dbBlock);
    }

    return false;
  }

  /**
   * Record a verification attempt
   * Returns true if rate limit exceeded (should be blocked)
   */
  async recordAttempt(
    ipAddress: string,
    certHash: string,
  ): Promise<{ blocked: boolean; remainingAttempts: number }> {
    // Check if already blocked
    const alreadyBlocked = await this.isBlocked(ipAddress);
    if (alreadyBlocked) {
      return { blocked: true, remainingAttempts: 0 };
    }

    const key = `${ipAddress}:${certHash}`;
    const now = Date.now();

    // Get existing attempts for this IP+hash combination
    let attempt = this.cache.get<VerificationAttempt>(key);

    if (!attempt) {
      attempt = { count: 0, timestamps: [] };
    }

    // Filter out timestamps outside the 15-minute window
    attempt.timestamps = attempt.timestamps.filter(
      (timestamp) => now - timestamp < this.ATTEMPT_WINDOW * 1000,
    );

    // Add current attempt
    attempt.timestamps.push(now);
    attempt.count = attempt.timestamps.length;

    // Update cache
    this.cache.set(key, attempt);

    // Check if rate limit exceeded
    if (attempt.count >= this.MAX_ATTEMPTS) {
      await this.autoBlock(ipAddress, certHash);
      return { blocked: true, remainingAttempts: 0 };
    }

    return {
      blocked: false,
      remainingAttempts: this.MAX_ATTEMPTS - attempt.count,
    };
  }

  /**
   * Automatically block an IP address due to rate limit exceeded
   */
  private async autoBlock(ipAddress: string, certHash: string): Promise<void> {
    const blockedUntil = Math.floor(Date.now() / 1000) + this.BLOCK_DURATION;

    // Check if already blocked
    const existing = await this.blockedVerifierRepository.findOne({
      where: { ip_address: ipAddress },
    });

    if (existing) {
      // Extend block duration
      existing.blocked_until = blockedUntil;
      existing.reason = `Rate limit exceeded: ${this.MAX_ATTEMPTS} attempts on certificate ${certHash} within ${this.ATTEMPT_WINDOW / 60} minutes`;
      await this.blockedVerifierRepository.save(existing);
    } else {
      // Create new block
      const block = this.blockedVerifierRepository.create({
        ip_address: ipAddress,
        blocked_until: blockedUntil,
        reason: `Rate limit exceeded: ${this.MAX_ATTEMPTS} attempts on certificate ${certHash} within ${this.ATTEMPT_WINDOW / 60} minutes`,
        blocked_by_wallet_address: 'system', // Auto-block by system
        created_at: Math.floor(Date.now() / 1000),
      });
      await this.blockedVerifierRepository.save(block);
    }

    // Clear cache for this IP (fresh start after unblock)
    const keys = this.cache.keys();
    keys.forEach((key) => {
      if (key.startsWith(`${ipAddress}:`)) {
        this.cache.del(key);
      }
    });
  }

  /**
   * Get remaining attempts for IP+hash combination
   */
  getRemainingAttempts(ipAddress: string, certHash: string): number {
    const key = `${ipAddress}:${certHash}`;
    const attempt = this.cache.get<VerificationAttempt>(key);

    if (!attempt) {
      return this.MAX_ATTEMPTS;
    }

    const now = Date.now();
    const recentAttempts = attempt.timestamps.filter(
      (timestamp) => now - timestamp < this.ATTEMPT_WINDOW * 1000,
    );

    return Math.max(0, this.MAX_ATTEMPTS - recentAttempts.length);
  }

  /**
   * Clear all cached attempts for an IP (useful when unblocking)
   */
  clearAttempts(ipAddress: string): void {
    const keys = this.cache.keys();
    keys.forEach((key) => {
      if (key.startsWith(`${ipAddress}:`)) {
        this.cache.del(key);
      }
    });
  }
}
