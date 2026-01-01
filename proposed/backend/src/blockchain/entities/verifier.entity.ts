import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { VerificationLog } from './verification-log.entity';

@Entity('verifiers')
export class Verifier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  institution: string;

  @Column()
  website: string;

  @Column({ type: 'bigint' })
  created_at: number;

  @OneToMany(() => VerificationLog, (log) => log.verifier)
  verification_logs: VerificationLog[];
}
