/**
 * Pending Approvals Page
 * 
 * Admin page for reviewing and approving/rejecting assets with grid view and modals
 * 
 * Requirements: 9.3, 9.5, 9.6, 9.8
 */

'use client';

import { ProtectedRoute } from '@/components/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AssetType, VisibilityLevel } from '@/types';
import { Modal } from '@/lib/design-system/components/composite/Modal/Modal';
import { Button } from '@/lib/design-system/components/primitives/Button/Button';
import { Select, SelectOption } from '@/lib/design-system/components/primitives/Select/Select';
import { Badge } from '@/lib/design-system/components/primitives/Badge/Badge';
import { Checkbox } from '@/lib/design-system/components/primitives/Checkbox/Checkbox';
import { 
  CheckCircle, 
  XCircle, 
  FileImage, 
  FileVideo, 
  FileText, 
  Link as LinkIcon,
  X,
  Eye
} from 'lucide-react';

interface Asset {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  assetType: AssetType;
  visibility: VisibilityLevel;
  companyId?: string;
  Company?: {
    id: string;
    name: string;
  };
  uploader: {
    id: string;
    name: string;
    email: string;
  };
  uploadedAt: string;
  storageUrl: string;
  targetPlatforms?: string[];
  campaignName?: string;
}

function PendingApprovalsContent() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [newVisibility, setNewVisibility] = useState<VisibilityLevel | 'SEO_SPECIALIST' | 'CONTENT_CREATOR'>(VisibilityLevel.COMPANY);
  const [processing, setProcessing] = useState(false);
  
  // Bulk actions
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string>('');

  // Asset preview URLs
  const [assetPreviewUrls, setAssetPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPendingAssets();
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

    if (filterCompany) {
      filtered = filtered.filter((asset) => asset.companyId === filterCompany);
    }

    setFilteredAssets(filtered);
  }, [assets, filterType, filterCompany]);

  const fetchPendingAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assets/pending');
      if (!response.ok) {
        throw new Error('Failed to fetch pending assets');
      }
      const data = await response.json();
      setAssets(data.assets || []);
      setFilteredAssets(data.assets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending assets');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedAsset) return;
    setError(null);
    setProcessing(true);

    try {
      // Prepare the request body based on visibility selection
      let requestBody: any = {};
      
      if (newVisibility === 'SEO_SPECIALIST' || newVisibility === 'CONTENT_CREATOR') {
        // For role-based visibility, use ROLE visibility level and specify the role
        requestBody = {
          newVisibility: VisibilityLevel.ROLE,
          allowedRole: newVisibility
        };
      } else {
        // For other visibility levels, use as-is
        requestBody = {
          newVisibility
        };
      }

      const response = await fetch(`/api/assets/${selectedAsset.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve asset');
      }

      setShowApprovalModal(false);
      setSelectedAsset(null);
      fetchPendingAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve asset');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAsset || !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    setError(null);
    setProcessing(true);

    try {
      const response = await fetch(`/api/assets/${selectedAsset.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject asset');
      }

      setShowRejectionModal(false);
      setSelectedAsset(null);
      setRejectionReason('');
      fetchPendingAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject asset');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedAssetIds.size === 0) return;
    
    setError(null);
    setProcessing(true);

    try {
      const promises = Array.from(selectedAssetIds).map((id) =>
        fetch(`/api/assets/${id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newVisibility: VisibilityLevel.COMPANY }),
        })
      );

      await Promise.all(promises);
      setSelectedAssetIds(new Set());
      fetchPendingAssets();
    } catch (err) {
      setError('Failed to approve some assets');
    } finally {
      setProcessing(false);
    }
  };

  const openApprovalModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setNewVisibility(asset.visibility);
    setShowApprovalModal(true);
    setError(null);
  };

  const openRejectionModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setRejectionReason('');
    setShowRejectionModal(true);
    setError(null);
  };

  const handleSelectAsset = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedAssetIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedAssetIds(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedAssetIds(new Set(filteredAssets.map((a) => a.id)));
    } else {
      setSelectedAssetIds(new Set());
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
            Click "View Asset" for details
          </p>
        </div>
      </div>
    );
  };

  const visibilityOptions: SelectOption[] = [
    { value: VisibilityLevel.UPLOADER_ONLY, label: 'Private (Uploader Only)' },
    { value: VisibilityLevel.PUBLIC, label: 'Public (Everyone)' },
    { value: 'SEO_SPECIALIST', label: 'SEO Specialist Role' },
    { value: 'CONTENT_CREATOR', label: 'Content Creator Role' },
  ];

  const typeFilterOptions: SelectOption[] = [
    { value: '', label: 'All Types' },
    { value: AssetType.IMAGE, label: 'Images' },
    { value: AssetType.VIDEO, label: 'Videos' },
    { value: AssetType.DOCUMENT, label: 'Documents' },
    { value: AssetType.LINK, label: 'Links' },
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

  const hasActiveFilters = filterType || filterCompany;
  const hasSelection = selectedAssetIds.size > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Pending Approvals
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Review and approve or reject assets submitted for review
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters and Bulk Actions */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Filters */}
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
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
                  setFilterCompany('');
                }}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Bulk Actions */}
          {hasSelection && (
            <div className="flex items-center gap-3 border-l border-neutral-200 dark:border-neutral-700 pl-4">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {selectedAssetIds.size} selected
              </span>
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={handleBulkApprove}
                disabled={processing}
              >
                Approve All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAssetIds(new Set())}
              >
                Clear
              </Button>
            </div>
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
          Loading pending assets...
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-12 text-center">
          <p className="text-lg text-neutral-600 dark:text-neutral-400">No pending approvals</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">
            All assets have been reviewed
          </p>
        </div>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedAssetIds.size === filteredAssets.length}
              indeterminate={selectedAssetIds.size > 0 && selectedAssetIds.size < filteredAssets.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              aria-label="Select all assets"
            />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Select all
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Checkbox */}
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                  <Checkbox
                    checked={selectedAssetIds.has(asset.id)}
                    onChange={(e) => handleSelectAsset(asset.id, e.target.checked)}
                    aria-label={`Select ${asset.title}`}
                  />
                </div>

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
                      <Badge variant={getAssetTypeBadgeVariant(asset.assetType) as any} size="sm">
                        {asset.assetType}
                      </Badge>
                    </div>
                  </div>

                  {asset.description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                      {asset.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    <div>
                      <span className="font-medium">Uploader:</span> {asset.uploader.name}
                    </div>
                    {asset.Company && (
                      <div>
                        <span className="font-medium">Company:</span> {asset.Company.name}
                      </div>
                    )}
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
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => router.push(`/assets/${asset.id}`)}
                      fullWidth
                    >
                      View Asset
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<CheckCircle className="w-4 h-4" />}
                        onClick={() => openApprovalModal(asset)}
                        fullWidth
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<XCircle className="w-4 h-4" />}
                        onClick={() => openRejectionModal(asset)}
                        fullWidth
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        title="Approve Asset"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowApprovalModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              loading={processing}
            >
              Approve Asset
            </Button>
          </div>
        }
      >
        {selectedAsset && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              You are approving: <strong>{selectedAsset.title}</strong>
            </p>

            <Select
              label="Set Visibility Level"
              options={visibilityOptions}
              value={newVisibility}
              onChange={(e) => setNewVisibility(e.target.value as VisibilityLevel | 'SEO_SPECIALIST' | 'CONTENT_CREATOR')}
              helperText="Choose who can view this asset after approval"
              fullWidth
            />
          </div>
        )}
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        title="Reject Asset"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowRejectionModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={processing}
              disabled={!rejectionReason.trim()}
            >
              Reject Asset
            </Button>
          </div>
        }
      >
        {selectedAsset && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              You are rejecting: <strong>{selectedAsset.title}</strong>
            </p>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Rejection Reason *
              </label>
              <textarea
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="Explain why this asset is being rejected..."
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                The uploader will see this reason
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function PendingApprovalsPage() {
  return (
    <ProtectedRoute>
      <PendingApprovalsContent />
    </ProtectedRoute>
  );
}
