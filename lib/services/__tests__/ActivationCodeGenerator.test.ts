/**
 * ActivationCodeGenerator Tests
 * 
 * Unit tests for the ActivationCodeGenerator service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivationCodeGeneratorImpl } from '../ActivationCodeGenerator';
import { PrismaClient } from '@/app/generated/prisma';

// Mock PrismaClient
vi.mock('@/app/generated/prisma', () => ({
  PrismaClient: vi.fn(),
}));

describe('ActivationCodeGenerator', () => {
  let generator: ActivationCodeGeneratorImpl;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
      },
    };
    generator = new ActivationCodeGeneratorImpl(mockPrisma as PrismaClient);
  });

  describe('generate()', () => {
    it('should generate a 6-character code', () => {
      const code = generator.generate();
      expect(code).toHaveLength(6);
    });

    it('should generate code with only allowed characters', () => {
      const code = generator.generate();
      // Should only contain uppercase letters and numbers, excluding O, I, 0, 1, L
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    });

    it('should not contain ambiguous characters', () => {
      // Generate multiple codes to increase confidence
      for (let i = 0; i < 50; i++) {
        const code = generator.generate();
        expect(code).not.toMatch(/[OI01L]/);
      }
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set<string>();
      // Generate 100 codes - they should mostly be unique
      for (let i = 0; i < 100; i++) {
        codes.add(generator.generate());
      }
      // With 34^6 possible combinations, we expect high uniqueness
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('isUnique()', () => {
    it('should return true when code does not exist in database', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      
      const result = await generator.isUnique('ABC123');
      
      expect(result).toBe(true);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          activationCode: 'ABC123',
          isActivated: false,
          activationCodeExpiresAt: { gt: expect.any(Date) }
        }
      });
    });

    it('should return false when code exists in database', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        activationCode: 'ABC123',
        isActivated: false,
        activationCodeExpiresAt: new Date(Date.now() + 86400000)
      });
      
      const result = await generator.isUnique('ABC123');
      
      expect(result).toBe(false);
    });

    it('should consider expired codes as unique', async () => {
      // If a code exists but is expired, it should be considered unique
      mockPrisma.user.findFirst.mockResolvedValue(null);
      
      const result = await generator.isUnique('ABC123');
      
      expect(result).toBe(true);
    });
  });

  describe('generateUnique()', () => {
    it('should generate a unique code on first attempt', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      
      const code = await generator.generateUnique();
      
      expect(code).toHaveLength(6);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledTimes(1);
    });

    it('should retry when first code is not unique', async () => {
      // First call returns existing user, second call returns null
      mockPrisma.user.findFirst
        .mockResolvedValueOnce({ id: 'user-1', activationCode: 'ABC123' })
        .mockResolvedValueOnce(null);
      
      const code = await generator.generateUnique();
      
      expect(code).toHaveLength(6);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max attempts', async () => {
      // Always return existing user
      mockPrisma.user.findFirst.mockResolvedValue({ 
        id: 'user-1', 
        activationCode: 'ABC123' 
      });
      
      await expect(generator.generateUnique()).rejects.toThrow(
        'Failed to generate unique activation code after maximum attempts'
      );
      
      expect(mockPrisma.user.findFirst).toHaveBeenCalledTimes(10);
    });
  });
});
