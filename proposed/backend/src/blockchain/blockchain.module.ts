import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { StudentController } from './controllers/student.controller';
import { VerifierController } from './controllers/verifier.controller';
import { SessionController } from './controllers/session.controller';
import { OfflineActivityController } from './controllers/offline-activity.controller';
import { CertificateActionRequestController } from './controllers/certificate-action-request.controller';
import { PdfService } from './services/pdf.service';
import { UserBlockchainService } from './services/user-blockchain.service';
import { CertificateBlockchainService } from './services/certificate-blockchain.service';
import { AuditBlockchainService } from './services/audit-blockchain.service';
import { BlockchainClientService } from './services/blockchain-client.service';
import { StudentService } from './services/student.service';
import { VerifierService } from './services/verifier.service';
import { RateLimitService } from './services/rate-limit.service';
import { SessionService } from './services/session.service';
import { OfflineActivityService } from './services/offline-activity.service';
import { CertificateActionRequestService } from './services/certificate-action-request.service';
import { Student } from './entities/student.entity';
import { Verifier } from './entities/verifier.entity';
import { VerificationLog } from './entities/verification-log.entity';
import { BlockedVerifier } from './entities/blocked-verifier.entity';
import { AdminSession } from './entities/admin-session.entity';
import { CertificateActionRequest } from './entities/certificate-action-request.entity';
import { AuthModule } from '../auth/auth.module';
import { AuthorizedGuard } from '../auth/authorized.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Verifier,
      VerificationLog,
      BlockedVerifier,
      AdminSession,
      CertificateActionRequest,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [
    BlockchainController,
    StudentController,
    VerifierController,
    SessionController,
    OfflineActivityController,
    CertificateActionRequestController,
  ],
  providers: [
    BlockchainService,
    BlockchainClientService,
    UserBlockchainService,
    CertificateBlockchainService,
    AuditBlockchainService,
    StudentService,
    VerifierService,
    RateLimitService,
    SessionService,
    OfflineActivityService,
    CertificateActionRequestService,
    PdfService,
    AuthorizedGuard,
    RolesGuard,
  ],
  exports: [BlockchainService, SessionService],
})
export class BlockchainModule {}
