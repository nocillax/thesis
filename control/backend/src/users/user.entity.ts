import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ name: 'password_hash' })
  password_hash: string;

  @Column({ name: 'is_admin', default: false })
  is_admin: boolean;

  @Column({ name: 'is_authorized', default: true })
  is_authorized: boolean;
}
