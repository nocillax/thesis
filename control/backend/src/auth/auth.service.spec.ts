import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService;
  let jwtService;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    passwordHash: 'hashedpassword',
    isAdmin: false, // Updated to boolean
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should return a token for valid credentials', async () => {
    mockUsersService.findOne.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login('testuser', 'password');

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('access_token', 'mock_token');
    expect(jwtService.sign).toHaveBeenCalledWith({
      username: 'testuser',
      sub: 'user-123',
      isAdmin: false,
    });
  });

  it('should throw UnauthorizedException for invalid password', async () => {
    mockUsersService.findOne.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.login('testuser', 'wrongpass')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
