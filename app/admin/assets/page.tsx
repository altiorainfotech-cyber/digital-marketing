/**
 * Admin Assets Page
 * 
 * Admin page for viewing all assets with filtering and management
 * 
 * Requirements: 7.1-7.5
 */

'use client';

import { ProtectedRoute } from '@/components/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AssetType, AssetStatus, VisibilityLevel } from '@/types';
import { Button } from '@/lib/design-system/components/primitives/Button/Button';
import { Select, SelectOption } from '@/lib/design-system/components/primitives/Select/Select';
import { Badge } from '@/lib/design-system/components/primitives/Badge/Badge';
import { 
  FileImage, 
  FileVideo, 
  FileText, 
  Link as LinkIcon,
  X,
  Eye,
  Download
} from 'lucide-react';

interface Asset {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  assetType: AssetType;
  status: AssetStatus;
  visibility: VisibilityLevel;
  companyId?: string;
  Company?: {
    id: string;
    name: string;
  };
  uploaderId: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
  storageUrl: string;
  uploadedAt: string;
  targetPlatforms?: string[];
  campaignName?: string;
}

function AdminAssetsContent() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string>('');

  // Asset preview URLs
  const [assetPreviewUrls, setAssetPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAssets();
  }, []);

  // Fetch preview URLs for assets
  useEffect(() => {
    const fetchPreviewUrls = async () => {
      const urls: Record<string, string> = {};
      
      for (const asset of filteredAssets) {
        // Only fetch preview URLs for images and videos
        if (asset.assetType === AssetType.IMAGE || asset.assetType === AssetType.VIDEO) {
          try {
            const response = await fetch(`/api/assets/${asset.id}/public-url`);
            if (response.ok) {
              const data = await response.json();
              urls[asset.id] = data.publicUrl;
            }
          } catch (err) {
            console.error(`Failed to fetch preview URL for asset ${asset.id}:`, err);
          }
        }
      }
      
      setAssetPreviewUrls(urls);
    };

    if (filteredAssets.length > 0) {
      fetchPreviewUrls();
    }
  }, [filteredAssets]);

  // Apply filters
  useEffect(() => {
    let filtered = assets;

    if (filterType) {
      filtered = filtered.filter((asset) => asset.assetType === filterType);
    }

    if (filterStatus) {
      filtered = filtered.filter((asset) => asset.status === filterStatus);
    }

    if (filterCompany) {
      filtered = filtered.filter((asset) => asset.companyId === filterCompany);
    }

    setFilteredAssets(filtered);
  }, [assets, filterType, filterStatus, filterCompany]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assets');
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }
      const data = await response.json();
      setAssets(data.assets || []);
      setFilteredAssets(data.assets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const getAssetTypeIcon = (type: AssetType) => {
    switch (type) {
      case AssetType.IMAGE:
        return <FileImage className="w-6 h-6" />;
      case AssetType.VIDEO:
        return <FileVideo className="w-6 h-6" />;
      case AssetType.DOCUMENT:
        return <FileText className="w-6 h-6" />;
      case AssetType.LINK:
        return <LinkIcon className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getAssetTypeBadgeVariant = (type: AssetType) => {
    switch (type) {
      case AssetType.IMAGE:
        return 'blue';
      case AssetType.VIDEO:
        return 'purple';
      case AssetType.DOCUMENT:
        return 'green';
      case AssetType.LINK:
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusBadgeVariant = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.APPROVED:
        return 'success';
      case AssetStatus.PENDING_REVIEW:
        return 'warning';
      case AssetStatus.REJECTED:
        return 'error';
      case AssetStatus.DRAFT:
        return 'gray';
      default:
        return 'gray';
    }
  };

  const renderAssetPreview = (asset: Asset) => {
    const previewUrl = assetPreviewUrls[asset.id];

    if (asset.assetType === AssetType.IMAGE && previewUrl) {
      return (
        <div className="relative w-full h-48 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-lg overflow-hidden mb-3">
          <img
            src={previewUrl}
            alt={asset.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                      <svg class="w-12 h-12 text-neutral-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p class="text-xs text-neutral-500">Preview unavailable</p>
                    </div>
                  </div>
                `;
              }
            }}
          />
        </div>
      );
    }

    if (asset.assetType === AssetType.VIDEO && previewUrl) {
      return (
        <div className="relative w-full h-48 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-lg overflow-hidden mb-3">
          <video
            src={previewUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                      <svg class="w-12 h-12 text-neutral-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <p class="text-xs text-neutral-500">Preview unavailable</p>
                    </div>
                  </div>
                `;
              }
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-90 flex items-center justify-center">
              <FileVideo className="w-6 h-6 text-neutral-700" />
            </div>
          </div>
        </div>
      );
    }

    // Fallback for documents, links, or when preview is not available
    return (
      <div className="relative w-full h-48 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
        <div className="text-center">
          <div className="text-neutral-400 dark:text-neutral-500 mb-2">
            {getAssetTypeIcon(asset.assetType)}
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
            {asset.assetType}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
            Click "View" for details
          </p>
        </div>
      </div>
    );
  };

  const typeFilterOptions: SelectOption[] = [
    { value: '', label: 'All Types' },
    { value: AssetType.IMAGE, label: 'Images' },
    { value: AssetType.VIDEO, label: 'Videos' },
    { value: AssetType.DOCUMENT, label: 'Documents' },
    { value: AssetType.LINK, label: 'Links' },
  ];

  const statusFilterOptions: SelectOption[] = [
    { value: '', label: 'All Statuses' },
    { value: AssetStatus.APPROVED, label: 'Approved' },
    { value: AssetStatus.PENDING_REVIEW, label: 'Pending Review' },
    { value: AssetStatus.REJECTED, label: 'Rejected' },
    { value: AssetStatus.DRAFT, label: 'Draft' },
  ];

  const uniqueCompanies = Array.from(
    new Map(
      assets
        .map((a) => a.Company)
        .filter(Boolean)
        .map((company) => [company!.id, company])
    ).values()
  );
  const companyFilterOptions: SelectOption[] = [
    { value: '', label: 'All Companies' },
    ...uniqueCompanies.map((Company) => ({
      value: Company!.id,
      label: Company!.name,
    })),
  ];

  const hasActiveFilters = filterType || filterStatus || filterCompany;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          All Assets
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          View and manage all assets in the system
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Select
              options={typeFilterOptions}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              fullWidth
            />
          </div>
          <div className="flex-1">
            <Select
              options={statusFilterOptions}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              fullWidth
            />
          </div>
          <div className="flex-1">
            <Select
              options={companyFilterOptions}
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              fullWidth
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              icon={<X className="w-4 h-4" />}
              onClick={() => {
                setFilterType('');
                setFilterStatus('');
                setFilterCompany('');
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            Showing {filteredAssets.length} of {assets.length} assets
          </div>
        )}
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          Loading assets...
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-12 text-center">
          <p className="text-lg text-neutral-600 dark:text-neutral-400">No assets found</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">
            {hasActiveFilters ? 'Try adjusting your filters' : 'No assets have been uploaded yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Content */}
              <div className="p-4">
                {/* Asset Preview Thumbnail */}
                {renderAssetPreview(asset)}

                <div className="flex items-start gap-3 mb-3">
                  <div className="text-primary-600 dark:text-primary-400">
                    {getAssetTypeIcon(asset.assetType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {asset.title}
                    </h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={getAssetTypeBadgeVariant(asset.assetType) as any} size="sm">
                        {asset.assetType}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(asset.status) as any} size="sm">
                        {asset.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {asset.description && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                    {asset.description}
                  </p>
                )}

                <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  {asset.Company && (
                    <div>
                      <span className="font-medium">Company:</span> {asset.Company.name}
                    </div>
                  )}
                  {asset.uploader && (
                    <div>
                      <span className="font-medium">Uploader:</span> {asset.uploader.name}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Visibility:</span> {asset.visibility}
                  </div>
                  <div>
                    <span className="font-medium">Uploaded:</span>{' '}
                    {new Date(asset.uploadedAt).toLocaleDateString()}
                  </div>
                </div>

                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {asset.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {asset.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded">
                        +{asset.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Eye className="w-4 h-4" />}
                    onClick={() => router.push(`/assets/${asset.id}`)}
                    fullWidth
                  >
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAssetsPage() {
  return (
    <ProtectedRoute>
      <AdminAssetsContent />
    </ProtectedRoute>
  );
}
