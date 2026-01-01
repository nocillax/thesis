import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('students')
export class Student {
  @PrimaryColumn()
  student_id: string;

  @Column()
  student_name: string;

  @Column()
  degree: string;

  @Column()
  program: string;

  @Column('decimal', { precision: 3, scale: 2 })
  cgpa: number;

  @Column('int')
  credit_remaining: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
