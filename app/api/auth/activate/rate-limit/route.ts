/**
 * Rate Limit Check API
 * 
 * Returns rate limit information for an email without making an attempt
 * Used by UI to display remaining attempts and lockout status
 * 
 * Requirements: 6.5, 11.2
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SecurityServiceImpl } from '@/lib/services/SecurityService';
import { getCacheService } from '@/lib/services/CacheService';

const cacheService = getCacheService();
const securityService = new SecurityServiceImpl(prisma as any, cacheService);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check rate limit status
    const rateLimitResult = await securityService.checkActivationRateLimit(email);

    return NextResponse.json({
      allowed: rateLimitResult.allowed,
      retryAfterMinutes: rateLimitResult.retryAfterMinutes,
      remainingAttempts: rateLimitResult.remainingAttempts,
      currentAttempts: rateLimitResult.currentAttempts,
    });
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
