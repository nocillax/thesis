import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

class CreateCertificateDto {
  @IsString() @IsNotEmpty() certificate_number: string;
  @IsString() @IsNotEmpty() student_id: string;
  @IsString() @IsNotEmpty() student_name: string;
  @IsString() @IsNotEmpty() degree_program: string;
  @IsNumber() @IsNotEmpty() cgpa: number;
  @IsString() @IsNotEmpty() issuing_authority: string;
}

@Controller('api/certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.certificatesService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createDto: CreateCertificateDto, @Request() req) {
    return this.certificatesService.create(createDto, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('audit-logs')
  getAuditLogs(@Query('certificate_id') certificateId?: string) {
    return this.certificatesService.getAuditLogs(certificateId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateCertificateDto>,
    @Request() req,
  ) {
    return this.certificatesService.update(id, updateDto, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/revoke')
  revoke(@Param('id') id: string, @Request() req) {
    return this.certificatesService.revoke(id, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string, @Request() req) {
    return this.certificatesService.reactivate(id, req.user.userId);
  }
}
