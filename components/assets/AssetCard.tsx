/**
 * AssetCard Component
 * 
 * Displays asset information in grid or list view
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.9, 6.10
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { AssetType, AssetStatus } from '@/app/generated/prisma';

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
  const [showActions, setShowActions] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking checkbox or action buttons
    if ((e.target as HTMLElement).closest('input, button')) {
      return;
    }
    router.push(`/assets/${asset.id}`);
  };

  return (
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

      {/* Thumbnail or Icon */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        {asset.thumbnailUrl ? (
          <img
            src={asset.thumbnailUrl}
            alt={asset.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-blue-600">
            {getAssetTypeIcon(asset.assetType)}
          </div>
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
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction?.('download', asset.id);
              }}
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

        {/* Metadata */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>{asset.assetType}</span>
            <span>{formatFileSize(asset.fileSize)}</span>
          </div>
          <div>Uploaded: {formatDate(asset.uploadedAt)}</div>
          {asset.company && <div>Company: {asset.company.name}</div>}
        </div>
      </div>
    </div>
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

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking checkbox or action buttons
    if ((e.target as HTMLElement).closest('input, button')) {
      return;
    }
    router.push(`/assets/${asset.id}`);
  };

  return (
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
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction?.('download', asset.id);
            }}
            aria-label="Download asset"
          />
        </div>
      </td>
    </tr>
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
