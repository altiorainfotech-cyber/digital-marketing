/**
 * Asset Detail Page - Redesigned
 * 
 * Modern asset detail view with two-column layout, metadata, and actions
 * 
 * Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 22.8, 22.9, 22.10
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth';
import { useUser } from '@/lib/auth/hooks';
import { Button } from '@/lib/design-system/components/primitives/Button';
import { Badge } from '@/lib/design-system/components/primitives/Badge';
import { Chip } from '@/lib/design-system/components/primitives/Chip';
import { Breadcrumb } from '@/lib/design-system/components/composite/Breadcrumb';
import { LoadingState } from '@/lib/design-system/components/patterns/LoadingState';
import { Modal } from '@/lib/design-system/components/composite/Modal';
import { Select, SelectOption } from '@/lib/design-system/components/primitives/Select';
import { ShareModal, PlatformDownloadModal, FullscreenPreviewModal } from '@/components/assets';
import { CarouselSlider } from '@/components/CarouselSlider';
import { 
  ArrowLeft,
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  Maximize2,
  Calendar,
  User,
  Building2,
  FileType,
  HardDrive,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home
} from 'lucide-react';
import { AssetType, UploadType, AssetStatus, UserRole, Platform, VisibilityLevel } from '@/app/generated/prisma';
import { initiateAssetDownload } from '@/lib/utils/downloadHelper';

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

interface CarouselItem {
  id: string;
  storageUrl: string;
  publicUrl: string;
  itemType: AssetType;
  mimeType?: string | null;
  order: number;
}

function AssetDetailContent() {
  const user = useUser();
  const router = useRouter();
  const params = useParams();
  const assetId = params?.id as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
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
  
  // Platform download modal state
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  
  // Fullscreen preview modal state
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);

  // Admin approval/rejection modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [newVisibility, setNewVisibility] = useState<VisibilityLevel | 'SEO_SPECIALIST' | 'CONTENT_CREATOR'>(VisibilityLevel.COMPANY);
  const [processing, setProcessing] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isOwner = user?.id === asset?.uploaderId;
  const canShare = isOwner && asset?.uploadType === UploadType.DOC && 
    (asset?.visibility === VisibilityLevel.UPLOADER_ONLY || asset?.visibility === VisibilityLevel.SELECTED_USERS);
  const canApproveReject = isAdmin && asset?.status === AssetStatus.PENDING_REVIEW;

  // Detect if we came from pending approvals
  const [cameFromPendingApprovals, setCameFromPendingApprovals] = useState(false);

  useEffect(() => {
    // Check if we came from pending approvals by looking at document.referrer
    if (typeof window !== 'undefined' && document.referrer.includes('/admin/approvals')) {
      setCameFromPendingApprovals(true);
    }
  }, []);

  // Handle back navigation
  const handleBackNavigation = () => {
    if (cameFromPendingApprovals) {
      router.back();
    } else if (isAdmin) {
      router.push('/admin/assets');
    } else {
      router.push('/assets');
    }
  };

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

        // Fetch carousel items for carousel assets
        if (data.assetType === AssetType.CAROUSEL) {
          try {
            const itemsResponse = await fetch(`/api/assets/${assetId}/carousel-items`);
            if (itemsResponse.ok) {
              const itemsData = await itemsResponse.json();
              setCarouselItems(itemsData.items || []);
            } else {
              console.error('Failed to fetch carousel items:', itemsResponse.status);
            }
          } catch (err) {
            console.error('Failed to load carousel items:', err);
          }
        }

        // Fetch public URL for images and videos
        if (data.assetType === AssetType.IMAGE || data.assetType === AssetType.VIDEO) {
          try {
            const urlResponse = await fetch(`/api/assets/${assetId}/public-url`);
            if (urlResponse.ok) {
              const urlData = await urlResponse.json();
              console.log('Public URL fetched:', urlData.publicUrl);
              if (urlData.publicUrl) {
                setPublicUrl(urlData.publicUrl);
              } else {
                console.warn('Public URL is empty - check R2_PUBLIC_URL environment variable');
              }
            } else {
              console.error('Failed to fetch public URL:', urlResponse.status);
            }
          } catch (err) {
            console.error('Failed to load public URL:', err);
          }
        }
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
    console.log('[AssetDetail] Download button clicked', { 
      userRole: user?.role, 
      isSEOSpecialist: user?.role === UserRole.SEO_SPECIALIST 
    });
    
    // Check if user is SEO_SPECIALIST - they must select platforms first
    if (user?.role === UserRole.SEO_SPECIALIST) {
      console.log('[AssetDetail] Opening platform modal for SEO_SPECIALIST');
      setShowPlatformModal(true);
      return;
    }
    
    // For other users, proceed with direct download
    console.log('[AssetDetail] Direct download for non-SEO user');
    await performDownload([]);
  };

  const performDownload = async (platforms: Platform[]) => {
    try {
      await initiateAssetDownload(assetId as string, platforms, asset?.title);
      setShowPlatformModal(false);
      console.log('Download started successfully');
    } catch (err: any) {
      console.error('Download error:', err);
      alert(err.message || 'Failed to download asset');
    }
  };

  const handleApprove = async () => {
    if (!asset) return;
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

      const response = await fetch(`/api/assets/${assetId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve asset');
      }

      // Refresh asset data
      const updatedAsset = await response.json();
      setAsset(updatedAsset);
      setShowApprovalModal(false);
      
      // If came from pending approvals, go back
      if (cameFromPendingApprovals) {
        router.back();
      }
    } catch (err) {
      console.error('Approval error:', err);
      alert(err instanceof Error ? err.message : 'Failed to approve asset');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!asset || !rejectionReason.trim()) {
      alert('Rejection reason is required');
      return;
    }
    setProcessing(true);

    try {
      const response = await fetch(`/api/assets/${assetId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject asset');
      }

      // Refresh asset data
      const updatedAsset = await response.json();
      setAsset(updatedAsset);
      setShowRejectionModal(false);
      setRejectionReason('');
      
      // If came from pending approvals, go back
      if (cameFromPendingApprovals) {
        router.back();
      }
    } catch (err) {
      console.error('Rejection error:', err);
      alert(err instanceof Error ? err.message : 'Failed to reject asset');
    } finally {
      setProcessing(false);
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

  const getStatusBadgeVariant = (status: AssetStatus): 'default' | 'warning' | 'success' | 'error' => {
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
      <div className="assets-page min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16" />
        </nav>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <LoadingState message="Loading asset details..." />
        </main>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="assets-page min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Button
                variant="ghost"
                icon={<ArrowLeft className="w-4 h-4" />}
                onClick={handleBackNavigation}
              >
                {cameFromPendingApprovals ? 'Back to Pending Assets' : 'Back to Assets'}
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  icon={<Home className="w-4 h-4" />}
                  onClick={() => router.push('/admin')}
                >
                  Admin Panel
                </Button>
              )}
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error || 'Asset not found'}</span>
          </div>
        </main>
      </div>
    );
  }

  const breadcrumbItems = [
    { 
      label: cameFromPendingApprovals ? 'Pending Assets' : 'Assets', 
      href: cameFromPendingApprovals ? '/admin/approvals' : (isAdmin ? '/admin/assets' : '/assets')
    },
    { label: asset.title, href: `/assets/${asset.id}` },
  ];

  return (
    <div className="assets-page min-h-screen bg-gray-50">
      {/* Top Navigation - Mobile optimized */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                icon={<ArrowLeft className="w-4 h-4" />}
                onClick={handleBackNavigation}
                className="flex-shrink-0 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">{cameFromPendingApprovals ? 'Back to Pending Assets' : 'Back to Assets'}</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div className="hidden md:block">
                <Breadcrumb items={breadcrumbItems} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {isAdmin && (
                <Button
                  variant="outline"
                  icon={<Home className="w-4 h-4" />}
                  onClick={() => router.push('/admin')}
                  className="hidden sm:flex"
                >
                  Admin Panel
                </Button>
              )}
              {canShare && (
                <Button
                  variant="outline"
                  icon={<Share2 className="w-4 h-4" />}
                  onClick={() => setShowShareModal(true)}
                  className="flex-shrink-0"
                >
                  <span className="hidden sm:inline">Share</span>
                </Button>
              )}
              {/* Download button - Mobile optimized, always visible */}
              <Button
                variant="primary"
                icon={<Download className="w-4 h-4" />}
                onClick={handleDownload}
                className="flex-shrink-0 touch-manipulation"
              >
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        {/* Header with Title and Status - Mobile optimized */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">{asset.title}</h1>
            <Badge variant={getStatusBadgeVariant(asset.status)} size="lg" className="self-start">
              {asset.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Rejection Reason - Mobile optimized */}
        {asset.status === AssetStatus.REJECTED && asset.rejectionReason && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-semibold text-red-900 mb-1">Rejection Reason</h3>
                <p className="text-xs sm:text-sm text-red-700 break-words">{asset.rejectionReason}</p>
                {asset.rejectedAt && (
                  <p className="text-xs text-red-600 mt-2">
                    Rejected on {formatDate(asset.rejectedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Preview (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Preview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
                {((asset.assetType === AssetType.IMAGE || 
                  asset.assetType === AssetType.VIDEO || 
                  asset.assetType === AssetType.DOCUMENT) && publicUrl) ||
                  (asset.assetType === AssetType.CAROUSEL && carouselItems.length > 0) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Maximize2 className="w-4 h-4" />}
                    onClick={() => setShowFullscreenModal(true)}
                  >
                    View Fullscreen
                  </Button>
                ) : null}
              </div>
              {asset.assetType === AssetType.CAROUSEL ? (
                <CarouselSlider items={carouselItems} title={asset.title} />
              ) : (
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg aspect-video flex items-center justify-center">
                  {asset.assetType === AssetType.IMAGE ? (
                  publicUrl ? (
                    <img
                      src={publicUrl}
                      alt={asset.title}
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        console.error('Image failed to load:', publicUrl);
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="text-center p-4">
                              <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <p class="text-gray-600 mb-2">Failed to load image</p>
                              <p class="text-xs text-gray-500">Check R2 bucket CORS and public access settings</p>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center p-4">
                      <FileType className="w-16 h-16 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-700 dark:text-gray-300 mb-2">Image preview not available</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">R2_PUBLIC_URL may not be configured</p>
                    </div>
                  )
                ) : asset.assetType === AssetType.VIDEO ? (
                  publicUrl ? (
                    <video
                      src={publicUrl}
                      controls
                      className="w-full h-full rounded-lg"
                      onError={(e) => {
                        console.error('Video failed to load:', publicUrl);
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="text-center p-4">
                              <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <p class="text-gray-600 mb-2">Failed to load video</p>
                              <p class="text-xs text-gray-500">Check R2 bucket CORS and public access settings</p>
                            </div>
                          `;
                        }
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="text-center p-4">
                      <FileType className="w-16 h-16 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-700 dark:text-gray-300 mb-2">Video preview not available</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">R2_PUBLIC_URL may not be configured</p>
                    </div>
                  )
                ) : asset.assetType === AssetType.LINK ? (
                  <div className="text-center">
                    <Eye className="w-16 h-16 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 dark:text-gray-300">Link Asset</p>
                    <a
                      href={asset.storageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm mt-2 inline-block"
                    >
                      Open Link →
                    </a>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileType className="w-16 h-16 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 dark:text-gray-300">Document Asset</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Use download button to view</p>
                  </div>
                )}
                </div>
              )}
            </div>

            {/* Description */}
            {asset.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{asset.description}</p>
              </div>
            )}

            {/* Platform Usage */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Platform Usage</h2>
                <Button
                  size="sm"
                  variant={showUsageForm ? 'outline' : 'primary'}
                  onClick={() => setShowUsageForm(!showUsageForm)}
                >
                  {showUsageForm ? 'Cancel' : '+ Log Usage'}
                </Button>
              </div>

              {showUsageForm && (
                <form onSubmit={handleLogUsage} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Platform
                      </label>
                      <select
                        value={usagePlatform}
                        onChange={(e) => setUsagePlatform(e.target.value as Platform)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={usageLoading}
                  >
                    {usageLoading ? 'Logging...' : 'Log Usage'}
                  </Button>
                </form>
              )}

              {usages.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">No platform usage recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {usages.map((usage) => (
                    <div key={usage.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
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
                        <span className="text-xs text-gray-600 dark:text-gray-400">{formatDate(usage.usedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Version History */}
            {versions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Version History</h2>
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Version {version.versionNumber}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Size: {formatFileSize(version.fileSize)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{formatDate(version.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Metadata (1/3 width on desktop) */}
          <div className="space-y-6">
            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <FileType className="w-4 h-4" />
                    Asset Type
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{asset.assetType}</dd>
                </div>

                <div>
                  <dt className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <FileType className="w-4 h-4" />
                    Upload Type
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{asset.uploadType}</dd>
                </div>

                <div>
                  <dt className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <HardDrive className="w-4 h-4" />
                    File Size
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatFileSize(asset.fileSize)}
                  </dd>
                </div>

                {asset.mimeType && (
                  <div>
                    <dt className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <FileType className="w-4 h-4" />
                      MIME Type
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{asset.mimeType}</dd>
                  </div>
                )}

                <div>
                  <dt className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <User className="w-4 h-4" />
                    Uploader
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {asset.uploader?.name || 'Unknown'}
                  </dd>
                </div>

                {asset.company && (
                  <div>
                    <dt className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <Building2 className="w-4 h-4" />
                      Company
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{asset.company.name}</dd>
                  </div>
                )}

                <div>
                  <dt className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    Uploaded
                  </dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(asset.uploadedAt)}
                  </dd>
                </div>

                {asset.approvedAt && (
                  <div>
                    <dt className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <CheckCircle className="w-4 h-4" />
                      Approved
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(asset.approvedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Admin Actions - Approve/Reject */}
            {canApproveReject && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h2>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    icon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => setShowApprovalModal(true)}
                    className="flex-1"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    icon={<XCircle className="w-4 h-4" />}
                    onClick={() => setShowRejectionModal(true)}
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {/* Tags */}
            {asset.tags && asset.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map((tag, index) => (
                    <Chip key={index} size="md">
                      {tag}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Target Platforms */}
            {asset.targetPlatforms && asset.targetPlatforms.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Target Platforms</h2>
                <div className="flex flex-wrap gap-2">
                  {asset.targetPlatforms.map((platform, index) => (
                    <Badge key={index} variant="primary" size="md">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Campaign Name */}
            {asset.campaignName && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Campaign</h2>
                <p className="text-sm text-gray-700">{asset.campaignName}</p>
              </div>
            )}

            {/* Download History (Admin only) */}
            {isAdmin && downloads.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Download History</h2>
                <div className="space-y-2">
                  {downloads.slice(0, 5).map((download) => (
                    <div
                      key={download.id}
                      className="flex justify-between items-center py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {download.downloadedBy?.name || 'Unknown User'}
                        </p>
                        {download.platformIntent && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Platform: {download.platformIntent}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(download.downloadedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
      
      {/* Platform Download Modal */}
      <PlatformDownloadModal
        isOpen={showPlatformModal}
        onClose={() => setShowPlatformModal(false)}
        onConfirm={performDownload}
        assetTitle={asset?.title || 'Asset'}
      />
      
      {/* Fullscreen Preview Modal */}
      <FullscreenPreviewModal
        isOpen={showFullscreenModal}
        onClose={() => setShowFullscreenModal(false)}
        assetType={asset.assetType}
        publicUrl={publicUrl}
        storageUrl={asset.storageUrl}
        title={asset.title}
        mimeType={asset.mimeType}
        onDownload={handleDownload}
        carouselItems={carouselItems}
      />

      {/* Approval Modal */}
      {isAdmin && (
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
          <div className="space-y-4">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              You are approving: <strong>{asset.title}</strong>
            </p>

            <Select
              label="Set Visibility Level"
              options={[
                { value: VisibilityLevel.UPLOADER_ONLY, label: 'Private (Uploader Only)' },
                { value: VisibilityLevel.PUBLIC, label: 'Public (Everyone)' },
                { value: VisibilityLevel.COMPANY, label: 'Company' },
                { value: 'SEO_SPECIALIST', label: 'SEO Specialist Role' },
                { value: 'CONTENT_CREATOR', label: 'Content Creator Role' },
              ]}
              value={newVisibility}
              onChange={(e) => setNewVisibility(e.target.value as VisibilityLevel | 'SEO_SPECIALIST' | 'CONTENT_CREATOR')}
              helperText="Choose who can view this asset after approval"
              fullWidth
            />
          </div>
        </Modal>
      )}

      {/* Rejection Modal */}
      {isAdmin && (
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
          <div className="space-y-4">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              You are rejecting: <strong>{asset.title}</strong>
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
        </Modal>
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
