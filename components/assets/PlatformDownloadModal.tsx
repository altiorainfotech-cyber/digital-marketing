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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="platform-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2
              id="platform-modal-title"
              className="text-xl font-semibold text-gray-900"
            >
              Select Platforms for Download
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose where you plan to use: <span className="font-medium">{assetTitle}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-4">
              Select one or more platforms where you intend to use this asset. This helps us track asset usage and optimize content for different channels.
            </p>
            {selectedPlatforms.length === 0 && (
              <p className="text-sm text-red-600 font-medium">
                ⚠️ You must select at least one platform to download this asset.
              </p>
            )}
          </div>

          {/* Platform Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PLATFORM_OPTIONS.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.value);
              return (
                <label
                  key={platform.value}
                  className={`
                    flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handlePlatformToggle(platform.value)}
                    className="mt-0.5"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-gray-900">
                      {platform.label}
                    </div>
                    <div className="text-sm text-gray-600">
                      {platform.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Selected Count */}
          {selectedPlatforms.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedPlatforms.length}</strong> platform{selectedPlatforms.length !== 1 ? 's' : ''} selected:{' '}
                {selectedPlatforms
                  .map((p) => PLATFORM_OPTIONS.find((opt) => opt.value === p)?.label)
                  .join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleConfirm}
            disabled={selectedPlatforms.length === 0}
          >
            Download Asset
          </Button>
        </div>
      </div>
    </div>
  );
}
