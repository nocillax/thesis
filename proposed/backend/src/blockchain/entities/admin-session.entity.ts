import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('admin_sessions')
export class AdminSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  wallet_address: string;

  @Column({ type: 'varchar', length: 100 })
  user_name: string;

  @Column({ type: 'timestamp' })
  login_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  logout_at: Date | null;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  session_status: string; // 'active', 'logged_out', 'expired'

  @Column({ type: 'text', nullable: true })
  ip_address: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;
}
