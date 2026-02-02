/**
 * UserManagementService Tests
 * 
 * Unit tests for the UserManagementService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserManagementServiceImpl } from '../UserManagementService';
import { ActivationCodeGenerator } from '../ActivationCodeGenerator';
import { PrismaClient, UserRole } from '@/app/generated/prisma';

// Mock dependencies
vi.mock('@/app/generated/prisma', () => ({
  PrismaClient: vi.fn(),
  UserRole: {
    ADMIN: 'ADMIN',
    CONTENT_CREATOR: 'CONTENT_CREATOR',
    SEO_SPECIALIST: 'SEO_SPECIALIST',
  },
}));

describe('UserManagementService', () => {
  let service: UserManagementServiceImpl;
  let mockCodeGenerator: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockCodeGenerator = {
      generateUnique: vi.fn(),
    };

    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    service = new UserManagementServiceImpl(
      mockCodeGenerator as ActivationCodeGenerator,
      mockPrisma as PrismaClient
    );
  });

  describe('createUser()', () => {
    it('should create user with activation code and correct initial state', async () => {
      const mockCode = 'ABC123';
      const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.CONTENT_CREATOR,
        activationCode: mockCode,
        activationCodeExpiresAt: expect.any(Date),
        isActivated: false,
        password: null,
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockCodeGenerator.generateUnique.mockResolvedValue(mockCode);
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await service.createUser({
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.CONTENT_CREATOR,
      });

      expect(result.user).toEqual(mockUser);
      expect(result.activationCode).toBe(mockCode);
      expect(mockCodeGenerator.generateUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.CONTENT_CREATOR,
          activationCode: mockCode,
          activationCodeExpiresAt: expect.any(Date),
          isActivated: false,
          password: null,
          companyId: null,
        },
      });
    });

    it('should set expiration to 7 days from creation', async () => {
      const mockCode = 'ABC123';
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockCodeGenerator.generateUnique.mockResolvedValue(mockCode);

      let capturedExpiresAt: Date | null = null;
      mockPrisma.user.create.mockImplementation((args: any) => {
        capturedExpiresAt = args.data.activationCodeExpiresAt;
        return Promise.resolve({
          id: 'user-1',
          ...args.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      await service.createUser({
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.ADMIN,
      });

      expect(capturedExpiresAt).not.toBeNull();
      if (capturedExpiresAt) {
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        // Allow 1 second tolerance for test execution time
        const diff = Math.abs(capturedExpiresAt.getTime() - sevenDaysFromNow.getTime());
        expect(diff).toBeLessThan(1000);
      }
    });

    it('should throw error if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'john@example.com',
      });

      await expect(
        service.createUser({
          name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.ADMIN,
        })
      ).rejects.toThrow('User with this email already exists');

      expect(mockCodeGenerator.generateUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw error for invalid email format', async () => {
      await expect(
        service.createUser({
          name: 'John Doe',
          email: 'invalid-email',
          role: UserRole.ADMIN,
        })
      ).rejects.toThrow('Invalid email format');

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw error for invalid role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createUser({
          name: 'John Doe',
          email: 'john@example.com',
          role: 'INVALID_ROLE' as UserRole,
        })
      ).rejects.toThrow('Invalid role');
    });

    it('should allow creating user without company assignment', async () => {
      const mockCode = 'ABC123';
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockCodeGenerator.generateUnique.mockResolvedValue(mockCode);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.CONTENT_CREATOR,
        activationCode: mockCode,
        activationCodeExpiresAt: new Date(),
        isActivated: false,
        password: null,
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createUser({
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.CONTENT_CREATOR,
      });

      expect(result.user.companyId).toBeNull();
    });
  });

  describe('regenerateActivationCode()', () => {
    it('should generate new code and update expiration', async () => {
      const oldCode = 'OLD123';
      const newCode = 'NEW456';
      const mockUser = {
        id: 'user-1',
        email: 'john@example.com',
        activationCode: oldCode,
        isActivated: false,
        activationCodeExpiresAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockCodeGenerator.generateUnique.mockResolvedValue(newCode);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        activationCode: newCode,
      });

      const result = await service.regenerateActivationCode('user-1');

      expect(result).toBe(newCode);
      expect(mockCodeGenerator.generateUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          activationCode: newCode,
          activationCodeExpiresAt: expect.any(Date),
        },
      });
    });

    it('should set new expiration to 7 days from regeneration', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'john@example.com',
        activationCode: 'OLD123',
        isActivated: false,
        activationCodeExpiresAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockCodeGenerator.generateUnique.mockResolvedValue('NEW456');

      let capturedExpiresAt: Date | null = null;
      mockPrisma.user.update.mockImplementation((args: any) => {
        capturedExpiresAt = args.data.activationCodeExpiresAt;
        return Promise.resolve({ ...mockUser, ...args.data });
      });

      await service.regenerateActivationCode('user-1');

      expect(capturedExpiresAt).not.toBeNull();
      if (capturedExpiresAt) {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const diff = Math.abs(capturedExpiresAt.getTime() - sevenDaysFromNow.getTime());
        expect(diff).toBeLessThan(1000);
      }
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.regenerateActivationCode('nonexistent-user')
      ).rejects.toThrow('User not found');

      expect(mockCodeGenerator.generateUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw error if user is already activated', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'john@example.com',
        activationCode: null,
        isActivated: true,
        activationCodeExpiresAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.regenerateActivationCode('user-1')
      ).rejects.toThrow('Cannot regenerate activation code for already activated user');

      expect(mockCodeGenerator.generateUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });
});
