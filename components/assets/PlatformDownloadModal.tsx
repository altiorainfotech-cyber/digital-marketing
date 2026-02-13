/**
 * PlatformDownloadModal Component
 * 
 * Modal for SEO_SPECIALIST users to select platforms before downloading assets
 * Enforces platform selection requirement for download tracking
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/lib/design-system/components/primitives/Button';
import { Checkbox } from '@/lib/design-system/components/primitives/Checkbox';
import { X, Download } from 'lucide-react';
import { Platform } from '@/app/generated/prisma';

export interface PlatformDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (platforms: Platform[]) => void;
  assetTitle: string;
}

const PLATFORM_OPTIONS = [
  { value: Platform.ADS, label: 'Ads', description: 'Advertising campaigns' },
  { value: Platform.INSTAGRAM, label: 'Instagram', description: 'Instagram posts and stories' },
  { value: Platform.META, label: 'Meta', description: 'Facebook and Meta platforms' },
  { value: Platform.LINKEDIN, label: 'LinkedIn', description: 'LinkedIn posts and articles' },
  { value: Platform.X, label: 'X (Twitter)', description: 'X/Twitter posts' },
  { value: Platform.SEO, label: 'SEO', description: 'Search engine optimization' },
  { value: Platform.BLOGS, label: 'Blogs', description: 'Blog posts and articles' },
  { value: Platform.YOUTUBE, label: 'YouTube', description: 'YouTube videos' },
  { value: Platform.SNAPCHAT, label: 'Snapchat', description: 'Snapchat content' },
];

export function PlatformDownloadModal({
  isOpen,
  onClose,
  onConfirm,
  assetTitle,
}: PlatformDownloadModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);

  if (!isOpen) return null;

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleConfirm = () => {
    if (selectedPlatforms.length === 0) {
      return; // Don't allow download without platform selection
    }
    onConfirm(selectedPlatforms);
    setSelectedPlatforms([]); // Reset for next time
  };

  const handleClose = () => {
    setSelectedPlatforms([]); // Reset on close
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal - Mobile optimized */}
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="platform-modal-title"
      >
        {/* Header - Mobile optimized */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <h2
              id="platform-modal-title"
              className="text-lg sm:text-xl font-semibold text-gray-900"
            >
              Select Platforms
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
              Choose where you'll use: <span className="font-medium">{assetTitle}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content - Mobile optimized scrolling */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-xs sm:text-sm text-gray-700 mb-3">
              Select one or more platforms. Your download will start automatically.
            </p>
            {selectedPlatforms.length === 0 && (
              <p className="text-xs sm:text-sm text-red-600 font-medium flex items-start gap-2">
                <span className="flex-shrink-0">⚠️</span>
                <span>Select at least one platform to download</span>
              </p>
            )}
          </div>

          {/* Platform Grid - Mobile optimized with larger touch targets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {PLATFORM_OPTIONS.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.value);
              return (
                <label
                  key={platform.value}
                  className={`
                    flex items-start p-3.5 sm:p-4 border-2 rounded-lg cursor-pointer transition-all
                    active:scale-[0.98] touch-manipulation
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white active:bg-gray-50'
                    }
                  `}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handlePlatformToggle(platform.value)}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">
                      {platform.label}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                      {platform.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Selected Count - Mobile optimized */}
          {selectedPlatforms.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>{selectedPlatforms.length}</strong> platform{selectedPlatforms.length !== 1 ? 's' : ''} selected:{' '}
                <span className="block sm:inline mt-1 sm:mt-0">
                  {selectedPlatforms
                    .map((p) => PLATFORM_OPTIONS.find((opt) => opt.value === p)?.label)
                    .join(', ')}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Footer - Mobile optimized with stacked buttons on small screens */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleConfirm}
            disabled={selectedPlatforms.length === 0}
            className="w-full sm:w-auto"
          >
            Download Now
          </Button>
        </div>
      </div>
    </div>
  );
}
