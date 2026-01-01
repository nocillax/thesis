import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blocked_verifiers')
export class BlockedVerifier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  ip_address: string;

  @Column({ type: 'bigint' })
  blocked_until: number;

  @Column()
  reason: string;

  @Column()
  blocked_by_wallet_address: string;

  @Column({ type: 'bigint', default: () => 'EXTRACT(EPOCH FROM NOW())' })
  created_at: number;
}
