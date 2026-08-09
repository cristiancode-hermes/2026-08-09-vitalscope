import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: any;
  let jwtService: any;

  const mockUser = {
    id: 'u-1',
    username: 'ana',
    email: 'ana@correo.es',
    passwordHash: '$2a$10$mockhashmockhashmockhashmockhashmockhashmockhashmockhashmockhash',
    units: 'metric',
    theme: 'auto',
  };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((data: any) => data),
      save: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'UserRepository', useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('crea usuario con password hasheado y devuelve token + user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.save.mockResolvedValue(mockUser);

      const result = await service.register({
        username: 'Ana',
        email: 'Ana@Correo.es',
        password: 'password123',
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'ana',
          email: 'ana@correo.es',
          passwordHash: expect.not.stringMatching('password123'),
        }),
      );
      expect(result.token).toBe('jwt-token');
      expect(result.user.username).toBe('ana');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('lanza ConflictException si el email ya existe', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, username: 'otro' });

      await expect(
        service.register({
          username: 'nuevo',
          email: 'ana@correo.es',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza ConflictException si el username ya existe', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser, email: 'otro@correo.es' });

      await expect(
        service.register({
          username: 'ana',
          email: 'nuevo@correo.es',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('loguea por USERNAME', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);

      const result = await service.login({ identifier: 'ana', password: 'password123' });

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: [{ username: 'ana' }, { email: 'ana' }],
      });
      expect(result.token).toBe('jwt-token');
    });

    it('loguea por EMAIL', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);

      const result = await service.login({ identifier: 'ana@correo.es', password: 'password123' });

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: [{ username: 'ana@correo.es' }, { email: 'ana@correo.es' }],
      });
      expect(result.user.email).toBe('ana@correo.es');
    });

    it('lanza UnauthorizedException con password incorrecta', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false);

      await expect(
        service.login({ identifier: 'ana', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ identifier: 'ghost', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe', () => {
    it('devuelve el usuario sin passwordHash', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);

      const me = await service.getMe('u-1');
      expect(me.username).toBe('ana');
      expect(me).not.toHaveProperty('passwordHash');
    });

    it('lanza UnauthorizedException si no existe', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getMe('ghost')).rejects.toThrow(UnauthorizedException);
    });
  });
});
