/**
 * Dashboard Activities API
 * 
 * GET /api/dashboard/activities - Get recent activities for the authenticated user
 * 
 * Returns recent activities based on the user's role and permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authConfig';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = session;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch recent audit logs for the user
    const activities = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: user.id },
          ...(user.role === 'ADMIN' ? [{}] : []) // Admins see all activities
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        User: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Transform to activity format
    const formattedActivities = activities.map(log => ({
      id: log.id,
      type: log.action.toLowerCase(),
      title: formatActivityTitle(log.action, log.resourceType),
      description: `${log.action} on ${log.resourceType}`,
      timestamp: log.createdAt.toISOString(),
      user: log.User?.name || 'Unknown User',
      metadata: {
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        action: log.action
      }
    }));

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching dashboard activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

function formatActivityTitle(action: string, resourceType: string): string {
  const actionMap: Record<string, string> = {
    CREATE: 'Created',
    UPDATE: 'Updated',
    DELETE: 'Deleted',
    APPROVE: 'Approved',
    REJECT: 'Rejected',
    DOWNLOAD: 'Downloaded',
    UPLOAD: 'Uploaded',
    SHARE: 'Shared',
    VIEW: 'Viewed'
  };

  const resourceMap: Record<string, string> = {
    USER: 'user',
    COMPANY: 'company',
    ASSET: 'asset',
    APPROVAL: 'approval'
  };

  const actionText = actionMap[action] || action;
  const resourceText = resourceMap[resourceType] || resourceType.toLowerCase();

  return `${actionText} ${resourceText}`;
}
