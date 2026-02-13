/**
 * Dashboard Page
 * 
 * Redesigned dashboard with role-specific content, statistics, quick actions, and activity feed
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9
 */

'use client';

import { ProtectedRoute } from '@/components/auth';
import { useUser, useSignOut } from '@/lib/auth/hooks';
import { StatCard, QuickAction, ActivityFeed, ActivityItem } from '@/components/dashboard';
import { PageContainer, PageHeader, TopNav } from '@/lib/design-system/components/patterns';
import { Button } from '@/lib/design-system/components/primitives';
import { 
  Users, 
  Building2, 
  FileCheck, 
  Activity,
  Upload,
  Search,
  BarChart3,
  Settings,
  FileText,
  CheckCircle,
  Edit,
  Trash2,
  Share2,
  Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useEffect, useState } from 'react';

// Helper function to get icon for activity type
function getActivityIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'create':
    case 'upload':
      return <Upload size={16} />;
    case 'update':
    case 'edit':
      return <Edit size={16} />;
    case 'delete':
      return <Trash2 size={16} />;
    case 'approve':
      return <CheckCircle size={16} />;
    case 'download':
      return <FileText size={16} />;
    case 'share':
      return <Share2 size={16} />;
    case 'view':
      return <Eye size={16} />;
    default:
      return <Activity size={16} />;
  }
}

function DashboardContent() {
  const user = useUser();
  const signOut = useSignOut();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [statsRes, activitiesRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/activities?limit=10')
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          // Transform activities to include Date objects and icons
          const transformedActivities = activitiesData.map((activity: any) => ({
            ...activity,
            timestamp: new Date(activity.timestamp),
            icon: getActivityIcon(activity.type)
          }));
          setActivities(transformedActivities);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Role-specific statistics
  const getStatistics = () => {
    if (!stats) {
      // Return loading state with zeros
      switch (user?.role) {
        case 'ADMIN':
          return [
            {
              title: 'Total Users',
              value: loading ? '...' : '0',
              icon: <Users size={24} />,
              description: 'Active users this month',
            },
            {
              title: 'Companies',
              value: loading ? '...' : '0',
              icon: <Building2 size={24} />,
              description: 'Registered companies',
            },
            {
              title: 'Pending Approvals',
              value: loading ? '...' : '0',
              icon: <FileCheck size={24} />,
              description: 'Assets awaiting review',
            },
            {
              title: 'System Health',
              value: loading ? '...' : '-',
              icon: <Activity size={24} />,
              description: 'Uptime this month',
            },
          ];
        case 'CONTENT_CREATOR':
          return [
            {
              title: 'My Assets',
              value: loading ? '...' : '0',
              icon: <FileText size={24} />,
              description: 'Total assets created',
            },
            {
              title: 'Pending Uploads',
              value: loading ? '...' : '0',
              icon: <Upload size={24} />,
              description: 'Assets in review',
            },
            {
              title: 'Approved',
              value: loading ? '...' : '0',
              icon: <CheckCircle size={24} />,
              description: 'Assets approved',
            },
            {
              title: 'Downloads',
              value: loading ? '...' : '0',
              icon: <Eye size={24} />,
              description: 'Total downloads',
            },
          ];
        case 'SEO_SPECIALIST':
          return [
            {
              title: 'Approved Assets',
              value: loading ? '...' : '0',
              icon: <FileCheck size={24} />,
              description: 'SEO-ready assets',
            },
            {
              title: 'Downloaded Assets',
              value: loading ? '...' : '0',
              icon: <FileText size={24} />,
              description: 'Assets downloaded',
            },
            {
              title: 'Platform Usage',
              value: loading ? '...' : '0',
              icon: <BarChart3 size={24} />,
              description: 'Platforms tracked',
            },
            {
              title: 'Recent Views',
              value: loading ? '...' : '0',
              icon: <Eye size={24} />,
              description: 'Views this week',
            },
          ];
        default:
          return [];
      }
    }

    // Return actual data
    switch (user?.role) {
      case 'ADMIN':
        return [
          {
            title: 'Total Users',
            value: stats.totalUsers?.toString() || '0',
            icon: <Users size={24} />,
            description: 'Active users this month',
          },
          {
            title: 'Companies',
            value: stats.totalCompanies?.toString() || '0',
            icon: <Building2 size={24} />,
            description: 'Registered companies',
          },
          {
            title: 'Pending Approvals',
            value: stats.pendingApprovals?.toString() || '0',
            icon: <FileCheck size={24} />,
            description: 'Assets awaiting review',
          },
          {
            title: 'System Health',
            value: stats.systemHealth || '99.9%',
            icon: <Activity size={24} />,
            description: 'Uptime this month',
          },
        ];
      case 'CONTENT_CREATOR':
        return [
          {
            title: 'My Assets',
            value: stats.myAssets?.toString() || '0',
            icon: <FileText size={24} />,
            description: 'Total assets created',
          },
          {
            title: 'Pending Uploads',
            value: stats.pendingUploads?.toString() || '0',
            icon: <Upload size={24} />,
            description: 'Assets in review',
          },
          {
            title: 'Approved',
            value: stats.approvedAssets?.toString() || '0',
            icon: <CheckCircle size={24} />,
            description: 'Assets approved',
          },
          {
            title: 'Downloads',
            value: stats.totalDownloads?.toString() || '0',
            icon: <Eye size={24} />,
            description: 'Total downloads',
          },
        ];
      case 'SEO_SPECIALIST':
        return [
          {
            title: 'Approved Assets',
            value: stats.approvedAssets?.toString() || '0',
            icon: <FileCheck size={24} />,
            description: 'SEO-ready assets',
          },
          {
            title: 'Downloaded Assets',
            value: stats.downloadedAssets?.toString() || '0',
            icon: <FileText size={24} />,
            description: 'Assets downloaded',
          },
          {
            title: 'Platform Usage',
            value: stats.platformsUsed?.toString() || '0',
            icon: <BarChart3 size={24} />,
            description: 'Platforms tracked',
          },
          {
            title: 'Recent Views',
            value: stats.recentViews?.toString() || '0',
            icon: <Eye size={24} />,
            description: 'Views this week',
          },
        ];
      default:
        return [];
    }
  };

  // Role-specific quick actions
  const getQuickActions = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          {
            label: 'Manage Users',
            icon: <Users size={20} />,
            onClick: () => router.push('/admin/users'),
          },
          {
            label: 'Manage Companies',
            icon: <Building2 size={20} />,
            onClick: () => router.push('/admin/companies'),
          },
          {
            label: 'Review Approvals',
            icon: <FileCheck size={20} />,
            onClick: () => router.push('/admin/approvals'),
          },
          {
            label: 'View Analytics',
            icon: <BarChart3 size={20} />,
            onClick: () => router.push('/analytics'),
          },
        ];
      case 'CONTENT_CREATOR':
        return [
          {
            label: 'Upload Asset',
            icon: <Upload size={20} />,
            onClick: () => router.push('/assets/upload'),
            variant: 'primary' as const,
          },
          {
            label: 'Browse Assets',
            icon: <Search size={20} />,
            onClick: () => router.push('/assets'),
          },
          {
            label: 'View Analytics',
            icon: <BarChart3 size={20} />,
            onClick: () => router.push('/analytics'),
          },
        ];
      case 'SEO_SPECIALIST':
        return [
          {
            label: 'Browse Assets',
            icon: <Search size={20} />,
            onClick: () => router.push('/assets'),
            variant: 'primary' as const,
          },
          {
            label: 'Download History',
            icon: <FileText size={20} />,
            onClick: () => router.push('/downloads'),
          },
          {
            label: 'View Analytics',
            icon: <BarChart3 size={20} />,
            onClick: () => router.push('/analytics'),
          },
          {
            label: 'Upload Asset',
            icon: <Upload size={20} />,
            onClick: () => router.push('/assets/upload'),
          },
        ];
      default:
        return [];
    }
  };

  const statistics = getStatistics();
  const quickActions = getQuickActions();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageContainer>
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {greeting}, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back to your dashboard. Here's what's happening today.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statistics.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              description={stat.description}
            />
          ))}
        </div>

        {/* Quick Actions and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <QuickAction
                    key={index}
                    label={action.label}
                    icon={action.icon}
                    onClick={action.onClick}
                    variant={action.variant || 'outline'}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <ActivityFeed activities={activities} maxItems={5} />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
