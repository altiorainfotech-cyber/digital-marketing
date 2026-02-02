/**
 * Regenerate Activation Code API Route
 * 
 * POST /api/users/[id]/regenerate-activation-code - Regenerate activation code (Admin only)
 * 
 * Requirements: 1.4
 * 
 * Key Features:
 * - Admin-only access
 * - Generates new unique activation code
 * - Updates expiration to 7 days from regeneration
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth';
import { UserManagementServiceImpl } from '@/lib/services/UserManagementService';
import { ActivationCodeGeneratorImpl } from '@/lib/services/ActivationCodeGenerator';
import prisma from '@/lib/prisma';
import { handleApiError, parseServiceError } from '@/lib/errors/api-handler';

const codeGenerator = new ActivationCodeGeneratorImpl(prisma as any);
const userManagementService = new UserManagementServiceImpl(codeGenerator, prisma as any);

/**
 * Extract IP address from request
 */
function getIpAddress(request: NextRequest): string | undefined {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    undefined
  );
}

/**
 * Extract user agent from request
 */
function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * POST /api/users/[id]/regenerate-activation-code
 * 
 * Regenerate activation code for a user (Admin only)
 * 
 * Response:
 * {
 *   activationCode: string;
 * }
 * 
 * Errors:
 * - 400: User already activated
 * - 401: Unauthorized (not authenticated)
 * - 403: Forbidden (not admin)
 * - 404: User not found
 * - 500: Internal server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdmin(async (req, { user }) => {
    try {
      const { id: userId } = await params;
      
      // Regenerate activation code
      const newCode = await userManagementService.regenerateActivationCode(userId);
      
      return NextResponse.json({
        activationCode: newCode,
      });
    } catch (error: any) {
      console.error('Error regenerating activation code:', error);
      return handleApiError(parseServiceError(error), {
        userId: user.id,
        action: 'REGENERATE_ACTIVATION_CODE',
        resourceType: 'USER',
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
      });
    }
  })(request);
}
