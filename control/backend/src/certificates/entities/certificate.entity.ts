import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('certificates')
@Index(['student_name', 'degree_program'])
@Index(['certificate_number'], { unique: true })
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'certificate_number', unique: true })
  certificate_number: string;

  @Column({ name: 'student_id' })
  student_id: string;

  @Column({ name: 'student_name' })
  student_name: string;

  @Column({ name: 'degree_program' })
  degree_program: string;

  @Column('float')
  cgpa: number;

  @Column({ name: 'issuing_authority' })
  issuing_authority: string;

  @Column({ name: 'issuer_id', type: 'uuid' })
  issuer_id: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'issuer_id' })
  issuer: User;

  @CreateDateColumn({ name: 'issuance_date' })
  issuance_date: Date;

  @Column({ default: false, name: 'is_revoked' })
  is_revoked: boolean;
}
