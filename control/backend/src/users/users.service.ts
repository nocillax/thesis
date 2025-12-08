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

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find({
      select: [
        'id',
        'username',
        'email',
        'full_name',
        'is_admin',
        'is_authorized',
      ],
    });
    return users;
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'email',
        'full_name',
        'is_admin',
        'is_authorized',
      ],
    });
    if (!user) throw new ConflictException('User not found');
    return user;
  }

  async revokeUser(id: string) {
    const user = await this.findById(id);
    if (!user.is_authorized) {
      throw new ConflictException('User is already revoked');
    }
    user.is_authorized = false;
    await this.usersRepository.save(user);
    return { success: true, message: 'User revoked successfully' };
  }

  async reactivateUser(id: string) {
    const user = await this.findById(id);
    if (user.is_authorized) {
      throw new ConflictException('User is already active');
    }
    user.is_authorized = true;
    await this.usersRepository.save(user);
    return { success: true, message: 'User reactivated successfully' };
  }

  async create(
    username: string,
    email: string,
    pass: string,
    full_name?: string,
    is_admin: boolean = false,
  ) {
    const existing = await this.findOne(username);
    if (existing) throw new ConflictException('Username already exists');

    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(pass, salt);

    const user = this.usersRepository.create({
      username,
      email,
      full_name,
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
      await this.create(
        'admin',
        'admin@control.system',
        'admin123',
        'System Administrator',
        true,
      );
      console.log('✅ Initial Admin seeded: admin / admin123');
    }
  }
}
