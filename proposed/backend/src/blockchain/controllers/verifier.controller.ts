import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Ip,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import { VerifierService } from '../services/verifier.service';
import { RateLimitService } from '../services/rate-limit.service';

@Controller('verifiers')
export class VerifierController {
  constructor(
    private readonly verifierService: VerifierService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  @Post('submit')
  async submitVerifierInfo(
    @Body()
    dto: {
      name: string;
      email: string;
      institution: string;
      website: string;
      cert_hash: string;
    },
    @Ip() ip: string,
    @Request() req,
  ) {
    // Extract real IP from headers (for proxies/load balancers)
    // For localhost, this will be ::1 (IPv6) or 127.0.0.1 (IPv4)
    const realIp =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      req.ip ||
      ip;

    const userAgent = req.headers['user-agent'];

    // Check if IP is blocked
    const isBlocked = await this.rateLimitService.isBlocked(realIp);
    if (isBlocked) {
      throw new BadRequestException(
        'Too many verification attempts. Your IP address has been temporarily blocked. Please try again later.',
      );
    }

    // Record this verification attempt and check rate limit
    const { blocked, remainingAttempts } =
      await this.rateLimitService.recordAttempt(realIp, dto.cert_hash);

    if (blocked) {
      throw new BadRequestException(
        `Rate limit exceeded. You have made too many verification attempts. Your IP address has been blocked for 60 minutes.`,
      );
    }

    const verifier = await this.verifierService.createOrGetVerifier(
      dto.name,
      dto.email,
      dto.institution,
      dto.website,
    );

    await this.verifierService.logVerification(
      verifier.id,
      dto.cert_hash,
      realIp,
      userAgent,
    );

    return {
      success: true,
      verifier_id: verifier.id,
      remaining_attempts: remainingAttempts,
    };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('logs')
  async getVerificationLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.verifierService.getAllVerificationLogs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      sortBy || 'verified_at',
      sortOrder || 'DESC',
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('blocked')
  async getBlockedVerifiers() {
    return this.verifierService.getBlockedVerifiers();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('block')
  async blockVerifier(
    @Body()
    dto: { ip_address: string; duration_minutes: number; reason: string },
    @Request() req,
  ) {
    return this.verifierService.blockVerifier(
      dto.ip_address,
      dto.duration_minutes,
      dto.reason,
      req.user.walletAddress,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete('unblock/:ip_address')
  async unblockVerifier(@Param('ip_address') ipAddress: string) {
    await this.verifierService.unblockVerifier(ipAddress);
    // Clear cached attempts when manually unblocking
    this.rateLimitService.clearAttempts(ipAddress);
    return { success: true };
  }
}
