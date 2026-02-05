/**
 * AssetCard Component
 * 
 * Displays asset information in grid or list view with preview thumbnails
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.9, 6.10
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Badge } from '@/lib/design-system/components/primitives/Badge';
import { Checkbox } from '@/lib/design-system/components/primitives/Checkbox';
import { Button } from '@/lib/design-system/components/primitives/Button';
import { 
  FileImage, 
  FileVideo, 
  FileText, 
  Link as LinkIcon,
  Download,
  Share2,
  Eye,
  MoreVertical
} from 'lucide-react';
import { AssetType, AssetStatus, Platform, UserRole } from '@/app/generated/prisma';
import { PlatformDownloadModal } from './PlatformDownloadModal';
import { initiateAssetDownload } from '@/lib/utils/downloadHelper';

export interface AssetCardData {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  assetType: AssetType;
  status: AssetStatus;
  thumbnailUrl?: string;
  fileSize?: number;
  uploadedAt: string;
  rejectionReason?: string;
  uploader?: {
    name: string;
  };
  company?: {
    name: string;
  };
  Company?: {
    id: string;
    name: string;
  };
}

export interface AssetCardProps {
  asset: AssetCardData;
  view?: 'grid' | 'list';
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onQuickAction?: (action: string, id: string) => void;
  showCheckbox?: boolean;
}

/**
 * Get icon for asset type
 */
function getAssetTypeIcon(assetType: AssetType) {
  switch (assetType) {
    case AssetType.IMAGE:
      return <FileImage className="w-8 h-8" />;
    case AssetType.VIDEO:
      return <FileVideo className="w-8 h-8" />;
    case AssetType.DOCUMENT:
      return <FileText className="w-8 h-8" />;
    case AssetType.LINK:
      return <LinkIcon className="w-8 h-8" />;
    default:
      return <FileText className="w-8 h-8" />;
  }
}

/**
 * Get badge variant for asset status
 */
function getStatusBadgeVariant(status: AssetStatus): 'default' | 'warning' | 'success' | 'error' {
  switch (status) {
    case AssetStatus.DRAFT:
      return 'default';
    case AssetStatus.PENDING_REVIEW:
      return 'warning';
    case AssetStatus.APPROVED:
      return 'success';
    case AssetStatus.REJECTED:
      return 'error';
    default:
      return 'default';
  }
}

/**
 * Format file size
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return 'N/A';
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}

/**
 * Format date
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

/**
 * Render asset preview thumbnail
 */
function AssetPreview({ asset, previewUrl, hasError }: { asset: AssetCardData; previewUrl?: string; hasError?: boolean }) {
  // Show fallback icon while loading or if there's an error
  if ((asset.assetType === AssetType.IMAGE || asset.assetType === AssetType.VIDEO) && !previewUrl) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <div className="text-blue-600 mb-2 flex justify-center">
            {getAssetTypeIcon(asset.assetType)}
          </div>
          <p className="text-sm text-gray-600 font-medium">{asset.assetType}</p>
          {hasError && (
            <p className="text-xs text-red-500 mt-1">No preview access</p>
          )}
        </div>
      </div>
    );
  }

  if (asset.assetType === AssetType.IMAGE && previewUrl) {
    return (
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
                  <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p class="text-xs text-gray-500">Image load failed</p>
                </div>
              </div>
            `;
          }
        }}
      />
    );
  }

  if (asset.assetType === AssetType.VIDEO && previewUrl) {
    return (
      <>
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
                    <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p class="text-xs text-gray-500">Video load failed</p>
                  </div>
                </div>
              `;
            }
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
            <FileVideo className="w-8 h-8 text-white" />
          </div>
        </div>
      </>
    );
  }

  // Fallback for documents, links
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-center">
        <div className="text-blue-600 mb-2 flex justify-center">
          {getAssetTypeIcon(asset.assetType)}
        </div>
        <p className="text-sm text-gray-600 font-medium">{asset.assetType}</p>
      </div>
    </div>
  );
}

/**
 * AssetCard - Grid View
 */
function AssetCardGrid({ 
  asset, 
  selected, 
  onSelect, 
  onQuickAction,
  showCheckbox 
}: AssetCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showActions, setShowActions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);

  // Fetch preview URL for images and videos
  useEffect(() => {
    const fetchPreviewUrl = async () => {
      if (asset.assetType === AssetType.IMAGE || asset.assetType === AssetType.VIDEO) {
        setLoadingPreview(true);
        setPreviewError(false);
        try {
          const response = await fetch(`/api/assets/${asset.id}/public-url`);
          if (response.ok) {
            const data = await response.json();
            setPreviewUrl(data.publicUrl);
          } else {
            // If we get 403 or other error, mark as error so we show fallback
            console.warn(`Failed to fetch preview URL for asset ${asset.id}: ${response.status} ${response.statusText}`);
            setPreviewError(true);
          }
        } catch (err) {
          console.error(`Failed to fetch preview URL for asset ${asset.id}:`, err);
          setPreviewError(true);
        } finally {
          setLoadingPreview(false);
        }
      }
    };

    fetchPreviewUrl();
  }, [asset.id, asset.assetType]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking checkbox or action buttons
    if ((e.target as HTMLElement).closest('input, button')) {
      return;
    }
    router.push(`/assets/${asset.id}`);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if user is SEO_SPECIALIST - they must select platforms first
    if (session?.user?.role === UserRole.SEO_SPECIALIST) {
      setShowPlatformModal(true);
      return;
    }
    
    // For other users, proceed with direct download
    await performDownload([]);
  };

  const performDownload = async (platforms: Platform[]) => {
    try {
      await initiateAssetDownload(asset.id, platforms, asset.title);
      setShowPlatformModal(false);
    } catch (err: any) {
      console.error('Download error:', err);
      alert(err.message || 'Failed to download asset');
    }
  };

  return (
    <>
      <PlatformDownloadModal
        isOpen={showPlatformModal}
        onClose={() => setShowPlatformModal(false)}
        onConfirm={performDownload}
        assetTitle={asset.title}
      />
      
      <div
        className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group relative"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={handleCardClick}
      >
      {/* Checkbox */}
      {showCheckbox && (
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={selected || false}
            onChange={(e) => {
              e.stopPropagation();
              onSelect?.(asset.id, !selected);
            }}
            aria-label={`Select ${asset.title}`}
          />
        </div>
      )}

      {/* Thumbnail or Icon with Preview */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center overflow-hidden">
        {loadingPreview ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <AssetPreview asset={asset} previewUrl={previewUrl} hasError={previewError} />
        )}

        {/* Hover Overlay with Quick Actions */}
        {showActions && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 transition-opacity duration-300">
            <Button
              size="sm"
              variant="secondary"
              icon={<Eye className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/assets/${asset.id}`);
              }}
              aria-label="View asset"
            >
              View
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={handleDownload}
              aria-label="Download asset"
            >
              Download
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header with Status Badge */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-2">
            {asset.title}
          </h3>
          <Badge variant={getStatusBadgeVariant(asset.status)} size="sm">
            {asset.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Rejection Reason */}
        {asset.status === AssetStatus.REJECTED && asset.rejectionReason && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <strong>Rejected:</strong> {asset.rejectionReason}
          </div>
        )}

        {/* Description */}
        {asset.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {asset.description}
          </p>
        )}

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {asset.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                +{asset.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Company Name - Prominent Display */}
        {(asset.company || asset.Company) && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-sm font-semibold text-blue-900">{asset.company?.name || asset.Company?.name}</span>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>{asset.assetType}</span>
            <span>{formatFileSize(asset.fileSize)}</span>
          </div>
          <div>Uploaded: {formatDate(asset.uploadedAt)}</div>
        </div>

        {/* Direct Download Button */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <Button
            size="sm"
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownload}
            fullWidth
          >
            Download
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}

/**
 * AssetCard - List View
 */
function AssetCardList({ 
  asset, 
  selected, 
  onSelect, 
  onQuickAction,
  showCheckbox 
}: AssetCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showPlatformModal, setShowPlatformModal] = useState(false);

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking checkbox or action buttons
    if ((e.target as HTMLElement).closest('input, button')) {
      return;
    }
    router.push(`/assets/${asset.id}`);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if user is SEO_SPECIALIST - they must select platforms first
    if (session?.user?.role === UserRole.SEO_SPECIALIST) {
      setShowPlatformModal(true);
      return;
    }
    
    // For other users, proceed with direct download
    await performDownload([]);
  };

  const performDownload = async (platforms: Platform[]) => {
    try {
      await initiateAssetDownload(asset.id, platforms, asset.title);
      setShowPlatformModal(false);
    } catch (err: any) {
      console.error('Download error:', err);
      alert(err.message || 'Failed to download asset');
    }
  };

  return (
    <>
      <PlatformDownloadModal
        isOpen={showPlatformModal}
        onClose={() => setShowPlatformModal(false)}
        onConfirm={performDownload}
        assetTitle={asset.title}
      />
      
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
        onClick={handleRowClick}
      >
      {/* Checkbox */}
      {showCheckbox && (
        <td className="px-6 py-4 whitespace-nowrap">
          <Checkbox
            checked={selected || false}
            onChange={(e) => {
              e.stopPropagation();
              onSelect?.(asset.id, !selected);
            }}
            aria-label={`Select ${asset.title}`}
          />
        </td>
      )}

      {/* Asset Info */}
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3 text-gray-400">
            {getAssetTypeIcon(asset.assetType)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {asset.title}
            </div>
            {asset.status === AssetStatus.REJECTED && asset.rejectionReason && (
              <div className="text-xs text-red-600 mt-1 truncate max-w-md">
                <strong>Rejected:</strong> {asset.rejectionReason}
              </div>
            )}
            {asset.description && asset.status !== AssetStatus.REJECTED && (
              <div className="text-sm text-gray-500 truncate max-w-md">
                {asset.description}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {asset.assetType}
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={getStatusBadgeVariant(asset.status)} size="sm">
          {asset.status.replace('_', ' ')}
        </Badge>
      </td>

      {/* Size */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatFileSize(asset.fileSize)}
      </td>

      {/* Uploaded */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(asset.uploadedAt)}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={<Eye className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/assets/${asset.id}`);
            }}
            aria-label="View asset"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownload}
            aria-label="Download asset"
          />
        </div>
      </td>
    </tr>
    </>
  );
}

/**
 * Main AssetCard component - switches between grid and list view
 */
export function AssetCard(props: AssetCardProps) {
  const { view = 'grid' } = props;

  if (view === 'list') {
    return <AssetCardList {...props} />;
  }

  return <AssetCardGrid {...props} />;
}
