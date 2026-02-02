/**
 * SecurityService Tests
 * 
 * Unit tests for the SecurityService
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SecurityServiceImpl } from '../SecurityService';
import { CacheService } from '../CacheService';
import { PrismaClient } from '@/app/generated/prisma';

// Mock PrismaClient
vi.mock('@/app/generated/prisma', () => ({
  PrismaClient: vi.fn(),
}));

describe('SecurityService', () => {
  let securityService: SecurityServiceImpl;
  let mockPrisma: any;
  let mockCache: CacheService;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    // Create a real cache instance for testing
    mockCache = new CacheService();

    securityService = new SecurityServiceImpl(
      mockPrisma as PrismaClient,
      mockCache
    );
  });

  afterEach(() => {
    // Clean up cache after each test
    mockCache.destroy();
  });

  describe('checkActivationRateLimit()', () => {
    it('should allow activation when no previous attempts exist', async () => {
      const result = await securityService.checkActivationRateLimit('test@example.com');

      expect(result.allowed).toBe(true);
      expect(result.retryAfterMinutes).toBeUndefined();
    });

    it('should allow activation when attempts are below limit', async () => {
      const email = 'test@example.com';
      
      // Simulate 3 failed attempts
      await mockCache.set(
        `activation_attempts:${email}`,
        JSON.stringify({ count: 3, lastAttempt: new Date().toISOString() }),
        900 // 15 minutes
      );

      const result = await securityService.checkActivationRateLimit(email);

      expect(result.allowed).toBe(true);
    });

    it('should trigger lockout on 5th attempt', async () => {
      const email = 'test@example.com';
      
      // Simulate 5 failed attempts
      await mockCache.set(
        `activation_attempts:${email}`,
        JSON.stringify({ count: 5, lastAttempt: new Date().toISOString() }),
        900 // 15 minutes
      );

      const result = await securityService.checkActivationRateLimit(email);

      expect(result.allowed).toBe(false);
      expect(result.retryAfterMinutes).toBe(30);
    });

    it('should block attempts during lockout period', async () => {
      const email = 'test@example.com';
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + 25); // 25 minutes remaining
      
      await mockCache.set(
        `activation_attempts:${email}`,
        JSON.stringify({
          count: 5,
          lastAttempt: new Date().toISOString(),
          lockedUntil: lockedUntil.toISOString(),
        }),
        1800 // 30 minutes
      );

      const result = await securityService.checkActivationRateLimit(email);

      expect(result.allowed).toBe(false);
      expect(result.retryAfterMinutes).toBeGreaterThan(24);
      expect(result.retryAfterMinutes).toBeLessThanOrEqual(26);
    });

    it('should allow attempts after lockout expires', async () => {
      const email = 'test@example.com';
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() - 1); // Expired 1 minute ago
      
      await mockCache.set(
        `activation_attempts:${email}`,
        JSON.stringify({
          count: 5,
          lastAttempt: new Date().toISOString(),
          lockedUntil: lockedUntil.toISOString(),
        }),
        1800
      );

      const result = await securityService.checkActivationRateLimit(email);

      expect(result.allowed).toBe(true);
    });
  });

  describe('logFailedActivation()', () => {
    it('should increment attempt counter on first failure', async () => {
      const email = 'test@example.com';
      const code = 'ABC123';

      mockPrisma.auditLog.create.mockResolvedValue({});

      await securityService.logFailedActivation(email, code);

      // Check cache was updated
      const cached = await mockCache.get(`activation_attempts:${email}`);
      expect(cached).not.toBeNull();
      
      const attemptData = JSON.parse(cached!);
      expect(attemptData.count).toBe(1);
      expect(attemptData.lastAttempt).toBeDefined();
    });

    it('should increment existing attempt counter', async () => {
      const email = 'test@example.com';
      const code = 'ABC123';

      // Set initial attempts
      await mockCache.set(
        `activation_attempts:${email}`,
        JSON.stringify({ count: 2, lastAttempt: new Date().toISOString() }),
        900
      );

      mockPrisma.auditLog.create.mockResolvedValue({});

      await securityService.logFailedActivation(email, code);

      // Check cache was updated
      const cached = await mockCache.get(`activation_attempts:${email}`);
      const attemptData = JSON.parse(cached!);
      expect(attemptData.count).toBe(3);
    });

    it('should store partial code in audit log', async () => {
      const email = 'test@example.com';
      const code = 'ABC123';

      mockPrisma.auditLog.create.mockResolvedValue({});

      await securityService.logFailedActivation(email, code);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'system',
          action: 'LOGIN',
          resourceType: 'USER',
          resourceId: email,
          metadata: {
            type: 'failed_activation',
            code: 'AB****', // First 2 chars only
            timestamp: expect.any(String),
          },
        },
      });
    });

    it('should handle codes shorter than 2 characters gracefully', async () => {
      const email = 'test@example.com';
      const code = 'A';

      mockPrisma.auditLog.create.mockResolvedValue({});

      await securityService.logFailedActivation(email, code);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            code: 'A****',
          }),
        }),
      });
    });
  });

  describe('logSuccessfulActivation()', () => {
    it('should clear attempt counter on success', async () => {
      const email = 'test@example.com';

      // Set some failed attempts
      await mockCache.set(
        `activation_attempts:${email}`,
        JSON.stringify({ count: 3, lastAttempt: new Date().toISOString() }),
        900
      );

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: email,
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      await securityService.logSuccessfulActivation(email);

      // Check cache was cleared
      const cached = await mockCache.get(`activation_attempts:${email}`);
      expect(cached).toBeNull();
    });

    it('should create audit log entry with user ID', async () => {
      const email = 'test@example.com';
      const userId = 'user-123';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: email,
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      await securityService.logSuccessfulActivation(email);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: userId,
          action: 'LOGIN',
          resourceType: 'USER',
          resourceId: userId,
          metadata: {
            type: 'successful_activation',
            timestamp: expect.any(String),
          },
        },
      });
    });

    it('should handle user not found gracefully', async () => {
      const email = 'test@example.com';

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Should not throw error
      await expect(
        securityService.logSuccessfulActivation(email)
      ).resolves.not.toThrow();

      // Should not create audit log if user not found
      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('Rate limiting integration', () => {
    it('should enforce rate limit after 5 failed attempts', async () => {
      const email = 'test@example.com';
      const code = 'ABC123';

      mockPrisma.auditLog.create.mockResolvedValue({});

      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await securityService.logFailedActivation(email, code);
      }

      // 6th attempt should be blocked
      const result = await securityService.checkActivationRateLimit(email);
      expect(result.allowed).toBe(false);
      expect(result.retryAfterMinutes).toBe(30);
    });

    it('should allow attempts after successful activation clears counter', async () => {
      const email = 'test@example.com';
      const code = 'ABC123';

      mockPrisma.auditLog.create.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: email,
      });

      // Simulate 4 failed attempts
      for (let i = 0; i < 4; i++) {
        await securityService.logFailedActivation(email, code);
      }

      // Successful activation
      await securityService.logSuccessfulActivation(email);

      // Should allow new attempts
      const result = await securityService.checkActivationRateLimit(email);
      expect(result.allowed).toBe(true);
    });
  });
});
