import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
  Ip,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import { SessionService } from '../services/session.service';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('login')
  async recordLogin(@Request() req, @Ip() ip: string) {
    const userAgent = req.headers['user-agent'];
    await this.sessionService.createSession(
      req.user.walletAddress,
      req.user.name,
      ip,
      userAgent,
    );
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async recordLogout(@Request() req) {
    await this.sessionService.logoutSession(req.user.walletAddress);
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get()
  async getAllSessions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sessionService.getAllSessions(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-sessions')
  async getMySessions(@Request() req, @Query('limit') limit?: string) {
    return this.sessionService.getUserSessions(
      req.user.walletAddress,
      limit ? parseInt(limit) : 10,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('offline-periods')
  async getOfflinePeriods(
    @Request() req,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.sessionService.getOfflinePeriods(
      req.user.walletAddress,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('last-offline-period')
  async getLastOfflinePeriod(@Request() req) {
    return this.sessionService.getLastOfflinePeriod(req.user.walletAddress);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('stats')
  async getSessionStats(@Request() req) {
    return this.sessionService.getSessionStats(req.user.walletAddress);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('active')
  async getActiveSession(@Request() req) {
    return this.sessionService.getActiveSession(req.user.walletAddress);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('cleanup-expired')
  async cleanupExpiredSessions() {
    const count = await this.sessionService.cleanupExpiredSessions();
    return { success: true, cleaned: count };
  }
}
