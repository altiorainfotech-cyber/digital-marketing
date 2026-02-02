/**
 * TEMPORARY Setup Route - Create Initial Admin User
 * 
 * ⚠️ DELETE THIS FILE AFTER CREATING THE ADMIN USER!
 * 
 * This route creates the initial admin user for the system.
 * It should only be used once during initial setup and then deleted.
 * 
 * Usage:
 *   POST http://localhost:3000/api/setup/admin
 *   
 * Or with curl:
 *   curl -X POST http://localhost:3000/api/setup/admin
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Check if any admin users already exist
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (adminCount > 0) {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      return NextResponse.json(
        {
          error: 'Admin user(s) already exist',
          existingAdmins: admins.map(a => ({
            email: a.email,
            name: a.name,
            createdAt: a.createdAt,
          })),
          message: 'You can sign in with one of the existing admin accounts.',
        },
        { status: 400 }
      );
    }

    // Create the default admin user with environment-based or random credentials
    const defaultAdmin = {
      name: process.env.ADMIN_NAME || 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || `Admin${Math.random().toString(36).slice(-8)}!`,
    };

    const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);

    const user = await prisma.user.create({
      data: {
        name: defaultAdmin.name,
        email: defaultAdmin.email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        resourceType: 'USER',
        resourceId: user.id,
        metadata: {
          role: 'ADMIN',
          createdBy: 'system',
          source: 'setup API route',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      credentials: {
        email: defaultAdmin.email,
        password: defaultAdmin.password,
      },
      warning: '⚠️ IMPORTANT: Change this password after first login!',
      nextSteps: [
        '1. Sign in at /auth/signin with the credentials above',
        '2. Change your password immediately',
        '3. Delete this setup route: rm -rf app/api/setup',
      ],
    });
  } catch (error) {
    console.error('Error creating admin user:', error);

    return NextResponse.json(
      {
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Also support GET for easy browser testing
export async function GET() {
  return NextResponse.json({
    message: 'Admin Setup Route',
    instructions: 'Send a POST request to this endpoint to create the initial admin user.',
    warning: '⚠️ This route should be deleted after creating the admin user!',
    usage: {
      method: 'POST',
      url: '/api/setup/admin',
      curl: 'curl -X POST http://localhost:3000/api/setup/admin',
    },
  });
}
