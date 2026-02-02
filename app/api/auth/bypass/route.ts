/**
 * TEMPORARY BYPASS LOGIN ENDPOINT
 * This creates a session without database verification
 * USE ONLY FOR EMERGENCY ACCESS - REMOVE AFTER FIXING DATABASE CONNECTION
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-here-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // HARDCODED BYPASS - REMOVE AFTER FIXING
    // Check against environment variables for bypass credentials
    const bypassEmail = process.env.BYPASS_EMAIL;
    const bypassPassword = process.env.BYPASS_PASSWORD;

    if (!bypassEmail || !bypassPassword) {
      return NextResponse.json(
        { error: 'Bypass credentials not configured. Set BYPASS_EMAIL and BYPASS_PASSWORD environment variables.' },
        { status: 503 }
      );
    }

    if (email === bypassEmail && password === bypassPassword) {
      // Create JWT token manually
      const token = await new SignJWT({
        id: 'bypass-admin-id',
        email: bypassEmail,
        name: 'Admin',
        role: 'ADMIN',
        companyId: null,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(new TextEncoder().encode(SECRET));

      const response = NextResponse.json({
        success: true,
        message: 'Bypass login successful',
        user: {
          id: 'bypass-admin-id',
          email: bypassEmail,
          name: 'Admin',
          role: 'ADMIN',
        },
      });

      // Set session cookie
      response.cookies.set('next-auth.session-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Bypass login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
