import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum CertificateAction {
  REVOKE = 'revoke',
  REACTIVATE = 'reactivate',
}

export enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

@Entity('certificate_action_requests')
export class CertificateActionRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 66 })
  cert_hash: string;

  @Column({ type: 'varchar', length: 50 })
  student_id: string;

  @Column({
    type: 'enum',
    enum: CertificateAction,
  })
  action_type: CertificateAction;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({ type: 'varchar', length: 42 })
  requested_by_wallet_address: string;

  @Column({ type: 'varchar', length: 255 })
  requested_by_name: string;

  @Column({ type: 'varchar', length: 42, nullable: true })
  taken_by_wallet_address: string | null;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'bigint' })
  requested_at: number;

  @Column({ type: 'bigint' })
  updated_at: number;
}
