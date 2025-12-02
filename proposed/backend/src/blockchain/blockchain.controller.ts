import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { AuthorizedGuard } from '../auth/authorized.guard';
import { BlockchainService } from './blockchain.service';
import { PdfService } from './pdf.service';
import {
  IssueCertificateDto,
  VerifyCertificateDto,
  UpdateCertificateDto,
} from './dto/certificate.dto';
import { RegisterUserDto } from './dto/user.dto';

@Controller('api/blockchain')
export class BlockchainController {
  constructor(
    private blockchainService: BlockchainService,
    private pdfService: PdfService,
  ) {}

  // ========== USER MANAGEMENT ENDPOINTS ==========

  @UseGuards(AuthGuard('jwt'))
  @Get('users/me')
  async getMyProfile(@Request() req) {
    return this.blockchainService.getUserByWalletAddress(
      req.user.walletAddress,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('users/register')
  async registerUser(@Body() dto: RegisterUserDto) {
    return this.blockchainService.registerNewUser(
      dto.username,
      dto.email,
      dto.is_admin || false,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('users')
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'authorized' | 'revoked',
  ) {
    const allUsers = await this.blockchainService.getAllUsersFromBlockchain();

    // Filter by status if provided
    let filtered = allUsers;
    if (status === 'authorized') {
      filtered = allUsers.filter((u) => u.is_authorized);
    } else if (status === 'revoked') {
      filtered = allUsers.filter((u) => !u.is_authorized);
    }

    // Return all if no pagination params
    if (!page || !limit) {
      return filtered;
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      meta: {
        current_page: pageNum,
        total_pages: Math.ceil(filtered.length / limitNum),
        total_count: filtered.length,
        has_more: end < filtered.length,
      },
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('users/:wallet_address')
  async getUserByWalletAddress(
    @Param('wallet_address') wallet_address: string,
  ) {
    return this.blockchainService.getUserByWalletAddress(wallet_address);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch('users/:wallet_address/revoke')
  async revokeUser(@Param('wallet_address') wallet_address: string) {
    await this.blockchainService.revokeUserOnBlockchain(wallet_address);
    return {
      success: true,
      message: 'User authorization revoked',
      wallet_address,
    };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch('users/:wallet_address/reactivate')
  async reactivateUser(@Param('wallet_address') wallet_address: string) {
    await this.blockchainService.reactivateUserOnBlockchain(wallet_address);
    return {
      success: true,
      message: 'User authorization restored',
      wallet_address,
    };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch('users/:wallet_address/grant-admin')
  async grantAdmin(@Param('wallet_address') wallet_address: string) {
    await this.blockchainService.grantAdminToUser(wallet_address);
    return {
      success: true,
      message: 'Admin privileges granted',
      wallet_address,
    };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch('users/:wallet_address/revoke-admin')
  async revokeAdmin(@Param('wallet_address') wallet_address: string) {
    await this.blockchainService.revokeAdminFromUser(wallet_address);
    return {
      success: true,
      message: 'Admin privileges revoked',
      wallet_address,
    };
  }

  // ========== CERTIFICATE ENDPOINTS ==========

  @UseGuards(AuthGuard('jwt'), AuthorizedGuard)
  @Post('certificates')
  async issueCertificate(@Body() dto: IssueCertificateDto, @Request() req) {
    return this.blockchainService.issueCertificate(
      dto.student_id,
      dto.student_name,
      dto.degree,
      dto.program,
      dto.cgpa,
      dto.issuing_authority,
      req.user.username,
      req.user.walletAddress,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('certificates')
  async getAllCertificates(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'active' | 'revoked',
  ) {
    const allCerts = await this.blockchainService.getAllCertificates();

    // Filter by status if provided
    let filtered = allCerts;
    if (status === 'active') {
      filtered = allCerts.filter((c) => !c.is_revoked);
    } else if (status === 'revoked') {
      filtered = allCerts.filter((c) => c.is_revoked);
    }

    // Return all if no pagination params
    if (!page || !limit) {
      return filtered;
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      meta: {
        current_page: pageNum,
        total_pages: Math.ceil(filtered.length / limitNum),
        total_count: filtered.length,
        has_more: end < filtered.length,
      },
    };
  }

  // PDF routes must come before :cert_hash routes
  @Get('certificates/:cert_hash/download')
  async downloadCertificate(
    @Param('cert_hash') cert_hash: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const certificate =
      await this.blockchainService.verifyCertificate(cert_hash);
    const pdfBuffer = await this.pdfService.generateCertificatePdf(certificate);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${certificate.student_id}-v${certificate.version}.pdf"`,
    });

    return new StreamableFile(pdfBuffer);
  }

  @Get('certificates/:cert_hash/preview')
  async previewCertificate(
    @Param('cert_hash') cert_hash: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const certificate =
      await this.blockchainService.verifyCertificate(cert_hash);
    const pngBuffer = await this.pdfService.generateCertificatePng(certificate);

    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    return new StreamableFile(pngBuffer);
  }

  @Get('certificates/verify/:cert_hash')
  async verifyCertificate(@Param('cert_hash') cert_hash: string) {
    return this.blockchainService.verifyCertificate(cert_hash);
  }

  @Get('certificates/student/:student_id/active')
  async getActiveCertificate(@Param('student_id') student_id: string) {
    return this.blockchainService.getActiveCertificateByStudentId(student_id);
  }

  @Get('certificates/student/:student_id/versions')
  async getAllVersions(@Param('student_id') student_id: string) {
    return this.blockchainService.getAllVersionsByStudentId(student_id);
  }

  @UseGuards(AuthGuard('jwt'), AuthorizedGuard)
  @Patch('certificates/:cert_hash/revoke')
  async revokeCertificate(@Param('cert_hash') cert_hash: string) {
    return this.blockchainService.revokeCertificate(cert_hash);
  }

  @UseGuards(AuthGuard('jwt'), AuthorizedGuard)
  @Patch('certificates/:cert_hash/reactivate')
  async reactivateCertificate(@Param('cert_hash') cert_hash: string) {
    return this.blockchainService.reactivateCertificate(cert_hash);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('certificates/audit-logs')
  async getAuditLogs(@Query('cert_hash') cert_hash: string) {
    return this.blockchainService.getAuditLogs(cert_hash);
  }
}
