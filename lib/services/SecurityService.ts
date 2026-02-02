import { PrismaClient } from '@/app/generated/prisma';
import { CacheService, getCacheService } from './CacheService';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMinutes?: number;
  remainingAttempts?: number;
  currentAttempts?: number;
}

interface ActivationAttemptData {
  count: number;
  lastAttempt: string;
  lockedUntil?: string;
}

export interface SecurityService {
  checkActivationRateLimit(email: string): Promise<RateLimitResult>;
  logFailedActivation(email: string, code: string): Promise<void>;
  logSuccessfulActivation(email: string): Promise<void>;
}

export class SecurityServiceImpl implements SecurityService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MINUTES = 15;
  private readonly LOCKOUT_MINUTES = 30;

  constructor(
    private prisma: PrismaClient,
    private cache: CacheService = getCacheService()
  ) {}

  /**
   * Check if activation attempts for an email are within rate limits
   * Implements 5 attempts per 15 minutes window with 30-minute lockout
   */
  async checkActivationRateLimit(email: string): Promise<RateLimitResult> {
    const cacheKey = `activation_attempts:${email}`;

    // Get attempt count from cache
    const attempts = await this.cache.get(cacheKey);

    if (!attempts) {
      return { 
        allowed: true,
        remainingAttempts: this.MAX_ATTEMPTS,
        currentAttempts: 0
      };
    }

    const attemptData: ActivationAttemptData = JSON.parse(attempts);

    // Check if locked out
    if (attemptData.lockedUntil && new Date(attemptData.lockedUntil) > new Date()) {
      const minutesRemaining = Math.ceil(
        (new Date(attemptData.lockedUntil).getTime() - Date.now()) / 60000
      );
      return {
        allowed: false,
        retryAfterMinutes: minutesRemaining,
        remainingAttempts: 0,
        currentAttempts: attemptData.count
      };
    }

    // If lockout has expired, allow the attempt (counter will be reset on next failure)
    if (attemptData.lockedUntil && new Date(attemptData.lockedUntil) <= new Date()) {
      return { 
        allowed: true,
        remainingAttempts: this.MAX_ATTEMPTS,
        currentAttempts: 0
      };
    }

    // Check if within window and exceeded max attempts
    if (attemptData.count >= this.MAX_ATTEMPTS) {
      // Lock out for 30 minutes
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + this.LOCKOUT_MINUTES);

      attemptData.lockedUntil = lockedUntil.toISOString();
      await this.cache.set(
        cacheKey,
        JSON.stringify(attemptData),
        this.LOCKOUT_MINUTES * 60
      );

      return {
        allowed: false,
        retryAfterMinutes: this.LOCKOUT_MINUTES,
        remainingAttempts: 0,
        currentAttempts: attemptData.count
      };
    }

    return { 
      allowed: true,
      remainingAttempts: this.MAX_ATTEMPTS - attemptData.count,
      currentAttempts: attemptData.count
    };
  }

  /**
   * Log a failed activation attempt
   * Increments attempt counter and logs to audit log
   */
  async logFailedActivation(email: string, code: string): Promise<void> {
    const cacheKey = `activation_attempts:${email}`;

    // Increment attempt counter
    const attempts = await this.cache.get(cacheKey);
    let attemptData: ActivationAttemptData = attempts
      ? JSON.parse(attempts)
      : { count: 0, lastAttempt: '' };

    attemptData.count += 1;
    attemptData.lastAttempt = new Date().toISOString();

    // Store with TTL of window duration
    await this.cache.set(
      cacheKey,
      JSON.stringify(attemptData),
      this.WINDOW_MINUTES * 60
    );

    // Log to audit log
    await this.prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'LOGIN',
        resourceType: 'USER',
        resourceId: email,
        metadata: {
          type: 'failed_activation',
          code: code.substring(0, 2) + '****', // Partial code for security
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Log a successful activation
   * Clears attempt counter and logs to audit log
   */
  async logSuccessfulActivation(email: string): Promise<void> {
    const cacheKey = `activation_attempts:${email}`;

    // Clear attempt counter
    await this.cache.delete(cacheKey);

    // Log to audit log
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          resourceType: 'USER',
          resourceId: user.id,
          metadata: {
            type: 'successful_activation',
            timestamp: new Date().toISOString(),
          },
        },
      });
    }
  }
}
