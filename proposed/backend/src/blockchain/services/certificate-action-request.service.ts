import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import {
  CertificateActionRequest,
  CertificateAction,
  RequestStatus,
} from '../entities/certificate-action-request.entity';
import { CertificateBlockchainService } from './certificate-blockchain.service';

@Injectable()
export class CertificateActionRequestService {
  constructor(
    @InjectRepository(CertificateActionRequest)
    private actionRequestRepository: Repository<CertificateActionRequest>,
    private certificateBlockchainService: CertificateBlockchainService,
  ) {}

  async createRequest(
    certHash: string,
    actionType: CertificateAction,
    reason: string,
    walletAddress: string,
    userName: string,
  ): Promise<CertificateActionRequest> {
    // Verify certificate exists
    const certificate =
      await this.certificateBlockchainService.verifyCertificate(certHash);
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    // Check if there's already a processing or pending request for this certificate
    const existingRequest = await this.actionRequestRepository.findOne({
      where: [
        { cert_hash: certHash, status: RequestStatus.PENDING },
        { cert_hash: certHash, status: RequestStatus.PROCESSING },
      ],
    });

    if (existingRequest) {
      throw new ConflictException(
        `There is already a ${existingRequest.status} ${existingRequest.action_type} request for this certificate`,
      );
    }

    // Validate action type matches certificate status
    if (actionType === CertificateAction.REVOKE && certificate.is_revoked) {
      throw new BadRequestException('Certificate is already revoked');
    }

    if (
      actionType === CertificateAction.REACTIVATE &&
      !certificate.is_revoked
    ) {
      throw new BadRequestException('Certificate is not revoked');
    }

    const request = this.actionRequestRepository.create({
      cert_hash: certHash,
      student_id: certificate.student_id,
      action_type: actionType,
      reason,
      requested_by_wallet_address: walletAddress,
      requested_by_name: userName,
      status: RequestStatus.PENDING,
      requested_at: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
      updated_at: Math.floor(Date.now() / 1000),
    });

    return this.actionRequestRepository.save(request);
  }

  async getAllRequests(
    status?: RequestStatus,
    page?: number,
    limit?: number,
  ): Promise<{ data: CertificateActionRequest[]; meta?: any }> {
    const query = this.actionRequestRepository.createQueryBuilder('request');

    if (status) {
      query.where('request.status = :status', { status });
    }

    query.orderBy('request.requested_at', 'DESC');

    if (page && limit) {
      const skip = (page - 1) * limit;
      query.skip(skip).take(limit);

      const [data, total] = await query.getManyAndCount();
      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    const data = await query.getMany();
    return { data };
  }

  async getLatestRequests(
    limit: number = 5,
  ): Promise<CertificateActionRequest[]> {
    return this.actionRequestRepository.find({
      order: { requested_at: 'DESC' },
      take: limit,
    });
  }

  async getPendingCount(): Promise<number> {
    return this.actionRequestRepository.count({
      where: { status: RequestStatus.PENDING },
    });
  }

  async getMyNonCompletedCount(walletAddress: string): Promise<number> {
    return this.actionRequestRepository.count({
      where: {
        requested_by_wallet_address: walletAddress,
        status: Not(RequestStatus.COMPLETED),
      },
    });
  }

  async takeRequest(
    requestId: number,
    adminWallet: string,
  ): Promise<CertificateActionRequest> {
    const request = await this.actionRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Request is already ${request.status}. Only PENDING requests can be taken.`,
      );
    }

    request.status = RequestStatus.PROCESSING;
    request.taken_by_wallet_address = adminWallet;
    request.updated_at = Math.floor(Date.now() / 1000);

    return this.actionRequestRepository.save(request);
  }

  async releaseRequest(
    requestId: number,
    adminWallet: string,
  ): Promise<CertificateActionRequest> {
    const request = await this.actionRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== RequestStatus.PROCESSING) {
      throw new BadRequestException('Only PROCESSING requests can be released');
    }

    if (request.taken_by_wallet_address !== adminWallet) {
      throw new BadRequestException(
        'You can only release requests that you have taken',
      );
    }

    request.status = RequestStatus.PENDING;
    request.taken_by_wallet_address = null;
    request.updated_at = Math.floor(Date.now() / 1000);

    return this.actionRequestRepository.save(request);
  }

  async completeRequest(
    requestId: number,
    adminWallet: string,
  ): Promise<CertificateActionRequest> {
    const request = await this.actionRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== RequestStatus.PROCESSING) {
      throw new BadRequestException(
        'Only PROCESSING requests can be completed',
      );
    }

    if (request.taken_by_wallet_address !== adminWallet) {
      throw new BadRequestException(
        'You can only complete requests that you have taken',
      );
    }

    request.status = RequestStatus.COMPLETED;
    request.updated_at = Math.floor(Date.now() / 1000);

    return this.actionRequestRepository.save(request);
  }

  async rejectRequest(
    requestId: number,
    rejectionReason: string,
    adminWallet: string,
  ): Promise<CertificateActionRequest> {
    const request = await this.actionRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== RequestStatus.PROCESSING) {
      throw new BadRequestException('Only PROCESSING requests can be rejected');
    }

    if (request.taken_by_wallet_address !== adminWallet) {
      throw new BadRequestException(
        'You can only reject requests that you have taken',
      );
    }

    request.status = RequestStatus.REJECTED;
    request.rejection_reason = rejectionReason;
    request.updated_at = Math.floor(Date.now() / 1000);

    return this.actionRequestRepository.save(request);
  }

  async getRequestById(requestId: number): Promise<CertificateActionRequest> {
    const request = await this.actionRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  async getRequestsByCertHash(
    certHash: string,
  ): Promise<CertificateActionRequest[]> {
    return this.actionRequestRepository.find({
      where: { cert_hash: certHash },
      order: { requested_at: 'DESC' },
    });
  }

  async getMyRequests(
    walletAddress: string,
    isAdmin: boolean,
    status?: RequestStatus,
    page?: number,
    limit?: number,
  ): Promise<{ data: CertificateActionRequest[]; meta?: any }> {
    const query = this.actionRequestRepository.createQueryBuilder('request');

    // For admin: requests they have taken
    // For staff: requests they have created
    if (isAdmin) {
      query.where('request.taken_by_wallet_address = :walletAddress', {
        walletAddress,
      });
    } else {
      query.where('request.requested_by_wallet_address = :walletAddress', {
        walletAddress,
      });
    }

    if (status) {
      query.andWhere('request.status = :status', { status });
    }

    query.orderBy('request.requested_at', 'DESC');

    if (page && limit) {
      const skip = (page - 1) * limit;
      query.skip(skip).take(limit);

      const [data, total] = await query.getManyAndCount();
      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    const data = await query.getMany();
    return { data };
  }

  async cancelRequest(
    requestId: number,
    userWallet: string,
  ): Promise<void> {
    const request = await this.actionRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    // Only the requester can cancel their own request
    if (request.requested_by_wallet_address !== userWallet) {
      throw new BadRequestException(
        'You can only cancel your own requests',
      );
    }

    // Only PENDING requests can be cancelled
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        'Only PENDING requests can be cancelled',
      );
    }

    await this.actionRequestRepository.remove(request);
  }
}
