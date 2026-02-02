/**
 * UserManagementService
 * 
 * Manages user creation with activation codes and activation code regeneration.
 * This service is specifically for the activation code workflow where users
 * are created without passwords and must activate their accounts.
 * 
 * Requirements: 1.6, 2.4, 2.5, 3.5, 6.1, 8.1, 1.4
 * 
 * Key Features:
 * - Creates users with auto-generated activation codes
 * - Sets 7-day expiration for activation codes
 * - Creates users without passwords (password=null)
 * - Allows users without company assignment (companyId=null)
 * - Regenerates activation codes with new expiration
 */

import { PrismaClient, UserRole, User } from '@/app/generated/prisma';
import { ActivationCodeGenerator } from './ActivationCodeGenerator';

export interface CreateUserInput {
  name: string;
  email: string;
  role: UserRole;
}

export interface CreateUserWithActivationResult {
  user: User;
  activationCode: string;
}

export interface UserManagementService {
  createUser(data: CreateUserInput): Promise<CreateUserWithActivationResult>;
  regenerateActivationCode(userId: string): Promise<string>;
}

export class UserManagementServiceImpl implements UserManagementService {
  private readonly EXPIRATION_DAYS = 7;
  
  constructor(
    private codeGenerator: ActivationCodeGenerator,
    private prisma: PrismaClient
  ) {}

  /**
   * Create a new user with an activation code
   * 
   * Requirements:
   * - 1.6: Create user with generated activation code
   * - 2.4: Store activation code in User model
   * - 2.5: Associate code with creation timestamp
   * - 3.5: Set isActivated to false and password to null
   * - 6.1: Set expiration time of 7 days from creation
   * - 8.1: Allow users to be created without company assignment
   * 
   * @param data - User creation input (name, email, role)
   * @returns Created user and activation code
   * @throws Error if email already exists or code generation fails
   */
  async createUser(data: CreateUserInput): Promise<CreateUserWithActivationResult> {
    const { name, email, role } = data;
    
    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Validate role is a valid UserRole
    if (!Object.values(UserRole).includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${Object.values(UserRole).join(', ')}`);
    }
    
    // Requirement 2.4, 2.5: Generate unique activation code
    const activationCode = await this.codeGenerator.generateUnique();
    
    // Requirement 6.1: Calculate expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.EXPIRATION_DAYS);
    
    // Requirement 1.6, 3.5, 8.1: Create user with activation code
    // - isActivated = false (unactivated state)
    // - password = null (no password until activation)
    // - companyId = null (no company assignment required)
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        role,
        activationCode,
        activationCodeExpiresAt: expiresAt,
        isActivated: false,
        password: null,
        companyId: null
      }
    });
    
    return { user, activationCode };
  }

  /**
   * Regenerate activation code for an existing user
   * 
   * Requirement 1.4: Generate new unique code and update expiration
   * 
   * @param userId - ID of the user to regenerate code for
   * @returns New activation code
   * @throws Error if user not found or user is already activated
   */
  async regenerateActivationCode(userId: string): Promise<string> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is already activated
    if (user.isActivated) {
      throw new Error('Cannot regenerate activation code for already activated user');
    }
    
    // Generate new unique code
    const newCode = await this.codeGenerator.generateUnique();
    
    // Update expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.EXPIRATION_DAYS);
    
    // Update user with new code and expiration
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        activationCode: newCode,
        activationCodeExpiresAt: expiresAt
      }
    });
    
    return newCode;
  }

  /**
   * Validate email format
   * 
   * @param email - Email to validate
   * @returns True if valid, false otherwise
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
