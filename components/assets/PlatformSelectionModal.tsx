'use client';

import { useState } from 'react';
import { Platform } from '@/types';

interface PlatformSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (platforms: Platform[]) => void;
  assetTitle: string;
}

const PLATFORM_OPTIONS = [
  { value: Platform.ADS, label: 'Ads', icon: '📢' },
  { value: Platform.INSTAGRAM, label: 'Instagram', icon: '📷' },
  { value: Platform.META, label: 'Meta', icon: '👥' },
  { value: Platform.LINKEDIN, label: 'LinkedIn', icon: '💼' },
  { value: Platform.X, label: 'X (Twitter)', icon: '🐦' },
  { value: Platform.SEO, label: 'SEO', icon: '🔍' },
  { value: Platform.BLOGS, label: 'Blogs', icon: '📝' },
  { value: Platform.YOUTUBE, label: 'YouTube', icon: '📺' },
  { value: Platform.SNAPCHAT, label: 'Snapchat', icon: '👻' },
];

export function PlatformSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  assetTitle,
}: PlatformSelectionModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const togglePlatform = (platform: Platform) => {
    setError('');
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleConfirm = () => {
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }
    onConfirm(selectedPlatforms);
    setSelectedPlatforms([]);
    setError('');
  };

  const handleClose = () => {
    setSelectedPlatforms([]);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Select Platform(s) for Download
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Which platform(s) will you use <span className="font-medium">{assetTitle}</span> on?
          </p>
        </div>

        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PLATFORM_OPTIONS.map((platform) => (
              <button
                key={platform.value}
                onClick={() => togglePlatform(platform.value)}
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                  ${
                    selectedPlatforms.includes(platform.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="text-2xl">{platform.icon}</span>
                <span className="font-medium">{platform.label}</span>
                {selectedPlatforms.includes(platform.value) && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </button>
            ))}
          </div>

          {selectedPlatforms.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Selected:</span>{' '}
                {selectedPlatforms
                  .map((p) => PLATFORM_OPTIONS.find((opt) => opt.value === p)?.label)
                  .join(', ')}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedPlatforms.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download ({selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''})
          </button>
        </div>
      </div>
    </div>
  );
}
