/**
 * ActivationCodeGenerator
 * 
 * Generates secure, unique activation codes for user account activation.
 * 
 * Requirements: 2.1, 2.2, 2.3
 * 
 * Key Features:
 * - Generates 6-character alphanumeric codes
 * - Uses crypto.randomInt for secure random generation
 * - Excludes ambiguous characters (O, I, 0, 1, L)
 * - Ensures uniqueness by checking database for existing active codes
 * - Retry logic for generating unique codes (max 10 attempts)
 */

import { PrismaClient } from '@/app/generated/prisma';
import crypto from 'crypto';

export interface ActivationCodeGenerator {
  generate(): string;
  isUnique(code: string): Promise<boolean>;
  generateUnique(): Promise<string>;
}

export class ActivationCodeGeneratorImpl implements ActivationCodeGenerator {
  private readonly CODE_LENGTH = 6;
  // Requirement 2.3: Exclude ambiguous characters (O, I, 0, 1, L)
  private readonly CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  private readonly MAX_ATTEMPTS = 10;
  
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate a random 6-character activation code
   * 
   * Requirement 2.1: Generate 6-character alphanumeric code
   * Requirement 2.3: Use uppercase letters and numbers, exclude ambiguous characters
   * 
   * @returns A 6-character activation code
   */
  generate(): string {
    let code = '';
    for (let i = 0; i < this.CODE_LENGTH; i++) {
      // Use crypto.randomInt for secure random generation
      const randomIndex = crypto.randomInt(0, this.CHARSET.length);
      code += this.CHARSET[randomIndex];
    }
    return code;
  }

  /**
   * Check if an activation code is unique in the database
   * 
   * Requirement 2.2: Ensure each generated code is unique across all active codes
   * 
   * @param code - The activation code to check
   * @returns True if the code is unique, false otherwise
   */
  async isUnique(code: string): Promise<boolean> {
    // Check database for existing active codes
    // A code is considered active if:
    // - isActivated is false (user hasn't activated yet)
    // - activationCodeExpiresAt is in the future (code hasn't expired)
    const existing = await this.prisma.user.findFirst({
      where: {
        activationCode: code,
        isActivated: false,
        activationCodeExpiresAt: { gt: new Date() }
      }
    });
    
    return existing === null;
  }

  /**
   * Generate a unique activation code with retry logic
   * 
   * Requirement 2.2: Ensure uniqueness across all active codes
   * 
   * @returns A unique 6-character activation code
   * @throws Error if unable to generate unique code after max attempts
   */
  async generateUnique(): Promise<string> {
    // Retry until unique code is found (max 10 attempts)
    for (let attempt = 0; attempt < this.MAX_ATTEMPTS; attempt++) {
      const code = this.generate();
      if (await this.isUnique(code)) {
        return code;
      }
    }
    
    throw new Error('Failed to generate unique activation code after maximum attempts');
  }
}
