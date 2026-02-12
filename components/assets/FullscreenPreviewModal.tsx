/**
 * FullscreenPreviewModal Component
 * 
 * Fullscreen modal for viewing assets (images, videos, PDFs, documents, carousels)
 * Accessible to all user roles (SEO, Admin, Creator)
 */

'use client';

import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/lib/design-system/components/primitives/Button';
import { AssetType } from '@/app/generated/prisma';

interface CarouselItem {
  id: string;
  storageUrl: string;
  publicUrl: string;
  itemType: AssetType;
  mimeType?: string | null;
  order: number;
}

export interface FullscreenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetType: AssetType;
  publicUrl: string;
  storageUrl: string;
  title: string;
  mimeType?: string;
  onDownload?: () => void;
  carouselItems?: CarouselItem[];
}

export function FullscreenPreviewModal({
  isOpen,
  onClose,
  assetType,
  publicUrl,
  storageUrl,
  title,
  mimeType,
  onDownload,
  carouselItems = [],
}: FullscreenPreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const goToPreviousSlide = () => {
    setCurrentCarouselIndex((prev) => 
      prev === 0 ? carouselItems.length - 1 : prev - 1
    );
  };

  const goToNextSlide = () => {
    setCurrentCarouselIndex((prev) => 
      prev === carouselItems.length - 1 ? 0 : prev + 1
    );
  };

  const renderContent = () => {
    switch (assetType) {
      case AssetType.CAROUSEL:
        if (!carouselItems || carouselItems.length === 0) {
          return (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-center text-white">
                <p className="text-xl">No carousel items available</p>
              </div>
            </div>
          );
        }

        const currentItem = carouselItems[currentCarouselIndex];
        
        return (
          <div className="relative w-full h-full flex items-center justify-center p-8">
            {/* Navigation Buttons */}
            {carouselItems.length > 1 && (
              <>
                <button
                  onClick={goToPreviousSlide}
                  className="absolute left-8 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-8 h-8 text-gray-800" />
                </button>
                <button
                  onClick={goToNextSlide}
                  className="absolute right-8 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-8 h-8 text-gray-800" />
                </button>
              </>
            )}

            {/* Current Item Display */}
            <div className="w-full h-full flex items-center justify-center">
              {currentItem.itemType === AssetType.IMAGE ? (
                currentItem.publicUrl ? (
                  <img
                    src={currentItem.publicUrl}
                    alt={`${title} - Slide ${currentCarouselIndex + 1}`}
                    style={{ 
                      maxWidth: `${zoom}%`, 
                      maxHeight: `${zoom}%`,
                      objectFit: 'contain'
                    }}
                    className="transition-all duration-200"
                  />
                ) : (
                  <div className="text-center text-white">
                    <p className="text-lg">Image preview not available</p>
                  </div>
                )
              ) : currentItem.itemType === AssetType.VIDEO ? (
                currentItem.publicUrl ? (
                  <video
                    key={currentItem.id}
                    src={currentItem.publicUrl}
                    controls
                    autoPlay
                    className="max-w-full max-h-full"
                    style={{ maxWidth: '85vw', maxHeight: '85vh' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-center text-white">
                    <p className="text-lg">Video preview not available</p>
                  </div>
                )
              ) : (
                <div className="text-center text-white">
                  <p className="text-lg">Unsupported carousel item type</p>
                </div>
              )}
            </div>

            {/* Slide Counter */}
            {carouselItems.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-base font-medium">
                {currentCarouselIndex + 1} / {carouselItems.length}
              </div>
            )}

            {/* Thumbnail Navigation */}
            {carouselItems.length > 1 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto pb-2 px-4">
                {carouselItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentCarouselIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentCarouselIndex
                        ? 'border-blue-400 ring-2 ring-blue-300'
                        : 'border-white/50 hover:border-white'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  >
                    {item.itemType === AssetType.IMAGE && item.publicUrl ? (
                      <img
                        src={item.publicUrl}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : item.itemType === AssetType.VIDEO && item.publicUrl ? (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                        <video
                          src={item.publicUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                        <span className="text-white text-xs">{index + 1}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case AssetType.IMAGE:
        return (
          <div className="flex items-center justify-center w-full h-full p-8">
            <img
              src={publicUrl}
              alt={title}
              style={{ 
                maxWidth: `${zoom}%`, 
                maxHeight: `${zoom}%`,
                objectFit: 'contain'
              }}
              className="transition-all duration-200"
            />
          </div>
        );

      case AssetType.VIDEO:
        return (
          <div className="flex items-center justify-center w-full h-full p-8">
            <video
              src={publicUrl}
              controls
              autoPlay
              className="max-w-full max-h-full"
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case AssetType.DOCUMENT:
        // Check if it's a PDF
        if (mimeType === 'application/pdf') {
          return (
            <div className="w-full h-full p-4">
              <iframe
                src={publicUrl}
                title={title}
                className="w-full h-full border-0 rounded"
              />
            </div>
          );
        }
        // For other documents, show download prompt
        return (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center text-white">
              <p className="text-xl mb-4">Document preview not available</p>
              <p className="text-sm mb-6">Click download to view this file</p>
              {onDownload && (
                <Button
                  variant="primary"
                  icon={<Download className="w-5 h-5" />}
                  onClick={onDownload}
                >
                  Download Document
                </Button>
              )}
            </div>
          </div>
        );

      case AssetType.LINK:
        return (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center text-white">
              <p className="text-xl mb-4">External Link</p>
              <a
                href={storageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Open Link →
              </a>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center text-white">
              <p className="text-xl">Preview not available for this asset type</p>
            </div>
          </div>
        );
    }
  };

  const showZoomControls = assetType === AssetType.IMAGE || 
    (assetType === AssetType.CAROUSEL && 
     carouselItems[currentCarouselIndex]?.itemType === AssetType.IMAGE);

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-95">
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-75 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-white text-lg font-semibold truncate max-w-2xl">
            {title}
          </h2>
          
          <div className="flex items-center gap-3">
            {showZoomControls && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ZoomOut className="w-5 h-5" />}
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  Zoom Out
                </Button>
                <span className="text-white text-sm font-medium min-w-[60px] text-center">
                  {zoom}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ZoomIn className="w-5 h-5" />}
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  Zoom In
                </Button>
                <div className="w-px h-6 bg-gray-600 mx-2" />
              </>
            )}
            
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Download className="w-5 h-5" />}
                onClick={onDownload}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                Download
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              icon={<X className="w-5 h-5" />}
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20"
              aria-label="Close fullscreen preview"
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full h-full pt-20">
        {renderContent()}
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />
    </div>
  );
}
