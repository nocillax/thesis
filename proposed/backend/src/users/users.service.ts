import {
  Injectable,
  OnModuleInit,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { ethers } from 'ethers';
import { BlockchainService } from '../blockchain/blockchain.service';
import * as crypto from 'crypto';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly ENCRYPTION_KEY =
    process.env.MASTER_ENCRYPTION_KEY ||
    'default-master-key-change-in-production';

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => BlockchainService))
    private blockchainService: BlockchainService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find({
      select: [
        'id',
        'username',
        'email',
        'full_name',
        'wallet_address',
        'is_admin',
      ],
    });
    return users;
  }

  // Encrypt the user's private key before storing in database
  // We use AES-256-CTR which is like a strong padlock that can be unlocked later
  private encryptPrivateKey(privateKey: string): string {
    const algorithm = 'aes-256-ctr';
    // Hash the master key to get a consistent 32-byte encryption key
    const key = crypto
      .createHash('sha256')
      .update(this.ENCRYPTION_KEY)
      .digest();
    // Generate random IV (initialization vector) - like a random salt for encryption
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    // Encrypt the private key
    const encrypted = Buffer.concat([
      cipher.update(privateKey, 'utf8'),
      cipher.final(),
    ]);
    // Store as "iv:encrypted" so we can decrypt later (we need the IV to reverse it)
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  // Reverse the encryption - take the encrypted key from DB and get back the original private key
  decryptPrivateKey(encryptedKey: string): string {
    const algorithm = 'aes-256-ctr';
    // Use the same master key hash we used for encryption
    const key = crypto
      .createHash('sha256')
      .update(this.ENCRYPTION_KEY)
      .digest();
    // Split the stored format: "iv:encrypted"
    const parts = encryptedKey.split(':');
    const iv = Buffer.from(parts[0], 'hex'); // The IV we stored during encryption
    const encrypted = Buffer.from(parts[1], 'hex'); // The encrypted private key
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    // Decrypt back to the original private key
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  async create(
    username: string,
    pass: string,
    email: string,
    full_name: string,
    is_admin: boolean = false,
  ) {
    const existing = await this.findOne(username);
    if (existing) throw new ConflictException('Username already exists');

    // Check email uniqueness
    const existingEmail = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingEmail) throw new ConflictException('Email already exists');

    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(pass, salt);

    // Generate blockchain wallet
    const wallet = ethers.Wallet.createRandom();
    const encryptedPrivateKey = this.encryptPrivateKey(wallet.privateKey);

    const user = this.usersRepository.create({
      username,
      email,
      full_name,
      password_hash,
      wallet_address: wallet.address,
      encrypted_private_key: encryptedPrivateKey,
      is_admin,
    });

    const saved = await this.usersRepository.save(user);

    // Register user on blockchain UserRegistry (automatically authorized)
    try {
      await this.blockchainService.registerUserOnBlockchain(
        wallet.address,
        username,
        email,
      );
      console.log(
        `✅ User registered on blockchain: ${username} (${wallet.address})`,
      );
    } catch (error) {
      console.error(
        '⚠️  Failed to register user on blockchain:',
        error.message,
      );
    }

    const { password_hash: _, encrypted_private_key: __, ...result } = saved;
    return result;
  }

  async revokeUser(walletAddress: string) {
    const user = await this.usersRepository.findOne({
      where: { wallet_address: walletAddress },
    });

    if (!user) {
      throw new ConflictException('User not found');
    }

    if (user.username === 'admin') {
      throw new ConflictException('Cannot revoke admin user');
    }

    // Revoke user on blockchain UserRegistry (source of truth)
    try {
      await this.blockchainService.revokeUserOnBlockchain(user.wallet_address);
      console.log(
        `✅ User revoked on blockchain: ${user.username} (${user.wallet_address})`,
      );
    } catch (error) {
      console.error('⚠️  Failed to revoke user on blockchain:', error.message);
      throw error;
    }

    // Update database to reflect blockchain state
    await this.usersRepository.update(user.id, { is_admin: false });

    return {
      success: true,
      message: `User ${user.username} has been revoked and can no longer issue certificates`,
      wallet_address: walletAddress,
    };
  }

  async reactivateUser(walletAddress: string) {
    const user = await this.usersRepository.findOne({
      where: { wallet_address: walletAddress },
    });

    if (!user) {
      throw new ConflictException('User not found');
    }

    // Reactivate user on blockchain UserRegistry (source of truth)
    try {
      await this.blockchainService.reactivateUserOnBlockchain(
        user.wallet_address,
      );
      console.log(
        `✅ User reactivated on blockchain: ${user.username} (${user.wallet_address})`,
      );
    } catch (error) {
      console.error(
        '⚠️  Failed to reactivate user on blockchain:',
        error.message,
      );
      throw error;
    }

    // Update database if needed
    await this.usersRepository.update(user.id, { is_admin: false });

    return {
      success: true,
      message: `User ${user.username} has been reactivated and can now issue certificates`,
      wallet_address: walletAddress,
    };
  }

  async getAllUsersFromBlockchain() {
    return this.blockchainService.getAllUsersFromBlockchain();
  }

  private async seedAdmin() {
    const adminExists = await this.usersRepository.findOne({
      where: { username: 'admin' },
    });
    if (!adminExists) {
      // Admin is DB-only, no blockchain account (feature: admins manage system, don't issue certificates)
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const placeholderPrivateKey =
        '0x0000000000000000000000000000000000000000000000000000000000000000';
      const encryptedPrivateKey = this.encryptPrivateKey(placeholderPrivateKey);

      const admin = this.usersRepository.create({
        username: 'admin',
        password_hash: hashedPassword,
        email: 'admin@university.edu',
        full_name: 'System Administrator',
        wallet_address: '0x0000000000000000000000000000000000000000', // Placeholder - admin has no blockchain account
        encrypted_private_key: encryptedPrivateKey,
        is_admin: true,
      });

      await this.usersRepository.save(admin);
      console.log('✅ Initial Admin seeded: admin / admin123');
      console.log(
        '   Admin is DB-only (no blockchain account - manages system only)',
      );
    }
  }
}
