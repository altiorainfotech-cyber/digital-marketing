/**
 * Password Hashing Utilities
 * 
 * Provides secure password hashing and verification using bcryptjs
 * 
 * Requirements: 1.3, 11.1
 */

import { hash, compare } from 'bcryptjs';

/**
 * Number of salt rounds for bcrypt hashing
 * Higher values = more secure but slower
 * 10 is a good balance for production
 */
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * 
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  return hash(password, SALT_ROUNDS);
}

/**
 * Verify a plain text password against a hashed password
 * 
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}
