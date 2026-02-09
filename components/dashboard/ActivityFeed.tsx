import React from 'react';
import { Card } from '@/lib/design-system/components/composite';
import { Icon } from '@/lib/design-system/components/primitives';
import { Badge } from '@/lib/design-system/components/primitives';
import { EmptyState } from '@/lib/design-system/components/patterns';
import { Clock } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'upload' | 'approval' | 'edit' | 'delete' | 'share';
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ReactNode;
}

export interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

export function ActivityFeed({ activities, maxItems = 5 }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  if (activities.length === 0) {
    return (
      <Card variant="elevated" padding="lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <EmptyState
          title="No recent activity"
          message="Your recent actions will appear here"
          icon={<Clock size={48} />}
        />
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {displayedActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0"
          >
            <div className="flex-shrink-0 mt-1">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Icon size={16} color="#3b82f6">
                  {activity.icon}
                </Icon>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.title}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {activity.description}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                <Clock size={12} />
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}
