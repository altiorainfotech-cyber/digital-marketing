/**
 * Asset Detail Page
 * 
 * Displays detailed information about an asset
 * 
 * Requirements: 7.4, 8.5, 9.4, 13.3, 14.3, 14.4, 17.1-17.6
 * 
 * Key Features:
 * - Display asset metadata (title, description, tags, type, company, uploader, dates)
 * - Show platform usage history
 * - Show download history
 * - Add download button
 * - Add platform usage logging form
 * - Add sharing controls (for Doc assets)
 * - Add version history
 * - Display rejection reason if rejected
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth';
import { useUser } from '@/lib/auth/hooks';
import { AssetType, UploadType, AssetStatus, UserRole, Platform, VisibilityLevel } from '@/app/generated/prisma';
import { ShareModal } from '@/components/assets';

interface Asset {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  assetType: AssetType;
  uploadType: UploadType;
  status: AssetStatus;
  visibility: VisibilityLevel;
  companyId?: string;
  uploaderId: string;
  storageUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
  approvedAt?: string;
  approvedById?: string;
  rejectedAt?: string;
  rejectedById?: string;
  rejectionReason?: string;
  targetPlatforms?: string[];
  campaignName?: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
  company?: {
    id: string;
    name: string;
  };
}

interface PlatformUsage {
  id: string;
  platform: Platform;
  campaignName: string;
  postUrl?: string;
  usedAt: string;
  loggedBy?: {
    name: string;
  };
}

interface Download {
  id: string;
  downloadedAt: string;
  platformIntent?: Platform;
  downloadedBy?: {
    name: string;
  };
}

interface Version {
  id: string;
  versionNumber: number;
  storageUrl: string;
  fileSize?: number;
  createdAt: string;
}

function AssetDetailContent() {
  const user = useUser();
  const router = useRouter();
  const params = useParams();
  const assetId = params?.id as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [usages, setUsages] = useState<PlatformUsage[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Platform usage form state
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [usagePlatform, setUsagePlatform] = useState<Platform>(Platform.X);
  const [usageCampaign, setUsageCampaign] = useState('');
  const [usagePostUrl, setUsagePostUrl] = useState('');
  const [usageLoading, setUsageLoading] = useState(false);

  // Sharing modal state
  const [showShareModal, setShowShareModal] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isOwner = user?.id === asset?.uploaderId;
  const canShare = isOwner && asset?.uploadType === UploadType.DOC && 
    (asset?.visibility === VisibilityLevel.UPLOADER_ONLY || asset?.visibility === VisibilityLevel.SELECTED_USERS);

  // Load asset details
  useEffect(() => {
    const fetchAsset = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/assets/${assetId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Asset not found');
          } else if (response.status === 403) {
            throw new Error('You do not have permission to view this asset');
          }
          throw new Error('Failed to load asset');
        }

        const data = await response.json();
        setAsset(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load asset');
      } finally {
        setLoading(false);
      }
    };

    if (assetId) {
      fetchAsset();
    }
  }, [assetId]);

  // Load platform usage
  useEffect(() => {
    const fetchUsages = async () => {
      try {
        const response = await fetch(`/api/assets/${assetId}/usage`);
        if (response.ok) {
          const data = await response.json();
          setUsages(data.usages || []);
        }
      } catch (err) {
        console.error('Failed to load platform usage:', err);
      }
    };

    if (assetId && asset) {
      fetchUsages();
    }
  }, [assetId, asset]);

  // Load downloads
  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const response = await fetch(`/api/assets/${assetId}/downloads`);
        if (response.ok) {
          const data = await response.json();
          setDownloads(data.downloads || []);
        }
      } catch (err) {
        console.error('Failed to load downloads:', err);
      }
    };

    if (assetId && asset && isAdmin) {
      fetchDownloads();
    }
  }, [assetId, asset, isAdmin]);

  // Load versions
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await fetch(`/api/assets/${assetId}/versions`);
        if (response.ok) {
          const data = await response.json();
          setVersions(data.versions || []);
        }
      } catch (err) {
        console.error('Failed to load versions:', err);
      }
    };

    if (assetId && asset) {
      fetchVersions();
    }
  }, [assetId, asset]);

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/assets/${assetId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to generate download URL');
      }

      const data = await response.json();
      window.open(data.downloadUrl, '_blank');
    } catch (err: any) {
      alert(err.message || 'Failed to download asset');
    }
  };

  const handleLogUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsageLoading(true);

    try {
      const response = await fetch(`/api/assets/${assetId}/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: usagePlatform,
          campaignName: usageCampaign,
          postUrl: usagePostUrl || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log platform usage');
      }

      const newUsage = await response.json();
      setUsages([newUsage, ...usages]);
      setShowUsageForm(false);
      setUsageCampaign('');
      setUsagePostUrl('');
    } catch (err: any) {
      alert(err.message || 'Failed to log platform usage');
    } finally {
      setUsageLoading(false);
    }
  };

  const getStatusBadgeColor = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case AssetStatus.PENDING_REVIEW:
        return 'bg-yellow-100 text-yellow-800';
      case AssetStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case AssetStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading asset...</div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Asset Details</h1>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Asset not found'}
          </div>
          <button
            onClick={() => router.push('/assets')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to Assets
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/assets')}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Asset Details</h1>
            </div>
            <div className="flex items-center space-x-4">
              {canShare && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Share
                </button>
              )}
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Asset Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{asset.title}</h2>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded ${getStatusBadgeColor(
                    asset.status
                  )}`}
                >
                  {asset.status}
                </span>
              </div>
            </div>

            {/* Rejection Reason */}
            {asset.status === AssetStatus.REJECTED && asset.rejectionReason && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-900 mb-2">Rejection Reason</h3>
                <p className="text-sm text-red-700">{asset.rejectionReason}</p>
                {asset.rejectedAt && (
                  <p className="text-xs text-red-600 mt-2">
                    Rejected on {formatDate(asset.rejectedAt)}
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            {asset.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{asset.description}</p>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Details</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-500">Asset Type</dt>
                    <dd className="text-sm font-medium text-gray-900">{asset.assetType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Upload Type</dt>
                    <dd className="text-sm font-medium text-gray-900">{asset.uploadType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">File Size</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatFileSize(asset.fileSize)}
                    </dd>
                  </div>
                  {asset.mimeType && (
                    <div>
                      <dt className="text-sm text-gray-500">MIME Type</dt>
                      <dd className="text-sm font-medium text-gray-900">{asset.mimeType}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Ownership</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-gray-500">Uploader</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {asset.uploader?.name || 'Unknown'}
                    </dd>
                  </div>
                  {asset.company && (
                    <div>
                      <dt className="text-sm text-gray-500">Company</dt>
                      <dd className="text-sm font-medium text-gray-900">{asset.company.name}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-gray-500">Uploaded</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatDate(asset.uploadedAt)}
                    </dd>
                  </div>
                  {asset.approvedAt && (
                    <div>
                      <dt className="text-sm text-gray-500">Approved</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {formatDate(asset.approvedAt)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Tags */}
            {asset.tags && asset.tags.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Target Platforms */}
            {asset.targetPlatforms && asset.targetPlatforms.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Target Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {asset.targetPlatforms.map((platform, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Campaign Name */}
            {asset.campaignName && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Campaign</h3>
                <p className="text-sm text-gray-700">{asset.campaignName}</p>
              </div>
            )}
          </div>

          {/* Platform Usage */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Platform Usage</h2>
              <button
                onClick={() => setShowUsageForm(!showUsageForm)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showUsageForm ? 'Cancel' : '+ Log Usage'}
              </button>
            </div>

            {showUsageForm && (
              <form onSubmit={handleLogUsage} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform
                    </label>
                    <select
                      value={usagePlatform}
                      onChange={(e) => setUsagePlatform(e.target.value as Platform)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={Platform.X}>X (Twitter)</option>
                      <option value={Platform.LINKEDIN}>LinkedIn</option>
                      <option value={Platform.INSTAGRAM}>Instagram</option>
                      <option value={Platform.META}>Meta</option>
                      <option value={Platform.YOUTUBE}>YouTube</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={usageCampaign}
                      onChange={(e) => setUsageCampaign(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter campaign name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post URL (optional)
                    </label>
                    <input
                      type="url"
                      value={usagePostUrl}
                      onChange={(e) => setUsagePostUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={usageLoading}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {usageLoading ? 'Logging...' : 'Log Usage'}
                </button>
              </form>
            )}

            {usages.length === 0 ? (
              <p className="text-sm text-gray-500">No platform usage recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {usages.map((usage) => (
                  <div key={usage.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {usage.platform} - {usage.campaignName}
                        </p>
                        {usage.postUrl && (
                          <a
                            href={usage.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View Post →
                          </a>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(usage.usedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Download History (Admin only) */}
          {isAdmin && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Download History</h2>
              {downloads.length === 0 ? (
                <p className="text-sm text-gray-500">No downloads recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {downloads.map((download) => (
                    <div
                      key={download.id}
                      className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {download.downloadedBy?.name || 'Unknown User'}
                        </p>
                        {download.platformIntent && (
                          <p className="text-xs text-gray-500">
                            Platform: {download.platformIntent}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(download.downloadedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Version History */}
          {versions.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Version History</h2>
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Version {version.versionNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        Size: {formatFileSize(version.fileSize)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(version.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Share Modal */}
      {canShare && user && (
        <ShareModal
          assetId={assetId}
          assetTitle={asset.title}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          currentUserId={user.id}
        />
      )}
    </div>
  );
}

export default function AssetDetailPage() {
  return (
    <ProtectedRoute>
      <AssetDetailContent />
    </ProtectedRoute>
  );
}
