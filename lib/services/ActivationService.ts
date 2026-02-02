/**
 * ActivationService
 * 
 * Manages the user activation workflow including code validation and password setting.
 * This service handles the process where new users activate their accounts using
 * activation codes provided by administrators.
 * 
 * Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 6.2, 6.3, 6.4
 * 
 * Key Features:
 * - Validates activation codes against email addresses
 * - Checks rate limiting to prevent brute force attacks
 * - Validates code expiration
 * - Sets user passwords and completes activation
 * - Logs failed and successful activation attempts
 */

import { PrismaClient } from '@/app/generated/prisma';
import { SecurityService } from './SecurityService';
import { hashPassword } from '@/lib/utils/password';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  userId?: string;
}

export interface ActivationService {
  validateActivationCode(email: string, code: string): Promise<ValidationResult>;
  setPassword(email: string, code: string, password: string): Promise<void>;
}

export class ActivationServiceImpl implements ActivationService {
  constructor(
    private prisma: PrismaClient,
    private securityService: SecurityService
  ) {}

  /**
   * Validate an activation code for a given email
   * 
   * Requirements:
   * - 5.1: Validate that code matches email
   * - 5.2: Reject invalid or expired codes
   * - 6.2: Check expiration time
   * - 6.4: Log failed attempts
   * 
   * Also checks rate limiting via SecurityService (Requirement 6.5)
   * 
   * @param email - User's email address
   * @param code - Activation code to validate
   * @returns Validation result with success status and optional error message
   */
  async validateActivationCode(email: string, code: string): Promise<ValidationResult> {
    // Check rate limiting (Requirement 6.5)
    const rateLimitCheck = await this.securityService.checkActivationRateLimit(email);
    if (!rateLimitCheck.allowed) {
      return {
        valid: false,
        error: `Too many attempts. Please try again in ${rateLimitCheck.retryAfterMinutes} minutes.`
      };
    }

    // Requirement 5.1: Find user with matching email and code
    const user = await this.prisma.user.findFirst({
      where: {
        email: email,
        activationCode: code,
        isActivated: false
      }
    });

    if (!user) {
      // Requirement 6.4: Log failed attempt
      await this.securityService.logFailedActivation(email, code);
      return {
        valid: false,
        error: 'Invalid activation code or email.'
      };
    }

    // Requirement 5.2, 6.2: Check expiration
    if (user.activationCodeExpiresAt && user.activationCodeExpiresAt < new Date()) {
      return {
        valid: false,
        error: 'Activation code has expired. Please contact your administrator.'
      };
    }

    return {
      valid: true,
      userId: user.id
    };
  }

  /**
   * Set password for a user and complete activation
   * 
   * Requirements:
   * - 5.4: Store hashed password in User model
   * - 5.5: Set isActivated to true
   * - 5.6: Clear activationCode field
   * - 6.3: Set activatedAt timestamp
   * 
   * Also logs successful activation (Requirement 6.4)
   * 
   * @param email - User's email address
   * @param code - Activation code for verification
   * @param password - Plain text password to set
   * @throws Error if validation fails or password is invalid
   */
  async setPassword(email: string, code: string, password: string): Promise<void> {
    // Validate code again to ensure it's still valid
    const validation = await this.validateActivationCode(email, code);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Validate password strength (basic check)
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Requirement 5.4: Hash password
    const hashedPassword = await hashPassword(password);

    // Requirements 5.4, 5.5, 5.6, 6.3: Update user
    // - Set password (hashed)
    // - Mark as activated (isActivated = true)
    // - Clear activation code
    // - Set activation timestamp
    await this.prisma.user.update({
      where: { id: validation.userId },
      data: {
        password: hashedPassword,
        isActivated: true,
        activatedAt: new Date(),
        activationCode: null,
        activationCodeExpiresAt: null
      }
    });

    // Requirement 6.4: Log successful activation
    await this.securityService.logSuccessfulActivation(email);
  }
}
