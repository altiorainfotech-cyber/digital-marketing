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
import { useMemo } from 'react';

function DashboardContent() {
  const user = useUser();
  const signOut = useSignOut();
  const router = useRouter();

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // TODO: Fetch real activities from API
  const mockActivities: ActivityItem[] = [];

  // Role-specific statistics - TODO: Fetch from API
  const getStatistics = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          {
            title: 'Total Users',
            value: '0',
            icon: <Users size={24} />,
            description: 'Active users this month',
          },
          {
            title: 'Companies',
            value: '0',
            icon: <Building2 size={24} />,
            description: 'Registered companies',
          },
          {
            title: 'Pending Approvals',
            value: '0',
            icon: <FileCheck size={24} />,
            description: 'Assets awaiting review',
          },
          {
            title: 'System Health',
            value: '-',
            icon: <Activity size={24} />,
            description: 'Uptime this month',
          },
        ];
      case 'CONTENT_CREATOR':
        return [
          {
            title: 'My Assets',
            value: '0',
            icon: <FileText size={24} />,
            description: 'Total assets created',
          },
          {
            title: 'Pending Uploads',
            value: '0',
            icon: <Upload size={24} />,
            description: 'Assets in review',
          },
          {
            title: 'Approved',
            value: '0',
            icon: <CheckCircle size={24} />,
            description: 'Assets approved',
          },
          {
            title: 'Views',
            value: '0',
            icon: <Eye size={24} />,
            description: 'Total asset views',
          },
        ];
      case 'SEO_SPECIALIST':
        return [
          {
            title: 'Approved Assets',
            value: '0',
            icon: <FileCheck size={24} />,
            description: 'SEO-ready assets',
          },
          {
            title: 'SEO Performance',
            value: '-',
            icon: <BarChart3 size={24} />,
            description: 'Optimization score',
          },
          {
            title: 'Recent Views',
            value: '0',
            icon: <Eye size={24} />,
            description: 'Views this week',
          },
          {
            title: 'Shared Assets',
            value: '0',
            icon: <Share2 size={24} />,
            description: 'Assets shared',
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
      <TopNav
        logo={<span className="text-xl font-bold text-blue-600">DASCMS</span>}
        rightContent={
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {user?.name} ({user?.role})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
            >
              Sign Out
            </Button>
          </div>
        }
      />

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
            <ActivityFeed activities={mockActivities} maxItems={5} />
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
