import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/audit-logs')
export class AuditLogsController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  getSystemWideAuditLogs() {
    return this.certificatesService.getAuditLogs();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('certificate/:id')
  getCertificateAuditLogs(@Param('id') certificateId: string) {
    return this.certificatesService.getAuditLogs(certificateId);
  }
}
