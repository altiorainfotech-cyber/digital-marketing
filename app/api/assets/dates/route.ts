/**
 * Asset Dates API
 * 
 * Returns all unique dates that have assets uploaded
 * Used for calendar date indicators
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authConfig';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all unique upload dates from assets
    const assets = await prisma.asset.findMany({
      where: {
        // Filter by company if user is not admin
        ...(session.user.role !== 'ADMIN' && {
          companyId: session.user.companyId,
        }),
      },
      select: {
        uploadedAt: true,
      },
    });

    // Extract unique dates (YYYY-MM-DD format)
    const uniqueDates = new Set<string>();
    assets.forEach(asset => {
      if (asset.uploadedAt) {
        const dateStr = asset.uploadedAt.toISOString().split('T')[0];
        uniqueDates.add(dateStr);
      }
    });

    return NextResponse.json({
      dates: Array.from(uniqueDates).sort(),
    });
  } catch (error) {
    console.error('Error fetching asset dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset dates' },
      { status: 500 }
    );
  }
}
