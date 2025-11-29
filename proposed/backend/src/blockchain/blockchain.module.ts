import { Module, forwardRef } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { AuthModule } from '../auth/auth.module';
import { AuthorizedGuard } from '../auth/authorized.guard';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [BlockchainController],
  providers: [BlockchainService, AuthorizedGuard],
  exports: [BlockchainService],
})
export class BlockchainModule {}
