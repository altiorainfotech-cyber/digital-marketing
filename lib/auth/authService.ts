/**
 * Authentication Service
 * 
 * Provides authentication-related utility functions for checking
 * user activation status and login eligibility.
 * 
 * Requirements: 7.2
 */

import { prisma } from '@/lib/prisma';

/**
 * Check if a user can login
 * 
 * Verifies that:
 * - User exists
 * - User is activated (isActivated = true)
 * - User has a password set (password is not null)
 * 
 * @param userId - The ID of the user to check
 * @returns Promise resolving to true if user can login, false otherwise
 * 
 * @example
 * ```typescript
 * const canUserLogin = await canLogin('user-id-123');
 * if (!canUserLogin) {
 *   throw new Error('User cannot login - account not activated');
 * }
 * ```
 */
export async function canLogin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isActivated: true,
      password: true,
    },
  });

  return user !== null && user.isActivated && user.password !== null;
}
