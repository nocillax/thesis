import { Injectable, OnModuleInit, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async create(username: string, pass: string, is_admin: boolean = false) {
    const existing = await this.findOne(username);
    if (existing) throw new ConflictException('Username already exists');

    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(pass, salt);

    const user = this.usersRepository.create({
      username,
      password_hash,
      is_admin,
    });

    const saved = await this.usersRepository.save(user);
    const { password_hash: _, ...result } = saved;
    return result;
  }

  private async seedAdmin() {
    const adminExists = await this.usersRepository.findOne({
      where: { username: 'admin' },
    });
    if (!adminExists) {
      await this.create('admin', 'admin123', true);
      console.log('✅ Initial Admin seeded: admin / admin123');
    }
  }
}
