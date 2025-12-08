import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from './entities/certificate.entity';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private certRepo: Repository<Certificate>,
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async create(data: Partial<Certificate>, userId: string) {
    // Check if certificate already exists for this student_id
    const existing = await this.certRepo.findOne({
      where: { student_id: data.student_id },
    });
    if (existing) {
      throw new BadRequestException(
        'Certificate already exists for this student ID',
      );
    }

    const certData = { ...data, issuer_id: userId };
    const cert = this.certRepo.create(certData);
    const savedCert = await this.certRepo.save(cert);

    const { id, issuance_date, issuer, ...auditData } = savedCert;
    await this.logAudit('INSERT', savedCert.id, auditData, userId);

    return {
      certificate_id: savedCert.id,
      student_id: savedCert.student_id,
      issuance_date: savedCert.issuance_date,
    };
  }

  async findOne(id: string) {
    const cert = await this.certRepo.findOne({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  async findAll() {
    const certificates = await this.certRepo.find({
      relations: ['issuer'],
      order: { issuance_date: 'DESC' },
    });
    return certificates;
  }

  async revoke(id: string, userId: string) {
    const cert = await this.findOne(id);
    if (cert.is_revoked) {
      throw new BadRequestException('Certificate is already revoked');
    }

    return this.updateRevocationStatus(cert, true, 'REVOKE', userId);
  }

  async reactivate(id: string, userId: string) {
    const cert = await this.findOne(id);
    if (!cert.is_revoked) {
      throw new BadRequestException('Certificate is not revoked');
    }

    return this.updateRevocationStatus(cert, false, 'REACTIVATE', userId);
  }

  async getAuditLogs(certificateId?: string) {
    const query: any = {};
    if (certificateId) {
      query.certificate_id = certificateId;
    }
    return this.auditRepo.find({
      where: query,
      order: { timestamp: 'DESC' },
    });
  }

  async verifyByStudentId(studentId: string) {
    const cert = await this.certRepo.findOne({
      where: { student_id: studentId },
    });
    if (!cert || cert.is_revoked) {
      throw new NotFoundException(
        'No active certificate available for this student ID',
      );
    }
    return cert;
  }

  async update(id: string, data: Partial<Certificate>, userId: string) {
    const cert = await this.findOne(id);
    if (cert.is_revoked) {
      throw new BadRequestException('Cannot update a revoked certificate');
    }

    const changes = this.calculateChanges(cert, data);
    Object.assign(cert, data);
    const updatedCert = await this.certRepo.save(cert);

    await this.logAudit('UPDATE', id, changes, userId);

    return {
      success: true,
      message: 'Certificate updated successfully',
      certificate: updatedCert,
    };
  }

  private async updateRevocationStatus(
    cert: Certificate,
    status: boolean,
    action: string,
    userId: string,
  ) {
    const auditDetails = {
      is_revoked: { before: cert.is_revoked, after: status },
    };

    cert.is_revoked = status;
    await this.certRepo.save(cert);
    await this.logAudit(action, cert.id, auditDetails, userId);

    return {
      success: true,
      message: `Certificate ${action.toLowerCase()}d successfully`,
    };
  }

  private calculateChanges(cert: Certificate, data: Partial<Certificate>) {
    const changes: any = {};
    const fields = [
      'student_id',
      'student_name',
      'degree_program',
      'cgpa',
      'issuing_authority',
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined && data[field] !== cert[field]) {
        changes[field] = { before: cert[field], after: data[field] };
      }
    });

    return changes;
  }

  private async logAudit(
    action: string,
    certificate_id: string,
    details: any,
    performed_by: string,
  ) {
    const log = this.auditRepo.create({
      action,
      certificate_id,
      details,
      performed_by,
    });
    await this.auditRepo.save(log);
  }
}
