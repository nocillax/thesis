import { Module, forwardRef } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { PdfService } from './services/pdf.service';
import { UserBlockchainService } from './services/user-blockchain.service';
import { CertificateBlockchainService } from './services/certificate-blockchain.service';
import { AuditBlockchainService } from './services/audit-blockchain.service';
import { BlockchainClientService } from './services/blockchain-client.service';
import { AuthModule } from '../auth/auth.module';
import { AuthorizedGuard } from '../auth/authorized.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [BlockchainController],
  providers: [
    BlockchainService,
    BlockchainClientService,
    UserBlockchainService,
    CertificateBlockchainService,
    AuditBlockchainService,
    PdfService,
    AuthorizedGuard,
    RolesGuard,
  ],
  exports: [BlockchainService],
})
export class BlockchainModule {}
