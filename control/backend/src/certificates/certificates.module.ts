import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { AuditLogsController } from './audit-logs.controller';
import { Certificate } from './entities/certificate.entity';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate, AuditLog])],
  controllers: [CertificatesController, AuditLogsController],
  providers: [CertificatesService],
})
export class CertificatesModule {}
