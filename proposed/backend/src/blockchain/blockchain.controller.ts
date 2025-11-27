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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { BlockchainService } from './blockchain.service';
import {
  IssueCertificateDto,
  VerifyCertificateDto,
  UpdateCertificateDto,
} from './dto/certificate.dto';

@Controller('api/blockchain/certificates')
export class BlockchainController {
  constructor(private blockchainService: BlockchainService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  async issueCertificate(@Body() dto: IssueCertificateDto, @Request() req) {
    return this.blockchainService.issueCertificate(
      dto.certificate_number,
      dto.student_id,
      dto.student_name,
      dto.degree_program,
      dto.cgpa,
      dto.issuing_authority,
      req.user.username,
      req.user.walletAddress,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get()
  async getAllCertificates() {
    return this.blockchainService.getAllCertificates();
  }

  @Get('verify/:cert_hash')
  async verifyCertificate(@Param('cert_hash') cert_hash: string) {
    return this.blockchainService.verifyCertificate(cert_hash);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':cert_hash/revoke')
  async revokeCertificate(@Param('cert_hash') cert_hash: string) {
    return this.blockchainService.revokeCertificate(cert_hash);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':cert_hash/reactivate')
  async reactivateCertificate(@Param('cert_hash') cert_hash: string) {
    return this.blockchainService.reactivateCertificate(cert_hash);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('audit-logs')
  async getAuditLogs(@Query('cert_hash') cert_hash: string) {
    return this.blockchainService.getAuditLogs(cert_hash);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user/:wallet_address')
  async getUserByWalletAddress(
    @Param('wallet_address') wallet_address: string,
  ) {
    return this.blockchainService.getUserByWalletAddress(wallet_address);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user/:wallet_address/with-db')
  async getUserByWalletAddressWithDB(
    @Param('wallet_address') wallet_address: string,
  ) {
    return this.blockchainService.getUserByWalletAddressWithDB(wallet_address);
  }
}
