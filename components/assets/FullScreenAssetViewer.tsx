/**
 * FullScreenAssetViewer Component
 * 
 * Full-screen modal for viewing assets (images, videos, PDFs, documents)
 * Accessible to all user roles (SEO, Admin, Creator)
 * 
 * Features:
 * - Full-screen viewing for better asset understanding
 * - Support for images, videos, PDFs, and documents
 * - Navigation controls for carousel assets
 * - Download and share actions
 * - Responsive design
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/lib/design-system/components/primitives/Button';
import { 
  X, 
  Download, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  ExternalLink
} from 'lucide-react';
import { AssetType, UserRole, Platform } from '@/app/generated/prisma';
import { PlatformDownloadModal } from './PlatformDownloadModal';
import { initiateAssetDownload } from '@/lib/utils/downloadHelper';

export interface FullScreenAssetViewerProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  assetTitle: string;
  assetType: AssetType;
  publicUrl?: string;
  carouselItems?: Array<{
    id: string;
    publicUrl: string;
    itemType: AssetType;
    order: number;
  }>;
  onShare?: () => void;
  canShare?: boolean;
}

export function FullScreenAssetViewer({
  isOpen,
  onClose,
  assetId,
  assetTitle,
  assetType,
  publicUrl,
  carouselItems = [],
  onShare,
  canShare = false,
}: FullScreenAssetViewerProps) {
  const { data: session } = useSession();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setZoom(1);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && carouselItems.length > 0) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && carouselItems.length > 0) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, carouselItems.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : carouselItems.length - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < carouselItems.length - 1 ? prev + 1 : 0));
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = async () => {
    // Check if user is SEO_SPECIALIST - they must select platforms first
    if (session?.user?.role === UserRole.SEO_SPECIALIST) {
      setShowPlatformModal(true);
      return;
    }

    // Direct download for other roles
    await performDownload([]);
  };

  const performDownload = async (platforms: Platform[]) => {
    setLoading(true);
    try {
      await initiateAssetDownload(assetId, platforms, assetTitle);
      setShowPlatformModal(false);
    } catch (err: any) {
      console.error('Download error:', err);
      alert(err.message || 'Failed to download asset');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Determine current asset to display
  const isCarousel = assetType === AssetType.CAROUSEL && carouselItems.length > 0;
  const currentAsset = isCarousel ? carouselItems[currentIndex] : null;
  const displayUrl = isCarousel ? currentAsset?.publicUrl : publicUrl;
  const displayType = isCarousel ? currentAsset?.itemType : assetType;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
        onClick={onClose}
      >
        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex-1">
              <h2 className="text-white text-xl font-semibold truncate">
                {assetTitle}
              </h2>
              {isCarousel && (
                <p className="text-gray-300 text-sm mt-1">
                  {currentIndex + 1} of {carouselItems.length}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Zoom Controls (for images only) */}
              {displayType === AssetType.IMAGE && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomOut();
                    }}
                    className="text-white hover:bg-white/20"
                    disabled={zoom <= 0.5}
                  >
                    <ZoomOut className="w-5 h-5" />
                  </Button>
                  <span className="text-white text-sm min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomIn();
                    }}
                    className="text-white hover:bg-white/20"
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="w-5 h-5" />
                  </Button>
                  <div className="w-px h-6 bg-gray-600 mx-2" />
                </>
              )}

              {/* Share Button */}
              {canShare && onShare && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </Button>
              )}

              {/* Download Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                disabled={loading}
                className="text-white hover:bg-white/20"
              >
                <Download className="w-5 h-5 mr-2" />
                {loading ? 'Downloading...' : 'Download'}
              </Button>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div 
          className="relative w-full h-full flex items-center justify-center p-16"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Carousel Navigation - Previous */}
          {isCarousel && carouselItems.length > 1 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-10"
              aria-label="Previous item"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Asset Display */}
          <div className="max-w-full max-h-full flex items-center justify-center">
            {displayType === AssetType.IMAGE && displayUrl && (
              <img
                src={displayUrl}
                alt={assetTitle}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              />
            )}

            {displayType === AssetType.VIDEO && displayUrl && (
              <video
                src={displayUrl}
                controls
                className="max-w-full max-h-full"
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            )}

            {displayType === AssetType.DOCUMENT && displayUrl && (
              <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] overflow-hidden">
                {displayUrl.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={displayUrl}
                    className="w-full h-full"
                    title={assetTitle}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <FileText className="w-24 h-24 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Document Preview
                    </h3>
                    <p className="text-gray-600 mb-6 text-center">
                      This document type cannot be previewed in the browser.
                    </p>
                    <Button
                      onClick={handleDownload}
                      disabled={loading}
                    >
                      <Download className="w-5 h-5 mr-2" />
                      {loading ? 'Downloading...' : 'Download to View'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {displayType === AssetType.LINK && displayUrl && (
              <div className="bg-white rounded-lg p-12 max-w-2xl">
                <div className="text-center">
                  <ExternalLink className="w-24 h-24 text-blue-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    External Link
                  </h3>
                  <p className="text-gray-600 mb-6">
                    This asset is an external link.
                  </p>
                  <a
                    href={displayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Open Link
                  </a>
                </div>
              </div>
            )}

            {!displayUrl && (
              <div className="bg-white rounded-lg p-12 max-w-2xl">
                <div className="text-center">
                  <FileText className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    Preview Not Available
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Unable to load preview for this asset.
                  </p>
                  <Button onClick={handleDownload} disabled={loading}>
                    <Download className="w-5 h-5 mr-2" />
                    {loading ? 'Downloading...' : 'Download Asset'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Carousel Navigation - Next */}
          {isCarousel && carouselItems.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-10"
              aria-label="Next item"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>

        {/* Bottom Info Bar (for carousel) */}
        {isCarousel && carouselItems.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex justify-center space-x-2">
              {carouselItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setZoom(1);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-white w-8'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to item ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Platform Download Modal */}
      <PlatformDownloadModal
        isOpen={showPlatformModal}
        onClose={() => setShowPlatformModal(false)}
        onConfirm={performDownload}
        assetTitle={assetTitle}
      />
    </>
  );
}
