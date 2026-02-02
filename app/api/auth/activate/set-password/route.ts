/**
 * Set Password API
 * 
 * Allows users to set their password after successful activation code validation
 * Completes the activation process
 * 
 * Requirements: 5.4, 5.5, 5.6, 5.7
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
    const { email, code, password } = body;

    // Validate input
    if (!email || !code || !password) {
      return NextResponse.json(
        { error: 'Email, activation code, and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength (basic check)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Set password and complete activation
    // Requirements: 5.4, 5.5, 5.6
    await activationService.setPassword(email, code, password);

    // Requirement 5.7: Return success
    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now log in.'
    });
  } catch (error) {
    console.error('Password setting error:', error);
    
    // Return appropriate error message
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
