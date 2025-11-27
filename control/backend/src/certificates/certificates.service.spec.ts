import { Test, TestingModule } from '@nestjs/testing';
import { CertificatesService } from './certificates.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Certificate } from './entities/certificate.entity';
import { AuditLog } from './entities/audit-log.entity';
import { NotFoundException } from '@nestjs/common';

describe('CertificatesService', () => {
  let service: CertificatesService;
  let certRepo;
  let auditRepo;

  const mockCertRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((cert) =>
        Promise.resolve({ id: 'uuid-123', ...cert }),
      ),
    findOne: jest.fn(),
  };

  const mockAuditRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        { provide: getRepositoryToken(Certificate), useValue: mockCertRepo },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditRepo },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
    certRepo = module.get(getRepositoryToken(Certificate));
    auditRepo = module.get(getRepositoryToken(AuditLog));
  });

  it('should create a certificate and log audit', async () => {
    const dto = {
      student_name: 'John',
      degree_program: 'CS',
      cgpa: 3.8,
      issuing_authority: 'Uni',
    };
    const result = await service.create(dto, 'admin-id');

    expect(result).toHaveProperty('certificate_id');
    expect(certRepo.save).toHaveBeenCalled();
    expect(auditRepo.save).toHaveBeenCalled();
  });

  it('should throw error if verification fails', async () => {
    mockCertRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
  });
});
