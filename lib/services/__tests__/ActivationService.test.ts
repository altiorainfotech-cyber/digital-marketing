/**
 * ActivationService Tests
 * 
 * Unit tests for the ActivationService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivationServiceImpl } from '../ActivationService';
import { SecurityService } from '../SecurityService';
import { PrismaClient } from '@/app/generated/prisma';
import * as passwordUtils from '@/lib/utils/password';

// Mock dependencies
vi.mock('@/app/generated/prisma', () => ({
  PrismaClient: vi.fn(),
}));

vi.mock('@/lib/utils/password', () => ({
  hashPassword: vi.fn(),
}));

describe('ActivationService', () => {
  let service: ActivationServiceImpl;
  let mockPrisma: any;
  let mockSecurityService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    };

    mockSecurityService = {
      checkActivationRateLimit: vi.fn(),
      logFailedActivation: vi.fn(),
      logSuccessfulActivation: vi.fn(),
    };

    service = new ActivationServiceImpl(
      mockPrisma as PrismaClient,
      mockSecurityService as SecurityService
    );
  });

  describe('validateActivationCode()', () => {
    it('should return valid result for correct email and code', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      mockSecurityService.checkActivationRateLimit.mockResolvedValue({
        allowed: true,
      });

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        activationCode: 'ABC123',
        isActivated: false,
        activationCodeExpiresAt: futureDate,
      });

      const result = await service.validateActivationCode('john@example.com', 'ABC123');

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-1');
      expect(result.error).toBeUndefined();
      expect(mockSecurityService.logFailedActivation).not.toHaveBeenCalled();
    });

    it('should reject validation when rate limited', async () => {
      mockSecurityService.checkActivationRateLimit.mockResolvedValue({
        allowed: false,
        retryAfterMinutes: 25,
      });

      const result = await service.validateActivationCode('john@example.com', 'ABC123');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Too many attempts. Please try again in 25 minutes.');
      expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
    });

    it('should reject invalid code/email combination', async () => {
      mockSecurityService.checkActivationRateLimit.mockResolvedValue({
        allowed: true,
      });

      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await service.validateActivationCode('john@example.com', 'WRONG1');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid activation code or email.');
      expect(mockSecurityService.logFailedActivation).toHaveBeenCalledWith(
        'john@example.com',
        'WRONG1'
      );
    });

    it('should reject expired activation code', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockSecurityService.checkActivationRateLimit.mockResolvedValue({
        allowed: true,
      });

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        activationCode: 'ABC123',
        isActivated: false,
        activationCodeExpiresAt: pastDate,
      });

      const result = await service.validateActivationCode('john@example.com', 'ABC123');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Activation code has expired. Please contact your administrator.');
    });

    it('should not find already activated users', async () => {
      mockSecurityService.checkActivationRateLimit.mockResolvedValue({
        allowed: true,
      });

      // findFirst with isActivated: false won't find activated users
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await service.validateActivationCode('john@example.com', 'ABC123');

      expect(result.valid).toBe(false);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'john@example.com',
          activationCode: 'ABC123',
          isActivated: false,
        },
      });
    });
  });

  describe('setPassword()', () => {
    it('should set password and complete activation', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      mockSecurityService.checkActivationRateLimit.mockResolvedValue({
        allowed: true,
      });

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        activationCode: 'ABC123',
        isActivated: false,
        activationCodeExpiresAt: futureDate,
      });

      vi.mocked(passwordUtils.hashPassword).mockResolvedValue('hashed_password_123');

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        password: 'hashed_password_123',
        isActivated: true,
        activatedAt: expect.any(Date),
        activationCode: null,
        activationCodeExpiresAt: null,
      });

      await service.setPassword('john@example.com', 'ABC123', 'SecurePass123');

      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('SecurePass123');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          password: 'hashed_password_123',
          isActivated: true,
          activatedAt: expect.any(Date),
          activationCode: null,
          activationCodeExpiresAt: null,
        },
      });
      expect(mockSecurityService.logSuccessfulActivation).toHaveBeenCalledWith('john@example.com');
    });

    it('should throw error if validation fails', async () => {
      mockSecurityService.checkActivationRateLimit.mockResolvedValue({
        allowed: true,
      });

      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.setPassword('john@example.com', 'WRONG1', 'SecurePass123')
      ).rejects.toThrow('Invalid activation code or email.');

      expect(passwordUtils.hashPassword).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockSecurityService.logSuccessfulActivation).not.toHaveBeenCalled();
    });

    it('should throw error for weak password', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      mockSecurityService.checkActivationRateLimit.mockResolvedValue({
        allowed: true,
      });

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        activationCode: 'ABC123',
        isActivated: false,
        activationCodeExpiresAt: futureDate,
      });

      await expect(
        service.setPassword('john@example.com', 'ABC123', 'short')
      ).rejects.toThrow('Password must be at least 8 characters long');

      expect(passwordUtils.hashPassword).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw error for empty password', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      mockSecurityService.checkActivationRateLimit.mockResolvedValue({
        allowed: true,
      });

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        activationCode: 'ABC123',
        isActivated: false,
        activationCodeExpiresAt: futureDate,
      });

      await expect(
        service.setPassword('john@example.com', 'ABC123', '')
      ).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should throw error if code expired during password setting', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      mockSecurityService.checkActivationRateLimit.mockResolvedValue({
        allowed: true,
      });

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        activationCode: 'ABC123',
        isActivated: false,
        activationCodeExpiresAt: pastDate,
      });

      await expect(
        service.setPassword('john@example.com', 'ABC123', 'SecurePass123')
      ).rejects.toThrow('Activation code has expired. Please contact your administrator.');
    });
  });
});
