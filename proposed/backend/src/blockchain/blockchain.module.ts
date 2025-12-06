import { Module, forwardRef } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { PdfService } from './pdf.service';
import { AuthModule } from '../auth/auth.module';
import { AuthorizedGuard } from '../auth/authorized.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [BlockchainController],
  providers: [BlockchainService, PdfService, AuthorizedGuard, RolesGuard],
  exports: [BlockchainService],
})
export class BlockchainModule {}
