import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

@Entity('certificates')
@Index(['student_name', 'degree_program'])
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_name' })
  student_name: string;

  @Column({ name: 'degree_program' })
  degree_program: string;

  @Column('float')
  cgpa: number;

  @Column({ name: 'issuing_authority' })
  issuing_authority: string;

  @CreateDateColumn({ name: 'issuance_date' })
  issuance_date: Date;

  @Column({ default: false, name: 'is_revoked' })
  is_revoked: boolean;
}
