import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/roles.guard';
import { CertificateActionRequestService } from '../services/certificate-action-request.service';
import {
  CertificateAction,
  RequestStatus,
} from '../entities/certificate-action-request.entity';

@Controller('certificate-action-requests')
export class CertificateActionRequestController {
  constructor(
    private readonly actionRequestService: CertificateActionRequestService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createRequest(
    @Body()
    body: { cert_hash: string; action_type: CertificateAction; reason: string },
    @Req() req: any,
  ) {
    const request = await this.actionRequestService.createRequest(
      body.cert_hash,
      body.action_type,
      body.reason,
      req.user.walletAddress,
      req.user.username,
    );

    return {
      success: true,
      message: `${body.action_type} request submitted successfully`,
      request,
    };
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async getAllRequests(
    @Query('status') status?: RequestStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;

    return this.actionRequestService.getAllRequests(status, pageNum, limitNum);
  }

  @Get('latest')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async getLatestRequests(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.actionRequestService.getLatestRequests(limitNum);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getMyRequests(
    @Req() req: any,
    @Query('status') status?: RequestStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;

    return this.actionRequestService.getMyRequests(
      req.user.walletAddress,
      req.user.isAdmin,
      status,
      pageNum,
      limitNum,
    );
  }

  @Get('pending/count')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async getPendingCount() {
    const count = await this.actionRequestService.getPendingCount();
    return { count };
  }

  @Get('my/non-completed/count')
  @UseGuards(AuthGuard('jwt'))
  async getMyNonCompletedCount(@Req() req: any) {
    const count = await this.actionRequestService.getMyNonCompletedCount(
      req.user.walletAddress,
    );
    return { count };
  }

  @Get('certificate/:cert_hash')
  @UseGuards(AuthGuard('jwt'))
  async getRequestsByCertHash(@Param('cert_hash') certHash: string) {
    return this.actionRequestService.getRequestsByCertHash(certHash);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getRequestById(@Param('id', ParseIntPipe) id: number) {
    return this.actionRequestService.getRequestById(id);
  }

  @Patch(':id/take')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async takeRequest(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const request = await this.actionRequestService.takeRequest(
      id,
      req.user.walletAddress,
    );

    return {
      success: true,
      message: 'Request taken successfully',
      request,
    };
  }

  @Patch(':id/release')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async releaseRequest(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const request = await this.actionRequestService.releaseRequest(
      id,
      req.user.walletAddress,
    );

    return {
      success: true,
      message: 'Request released successfully',
      request,
    };
  }

  @Patch(':id/complete')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async completeRequest(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const request = await this.actionRequestService.completeRequest(
      id,
      req.user.walletAddress,
    );

    return {
      success: true,
      message: 'Request completed successfully',
      request,
    };
  }

  @Patch(':id/reject')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async rejectRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    const request = await this.actionRequestService.rejectRequest(
      id,
      body.reason,
      req.user.walletAddress,
    );

    return {
      success: true,
      message: 'Request rejected successfully',
      request,
    };
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard('jwt'))
  async cancelRequest(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    await this.actionRequestService.cancelRequest(id, req.user.walletAddress);

    return {
      success: true,
      message: 'Request cancelled successfully',
    };
  }
}
