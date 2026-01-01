import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Verifier } from './verifier.entity';

@Entity('verification_logs')
export class VerificationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  verifier_id: number;

  @Column()
  cert_hash: string;

  @Column()
  ip_address: string;

  @Column({ nullable: true })
  user_agent: string;

  @Column({ type: 'bigint' })
  verified_at: number;

  @ManyToOne(() => Verifier, (verifier) => verifier.verification_logs)
  @JoinColumn({ name: 'verifier_id' })
  verifier: Verifier;
}
