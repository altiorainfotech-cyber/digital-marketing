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

export default function AdminSEODownloadsPage() {
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
    
    if (session?.user?.role !== UserRole.ADMIN) {
      router.push('/dashboard');
      return;
    }
    
    fetchDownloads();
  }, [session, status, router]);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/seo-downloads');

      if (!response.ok) {
        throw new Error('Failed to fetch downloads');
      }

      const data = await response.json();
      setDownloads(data.downloads || []);
    } catch (err) {
      console.error('Error fetching downloads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load downloads');
    } finally {
      setLoading(false);
    }
  };

  const filteredDownloads = downloads.filter((download) => {
    if (filterPlatform && !download.platforms.includes(filterPlatform)) {
      return false;
    }
    if (filterUser && !download.downloadedBy.name.toLowerCase().includes(filterUser.toLowerCase())) {
      return false;
    }
    if (filterCompany) {
      const companyName = download.downloadedBy.company?.name || download.asset.company?.name || '';
      if (!companyName.toLowerCase().includes(filterCompany.toLowerCase())) {
        return false;
      }
    }
    if (filterDateFrom) {
      const downloadDate = new Date(download.downloadedAt);
      const fromDate = new Date(filterDateFrom);
      if (downloadDate < fromDate) {
        return false;
      }
    }
    if (filterDateTo) {
      const downloadDate = new Date(download.downloadedAt);
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      if (downloadDate > toDate) {
        return false;
      }
    }
    return true;
  });

  const uniqueUsers = Array.from(new Set(downloads.map(d => d.downloadedBy.name))).sort();
  const uniqueCompanies = Array.from(
    new Set(
      downloads
        .map(d => d.downloadedBy.company?.name || d.asset.company?.name)
        .filter(Boolean)
    )
  ).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">Loading downloads...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              SEO Specialist Downloads
            </h1>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              View all asset downloads by SEO Specialists across the platform
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Platform Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Platform
              </label>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value as Platform | '')}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              >
                <option value="">All Platforms</option>
                {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                SEO Specialist
              </label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              >
                <option value="">All Users</option>
                {uniqueUsers.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>

            {/* Company Filter */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Company
              </label>
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              >
                <option value="">All Companies</option>
                {uniqueCompanies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(filterPlatform || filterUser || filterCompany || filterDateFrom || filterDateTo) && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setFilterPlatform('');
                  setFilterUser('');
                  setFilterCompany('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                }}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Downloads</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                  {filteredDownloads.length}
                </p>
              </div>
              <FileDown className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Unique Assets</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                  {new Set(filteredDownloads.map(d => d.assetId)).size}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">SEO Specialists</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                  {new Set(filteredDownloads.map(d => d.downloadedBy.id)).size}
                </p>
              </div>
              <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Downloads List */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Download History
            </h2>
          </div>

          {filteredDownloads.length === 0 ? (
            <div className="p-12 text-center">
              <FileDown className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400">
                No downloads found matching your filters
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredDownloads.map((download) => (
                <div key={download.id} className="p-6 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Asset Info */}
                      <div className="mb-3">
                        <a
                          href={`/assets/${download.assetId}`}
                          className="text-lg font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          {download.asset.title}
                        </a>
                        <div className="flex items-center gap-2 mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                          <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">
                            {download.asset.assetType}
                          </span>
                          {download.asset.company && (
                            <>
                              <span>•</span>
                              <MapPin className="w-3 h-3" />
                              <span>{download.asset.company.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Platforms */}
                      <div className="mb-3">
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                          Downloaded for:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {download.platforms.map((platform) => (
                            <span
                              key={platform}
                              className={`px-2 py-1 rounded-md text-xs font-medium ${PLATFORM_COLORS[platform]}`}
                            >
                              {PLATFORM_LABELS[platform]}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Download Info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{download.downloadedBy.name}</span>
                        </div>
                        {download.downloadedBy.company && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{download.downloadedBy.company.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(download.downloadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Uploader Info */}
                      <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
                        Uploaded by: {download.asset.uploader.name}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
