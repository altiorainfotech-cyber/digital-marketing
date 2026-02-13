'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Platform, UserRole } from '@/types';
import { Calendar, Download, User, MapPin, ExternalLink, Eye, FileDown, ArrowLeft } from 'lucide-react';

interface PlatformDownloadRecord {
  id: string;
  assetId: string;
  downloadedAt: string;
  platforms: Platform[];
  platformIntent?: Platform;
  downloadedBy: {
    id: string;
    name: string;
    email: string;
    company?: {
      id: string;
      name: string;
    } | null;
  };
  asset: {
    id: string;
    title: string;
    assetType: string;
    description?: string;
    uploader: {
      id: string;
      name: string;
      email: string;
    };
    company?: {
      id: string;
      name: string;
    } | null;
  };
  platformUsages?: Array<{
    platform: Platform;
    postUrl?: string;
    campaignName: string;
    usedAt: Date;
  }>;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  [Platform.ADS]: 'Ads',
  [Platform.INSTAGRAM]: 'Instagram',
  [Platform.META]: 'Meta',
  [Platform.LINKEDIN]: 'LinkedIn',
  [Platform.X]: 'X (Twitter)',
  [Platform.SEO]: 'SEO',
  [Platform.BLOGS]: 'Blogs',
  [Platform.YOUTUBE]: 'YouTube',
  [Platform.SNAPCHAT]: 'Snapchat',
};

const PLATFORM_COLORS: Record<Platform, string> = {
  [Platform.ADS]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [Platform.INSTAGRAM]: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  [Platform.META]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [Platform.LINKEDIN]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  [Platform.X]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  [Platform.SEO]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [Platform.BLOGS]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [Platform.YOUTUBE]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [Platform.SNAPCHAT]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

export default function PlatformDownloadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [downloads, setDownloads] = useState<PlatformDownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<Platform | ''>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (session?.user?.role !== UserRole.CONTENT_CREATOR) {
      router.push('/dashboard');
      return;
    }
    
    fetchDownloads();
  }, [session, status, router]);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/downloads/platform-usage');
      
      if (!response.ok) {
        throw new Error('Failed to fetch platform downloads');
      }

      const data = await response.json();
      setDownloads(data.downloads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load downloads');
    } finally {
      setLoading(false);
    }
  };

  // Filter downloads
  const filteredDownloads = downloads.filter((download) => {
    const matchesPlatform = !filterPlatform || download.platforms.includes(filterPlatform);
    const matchesUser = !filterUser || 
      download.downloadedBy.name.toLowerCase().includes(filterUser.toLowerCase()) ||
      download.downloadedBy.email.toLowerCase().includes(filterUser.toLowerCase());
    const matchesCompany = !filterCompany || 
      download.downloadedBy.company?.name.toLowerCase().includes(filterCompany.toLowerCase());
    
    // Date filtering
    const downloadDate = new Date(download.downloadedAt);
    const matchesDateFrom = !filterDateFrom || downloadDate >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || downloadDate <= new Date(filterDateTo + 'T23:59:59');
    
    return matchesPlatform && matchesUser && matchesCompany && matchesDateFrom && matchesDateTo;
  });

  // Calculate statistics
  const platformStats = downloads.reduce((acc, download) => {
    if (download.platforms && Array.isArray(download.platforms)) {
      download.platforms.forEach((platform) => {
        acc[platform] = (acc[platform] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<Platform, number>);

  // Get unique companies for filter dropdown
  const uniqueCompanies = Array.from(
    new Set(
      downloads
        .map(d => d.downloadedBy.company?.name)
        .filter((name): name is string => !!name)
    )
  ).sort();

  const uniqueUsers = new Set(downloads.map(d => d.downloadedBy.id)).size;
  const totalDownloads = downloads.length;

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading platform downloads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={fetchDownloads}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Platform Downloads
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          View all downloads made by SEO Specialists and track how assets are being used across different platforms
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Downloads</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {totalDownloads}
              </p>
            </div>
            <Download className="w-10 h-10 text-primary-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">SEO Specialists</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {uniqueUsers}
              </p>
            </div>
            <User className="w-10 h-10 text-primary-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Platforms Used</p>
              <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                {Object.keys(platformStats).length}
              </p>
            </div>
            <MapPin className="w-10 h-10 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Platform Statistics */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Platform Distribution
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(platformStats)
            .sort(([, a], [, b]) => b - a)
            .map(([platform, count]) => (
              <div
                key={platform}
                className="flex flex-col items-center p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
              >
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${PLATFORM_COLORS[platform as Platform]}`}>
                  {PLATFORM_LABELS[platform as Platform]}
                </span>
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-2">
                  {count}
                </span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400">downloads</span>
              </div>
            ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Platform
            </label>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value as Platform | '')}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            >
              <option value="">All Platforms</option>
              {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              SEO Specialist
            </label>
            <input
              type="text"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Company
            </label>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            >
              <option value="">All Companies</option>
              {uniqueCompanies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Date From
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Date To
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          {(filterPlatform || filterUser || filterCompany || filterDateFrom || filterDateTo) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterPlatform('');
                  setFilterUser('');
                  setFilterCompany('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                className="w-full px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Downloads Grid */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Download History ({filteredDownloads.length})
          </h2>
        </div>

        {filteredDownloads.length === 0 ? (
          <div className="p-12 text-center">
            <Download className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 dark:text-neutral-400">
              {downloads.length === 0
                ? 'No downloads yet. SEO Specialists haven\'t downloaded any assets.'
                : 'No downloads match your filters.'}
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDownloads.map((download) => (
                <div
                  key={download.id}
                  className="bg-neutral-50 dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Card Header */}
                  <div className="p-4 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-600">
                    <div className="flex items-start justify-between mb-2">
                      <a
                        href={`/assets/${download.assetId}`}
                        className="text-base font-semibold text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2 flex-1 transition-colors"
                      >
                        {download.asset.title}
                      </a>
                      <span className="ml-2 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-xs font-medium whitespace-nowrap">
                        {download.asset.assetType}
                      </span>
                    </div>
                    {download.asset.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        {download.asset.description}
                      </p>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Asset Creator */}
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Created by</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {download.asset.uploader.name}
                        </p>
                      </div>
                    </div>

                    {/* Downloaded By */}
                    <div className="flex items-start gap-2">
                      <Download className="w-4 h-4 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Downloaded by</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {download.downloadedBy.name}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {download.downloadedBy.email}
                        </p>
                        {download.downloadedBy.company && (
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate mt-0.5">
                            {download.downloadedBy.company.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Download Date */}
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Downloaded on</p>
                        <p className="text-sm text-neutral-900 dark:text-neutral-100">
                          {new Date(download.downloadedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {new Date(download.downloadedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Platforms */}
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Platforms</p>
                      <div className="flex flex-wrap gap-1.5">
                        {download.platforms && download.platforms.length > 0 ? (
                          download.platforms.map((platform) => (
                            <span
                              key={platform}
                              className={`px-2 py-1 rounded text-xs font-medium ${PLATFORM_COLORS[platform]}`}
                            >
                              {PLATFORM_LABELS[platform]}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-neutral-400 dark:text-neutral-500 italic">
                            No platforms
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Usage Details */}
                    {download.platformUsages && download.platformUsages.length > 0 && (
                      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-600">
                        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Usage Details ({download.platformUsages.length})
                        </p>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {download.platformUsages.map((usage, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-600"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLATFORM_COLORS[usage.platform]}`}>
                                  {PLATFORM_LABELS[usage.platform]}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                {usage.campaignName}
                              </p>
                              {usage.postUrl && (
                                <a
                                  href={usage.postUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mt-1 truncate"
                                >
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{usage.postUrl}</span>
                                </a>
                              )}
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                {new Date(usage.usedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer - Action Buttons */}
                  <div className="p-3 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-600 flex gap-2">
                    <a
                      href={`/assets/${download.assetId}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Asset
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
