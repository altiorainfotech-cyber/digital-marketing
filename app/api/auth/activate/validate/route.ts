/**
 * Activation Code Validation API
 * 
 * Validates activation codes for new users
 * 
 * Requirements: 4.4, 5.1, 5.2
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ActivationServiceImpl } from '@/lib/services/ActivationService';
import { SecurityServiceImpl } from '@/lib/services/SecurityService';
import { getCacheService } from '@/lib/services/CacheService';

const cacheService = getCacheService();
const securityService = new SecurityServiceImpl(prisma as any, cacheService);
const activationService = new ActivationServiceImpl(prisma as any, securityService);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Validate input
    if (!email || !code) {
      return NextResponse.json(
        { valid: false, error: 'Email and activation code are required' },
        { status: 400 }
      );
    }

    // Validate activation code
    const result = await activationService.validateActivationCode(email, code);

    if (!result.valid) {
      // Get updated rate limit info after failed attempt
      const rateLimitResult = await securityService.checkActivationRateLimit(email);
      
      return NextResponse.json(
        { 
          valid: false, 
          error: result.error,
          remainingAttempts: rateLimitResult.remainingAttempts,
          retryAfterMinutes: rateLimitResult.retryAfterMinutes
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      userId: result.userId,
    });
  } catch (error) {
    console.error('Activation validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
