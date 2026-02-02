/**
 * Analytics Dashboard Page
 * 
 * Displays comprehensive analytics with charts, metrics, and data tables.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.7, 11.8, 24.1-24.9
 * 
 * Key Features:
 * - Date range selector with presets
 * - Metric cards with icons and trends
 * - Charts for upload trends, assets by type, user activity
 * - Data tables for detailed breakdowns
 * - Responsive design
 * - Loading states
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth';
import { useUser } from '@/lib/auth/hooks';
import { Card } from '@/lib/design-system/components/composite/Card/Card';
import { Button } from '@/lib/design-system/components/primitives/Button/Button';
import { LineChartWrapper, BarChartWrapper, PieChartWrapper } from '@/components/charts';
import { 
  TrendingUp, 
  TrendingDown, 
  FileImage, 
  Users, 
  Activity,
  Calendar,
  Download,
  Eye,
  Upload
} from 'lucide-react';
import { Platform, UserRole } from '@/app/generated/prisma';

interface PlatformUsage {
  id: string;
  platform: Platform;
  campaignName: string;
  postUrl?: string;
  usedAt: string;
  loggedBy?: {
    name: string;
  };
  asset?: {
    id: string;
    title: string;
  };
}

interface Asset {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

function AnalyticsContent() {
  const user = useUser();
  const router = useRouter();

  const [usages, setUsages] = useState<PlatformUsage[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { start, end, label: 'Last 30 Days' };
  });

  const isAdmin = user?.role === UserRole.ADMIN;

  // Date range presets
  const datePresets = [
    {
      label: 'Last 7 Days',
      getDates: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return { start, end };
      },
    },
    {
      label: 'Last 30 Days',
      getDates: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { start, end };
      },
    },
    {
      label: 'Last 90 Days',
      getDates: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 90);
        return { start, end };
      },
    },
    {
      label: 'This Year',
      getDates: () => {
        const end = new Date();
        const start = new Date(end.getFullYear(), 0, 1);
        return { start, end };
      },
    },
  ];

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch assets
        const assetsResponse = await fetch('/api/assets');
        if (!assetsResponse.ok) {
          throw new Error('Failed to load assets');
        }
        const assetsData = await assetsResponse.json();
        setAssets(assetsData.assets || []);

        // Fetch usage data
        const allUsages: PlatformUsage[] = [];
        for (const asset of assetsData.assets || []) {
          try {
            const usageResponse = await fetch(`/api/assets/${asset.id}/usage`);
            if (usageResponse.ok) {
              const usageData = await usageResponse.json();
              const usagesWithAsset = (usageData.usages || []).map((usage: any) => ({
                ...usage,
                asset: {
                  id: asset.id,
                  title: asset.title,
                },
              }));
              allUsages.push(...usagesWithAsset);
            }
          } catch (err) {
            console.error(`Failed to load usage for asset ${asset.id}:`, err);
          }
        }
        setUsages(allUsages);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data by date range
  const filteredUsages = useMemo(() => {
    return usages.filter((usage) => {
      const usageDate = new Date(usage.usedAt);
      return usageDate >= dateRange.start && usageDate <= dateRange.end;
    });
  }, [usages, dateRange]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const assetDate = new Date(asset.createdAt);
      return assetDate >= dateRange.start && assetDate <= dateRange.end;
    });
  }, [assets, dateRange]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalAssets = assets.length;
    const newAssets = filteredAssets.length;
    const totalUsages = filteredUsages.length;
    const uniqueUsers = new Set(filteredUsages.map((u) => u.loggedBy?.name).filter(Boolean)).size;

    // Calculate trends (compare with previous period)
    const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
    const previousStart = new Date(dateRange.start.getTime() - periodLength);
    const previousEnd = dateRange.start;

    const previousAssets = assets.filter((a) => {
      const date = new Date(a.createdAt);
      return date >= previousStart && date < previousEnd;
    }).length;

    const previousUsages = usages.filter((u) => {
      const date = new Date(u.usedAt);
      return date >= previousStart && date < previousEnd;
    }).length;

    const assetTrend = previousAssets > 0 
      ? ((newAssets - previousAssets) / previousAssets) * 100 
      : newAssets > 0 ? 100 : 0;

    const usageTrend = previousUsages > 0 
      ? ((totalUsages - previousUsages) / previousUsages) * 100 
      : totalUsages > 0 ? 100 : 0;

    return {
      totalAssets,
      newAssets,
      assetTrend,
      totalUsages,
      usageTrend,
      uniqueUsers,
    };
  }, [assets, filteredAssets, filteredUsages, usages, dateRange]);

  // Upload trends data (by day)
  const uploadTrendsData = useMemo(() => {
    const dayMap = new Map<string, number>();
    
    filteredAssets.forEach((asset) => {
      const date = new Date(asset.createdAt);
      const dayKey = date.toISOString().split('T')[0];
      dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
    });

    const sortedDays = Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        uploads: count,
      }));

    return sortedDays;
  }, [filteredAssets]);

  // Assets by type data
  const assetsByTypeData = useMemo(() => {
    const typeMap = new Map<string, number>();
    
    filteredAssets.forEach((asset) => {
      const type = asset.type || 'unknown';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });

    return Array.from(typeMap.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [filteredAssets]);

  // Platform usage data
  const platformUsageData = useMemo(() => {
    const platformMap = new Map<Platform, number>();
    
    filteredUsages.forEach((usage) => {
      platformMap.set(usage.platform, (platformMap.get(usage.platform) || 0) + 1);
    });

    return Array.from(platformMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredUsages]);

  // User activity data (top 10 users)
  const userActivityData = useMemo(() => {
    const userMap = new Map<string, number>();
    
    filteredUsages.forEach((usage) => {
      const userName = usage.loggedBy?.name || 'Unknown';
      userMap.set(userName, (userMap.get(userName) || 0) + 1);
    });

    return Array.from(userMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        activity: count,
      }));
  }, [filteredUsages]);

  const handleDatePreset = (preset: typeof datePresets[0]) => {
    const dates = preset.getDates();
    setDateRange({ ...dates, label: preset.label });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Activity className="w-6 h-6 text-primary-600 mr-3" />
              <h1 className="text-xl font-semibold text-neutral-900">Analytics Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/assets')}
              >
                Back to Assets
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Date Range Selector */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neutral-600" />
              <span className="font-medium text-neutral-900">Date Range:</span>
              <span className="text-neutral-600">{dateRange.label}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {datePresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant={dateRange.label === preset.label ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleDatePreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Assets */}
          <Card hoverable>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Assets</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{metrics.totalAssets}</p>
                <div className="flex items-center mt-2">
                  {metrics.assetTrend >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-error-600 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${metrics.assetTrend >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                    {Math.abs(metrics.assetTrend).toFixed(1)}%
                  </span>
                  <span className="text-sm text-neutral-500 ml-1">vs previous period</span>
                </div>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <FileImage className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </Card>

          {/* New Assets */}
          <Card hoverable>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">New Assets</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{metrics.newAssets}</p>
                <p className="text-sm text-neutral-500 mt-2">In selected period</p>
              </div>
              <div className="p-3 bg-success-100 rounded-lg">
                <Upload className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </Card>

          {/* Total Usage */}
          <Card hoverable>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Usage</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{metrics.totalUsages}</p>
                <div className="flex items-center mt-2">
                  {metrics.usageTrend >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-error-600 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${metrics.usageTrend >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                    {Math.abs(metrics.usageTrend).toFixed(1)}%
                  </span>
                  <span className="text-sm text-neutral-500 ml-1">vs previous period</span>
                </div>
              </div>
              <div className="p-3 bg-warning-100 rounded-lg">
                <Eye className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </Card>

          {/* Active Users */}
          <Card hoverable>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Active Users</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{metrics.uniqueUsers}</p>
                <p className="text-sm text-neutral-500 mt-2">Unique contributors</p>
              </div>
              <div className="p-3 bg-info-100 rounded-lg">
                <Users className="w-6 h-6 text-info-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Upload Trends */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Upload Trends</h2>
            <LineChartWrapper
              data={uploadTrendsData}
              lines={[{ dataKey: 'uploads', name: 'Uploads', color: '#3b82f6' }]}
              loading={loading}
              emptyMessage="No upload data for selected period"
              height={300}
            />
          </Card>

          {/* Assets by Type */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Assets by Type</h2>
            <PieChartWrapper
              data={assetsByTypeData}
              loading={loading}
              emptyMessage="No asset data available"
              height={300}
            />
          </Card>

          {/* Platform Usage */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Platform Usage</h2>
            <BarChartWrapper
              data={platformUsageData}
              bars={[{ dataKey: 'value', name: 'Usage Count', color: '#22c55e' }]}
              loading={loading}
              emptyMessage="No platform usage data"
              height={300}
            />
          </Card>

          {/* User Activity */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Top Users by Activity</h2>
            <BarChartWrapper
              data={userActivityData}
              bars={[{ dataKey: 'activity', name: 'Activity', color: '#f59e0b' }]}
              loading={loading}
              emptyMessage="No user activity data"
              height={300}
            />
          </Card>
        </div>

        {/* Detailed Breakdown Table */}
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recent Activity</h2>
          {filteredUsages.length === 0 ? (
            <p className="text-sm text-neutral-500">No activity records found for the selected period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredUsages.slice(0, 20).map((usage) => (
                    <tr key={usage.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/assets/${usage.asset?.id}`)}
                          className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                        >
                          {usage.asset?.title || 'Unknown Asset'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {usage.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {usage.campaignName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {new Date(usage.usedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {usage.loggedBy?.name || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsages.length > 20 && (
                <div className="px-6 py-4 text-sm text-neutral-500 text-center border-t border-neutral-200">
                  Showing 20 of {filteredUsages.length} records
                </div>
              )}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}
