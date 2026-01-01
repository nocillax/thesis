import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OfflineActivityService } from '../services/offline-activity.service';

@Controller('offline-activities')
export class OfflineActivityController {
  constructor(
    private readonly offlineActivityService: OfflineActivityService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getOfflineActivities(
    @Request() req,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.offlineActivityService.getOfflineActivities(
      req.user.walletAddress,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('count')
  async getMissedActivitiesCount(@Request() req) {
    const count = await this.offlineActivityService.getMissedActivitiesCount(
      req.user.walletAddress,
    );
    return { count };
  }
}
