import React from 'react';
import { Card } from '@/lib/design-system/components/composite';
import { Icon } from '@/lib/design-system/components/primitives';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

export function StatCard({ title, value, icon, trend, description }: StatCardProps) {
  return (
    <Card variant="elevated" padding="lg" hoverable className="animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1">
              <Icon size={16} color={trend.isPositive ? '#22c55e' : '#ef4444'}>
                {trend.isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </Icon>
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
          {description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Icon size={24} color="#3b82f6">
              {icon}
            </Icon>
          </div>
        </div>
      </div>
    </Card>
  );
}
