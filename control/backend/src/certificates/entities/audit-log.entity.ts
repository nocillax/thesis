import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string;

  @Column({ name: 'certificate_id', type: 'uuid' })
  certificate_id: string;

  @Column('jsonb')
  details: any;

  @Column({ name: 'performed_by', nullable: true })
  performed_by: string;

  @CreateDateColumn()
  timestamp: Date;
}
