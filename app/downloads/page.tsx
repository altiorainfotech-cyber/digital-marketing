'use client';

import { ProtectedRoute } from '@/components/auth';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Platform, UserRole, AssetType } from '@/types';
import Link from 'next/link';
import { Calendar, Clock, Image as ImageIcon, Video, FileText, Link2, Images, ArrowLeft } from 'lucide-react';

interface DownloadRecord {
  id: string;
  assetId: string;
  downloadedAt: string;
  platforms: Platform[];
  asset: {
    id: string;
    title: string;
    assetType: string;
    description?: string;
    storageUrl?: string;
  };
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

const PLATFORM_ICONS: Record<Platform, string> = {
  [Platform.ADS]: '📢',
  [Platform.INSTAGRAM]: '📷',
  [Platform.META]: '👥',
  [Platform.LINKEDIN]: '💼',
  [Platform.X]: '🐦',
  [Platform.SEO]: '🔍',
  [Platform.BLOGS]: '📝',
  [Platform.YOUTUBE]: '📺',
  [Platform.SNAPCHAT]: '👻',
};

function DownloadHistoryContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<Platform | ''>('');

  useEffect(() => {
    if (session?.user?.role !== UserRole.SEO_SPECIALIST) {
      router.push('/dashboard');
      return;
    }
    fetchDownloads();
  }, [session, router]);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/downloads/my-history');
      
      if (!response.ok) {
        throw new Error('Failed to fetch download history');
      }

      const data = await response.json();
      console.log('[Download History] Fetched downloads:', data.downloads);
      console.log('[Download History] Sample download platforms:', data.downloads[0]?.platforms);
      setDownloads(data.downloads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load downloads');
    } finally {
      setLoading(false);
    }
  };

  const filteredDownloads = filterPlatform
    ? downloads.filter((d) => d.platforms.includes(filterPlatform))
    : downloads;

  const platformStats = downloads.reduce((acc, download) => {
    if (download.platforms && Array.isArray(download.platforms)) {
      download.platforms.forEach((platform) => {
        acc[platform] = (acc[platform] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<Platform, number>);

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5" />;
      case 'VIDEO':
        return <Video className="w-5 h-5" />;
      case 'DOCUMENT':
        return <FileText className="w-5 h-5" />;
      case 'LINK':
        return <Link2 className="w-5 h-5" />;
      case 'CAROUSEL':
        return <Images className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getPublicUrl = (storageUrl?: string) => {
    if (!storageUrl) return null;
    
    // If it's already a full HTTP URL, return it
    if (storageUrl.startsWith('http://') || storageUrl.startsWith('https://')) {
      return storageUrl;
    }
    
    // Get public URL from environment
    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (!publicUrl) {
      console.warn('NEXT_PUBLIC_R2_PUBLIC_URL not configured');
      return null;
    }
    
    // Extract the key from R2 storage URL
    // Format: r2://bucket-name/path/to/file.ext
    if (storageUrl.startsWith('r2://')) {
      const match = storageUrl.match(/^r2:\/\/[^/]+\/(.+)$/);
      if (match && match[1]) {
        const key = match[1];
        const fullUrl = `${publicUrl}/${key}`;
        console.log('Generated public URL:', fullUrl, 'from storage URL:', storageUrl);
        return fullUrl;
      }
    }
    
    // Fallback: if it's just a path, append to public URL
    const cleanPath = storageUrl.startsWith('/') ? storageUrl.slice(1) : storageUrl;
    const fullUrl = `${publicUrl}/${cleanPath}`;
    console.log('Generated public URL (fallback):', fullUrl, 'from storage URL:', storageUrl);
    return fullUrl;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  if (session?.user?.role !== UserRole.SEO_SPECIALIST) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors touch-manipulation active:scale-95 p-1 -ml-1"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Back to Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Download History</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            Track all assets you've downloaded and the platforms you're using them on
          </p>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded text-sm">
            {error}
          </div>
        )}

        {/* Platform Statistics - Mobile optimized */}
        {Object.keys(platformStats).length > 0 && (
          <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Platform Usage</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
              {Object.entries(platformStats).map(([platform, count]) => (
                <div
                  key={platform}
                  className="flex items-center gap-2 p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-xl sm:text-2xl flex-shrink-0">{PLATFORM_ICONS[platform as Platform]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {PLATFORM_LABELS[platform as Platform]}
                    </div>
                    <div className="text-xs text-gray-500">{count} download{count !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter - Mobile optimized */}
        <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <label className="text-sm font-medium text-gray-700 flex-shrink-0">Filter by Platform:</label>
            <div className="flex items-center gap-3 flex-1">
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value as Platform | '')}
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Platforms</option>
                {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {filterPlatform && (
                <button
                  onClick={() => setFilterPlatform('')}
                  className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Downloads List - Mobile optimized */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Download History ({filteredDownloads.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-6 sm:p-8 text-center text-gray-500">Loading downloads...</div>
          ) : filteredDownloads.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-gray-500">
              {filterPlatform ? 'No downloads found for this platform' : 'No downloads yet'}
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredDownloads.map((download) => {
                  const publicUrl = getPublicUrl(download.asset.storageUrl);
                  const isImage = download.asset.assetType === 'IMAGE';
                  const isVideo = download.asset.assetType === 'VIDEO';

                  return (
                    <div
                      key={download.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
                    >
                      {/* Asset Preview - Mobile optimized */}
                      <Link href={`/assets/${download.assetId}`}>
                        <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden group cursor-pointer touch-manipulation active:opacity-90">
                          {isImage && publicUrl ? (
                            <img
                              src={publicUrl}
                              alt={download.asset.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'flex flex-col items-center justify-center text-gray-400';
                                  fallback.innerHTML = `
                                    <svg class="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span class="text-sm">Preview unavailable</span>
                                  `;
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          ) : isVideo && publicUrl ? (
                            <div className="relative w-full h-full">
                              <video
                                src={publicUrl}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                <Video className="w-12 h-12 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              {getAssetIcon(download.asset.assetType)}
                              <span className="text-sm mt-2">{download.asset.assetType}</span>
                            </div>
                          )}
                          
                          {/* Asset Type Badge */}
                          <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs font-medium rounded flex items-center gap-1">
                            {getAssetIcon(download.asset.assetType)}
                            <span>{download.asset.assetType}</span>
                          </div>
                        </div>
                      </Link>

                      {/* Card Content - Mobile optimized */}
                      <div className="p-3 sm:p-4">
                        {/* Title */}
                        <Link
                          href={`/assets/${download.assetId}`}
                          className="block mb-2 touch-manipulation"
                        >
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 hover:text-blue-600 active:text-blue-700 transition-colors line-clamp-2">
                            {download.asset.title}
                          </h3>
                        </Link>

                        {/* Description */}
                        {download.asset.description && (
                          <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                            {download.asset.description}
                          </p>
                        )}

                        {/* Download Date & Time - Mobile optimized */}
                        <div className="mb-3 space-y-1">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{formatDate(download.downloadedAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{formatTime(download.downloadedAt)}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              ({formatRelativeTime(download.downloadedAt)})
                            </span>
                          </div>
                        </div>

                        {/* Platforms - Mobile optimized */}
                        <div className="border-t border-gray-200 pt-3">
                          <div className="text-xs font-medium text-gray-700 mb-2">
                            Used on platforms:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {download.platforms && download.platforms.length > 0 ? (
                              download.platforms.map((platform) => (
                                <span
                                  key={platform}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                                >
                                  <span className="text-sm">{PLATFORM_ICONS[platform]}</span>
                                  <span className="hidden sm:inline">{PLATFORM_LABELS[platform]}</span>
                                  <span className="sm:hidden">{PLATFORM_LABELS[platform].substring(0, 3)}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500 italic">
                                No platforms selected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DownloadHistoryPage() {
  return (
    <ProtectedRoute>
      <DownloadHistoryContent />
    </ProtectedRoute>
  );
}
