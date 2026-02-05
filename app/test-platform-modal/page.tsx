'use client';

import { useState } from 'react';
import { PlatformSelectionModal } from '@/components/assets';
import { Platform } from '@/types';

/**
 * Test Page for Platform Selection Modal
 * 
 * Visit: http://localhost:3000/test-platform-modal
 * 
 * This page allows you to test the platform selection modal
 * without integrating it into your asset pages first.
 */
export default function TestPlatformModal() {
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [lastSelection, setLastSelection] = useState<Platform[]>([]);

  const handleConfirm = (platforms: Platform[]) => {
    console.log('Selected platforms:', platforms);
    setSelectedPlatforms(platforms);
    setLastSelection(platforms);
    setShowModal(false);
  };

  const handleReset = () => {
    setSelectedPlatforms([]);
    setLastSelection([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Platform Selection Modal Test
          </h1>
          <p className="text-gray-600">
            Test the platform selection modal before integrating it into your asset pages
          </p>
        </div>

        {/* Test Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Test the Modal
          </h2>
          <p className="text-gray-600 mb-6">
            Click the button below to open the platform selection modal.
            Select one or more platforms and click "Download" to see the result.
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Open Platform Selection Modal
            </button>

            {lastSelection.length > 0 && (
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Results Card */}
        {lastSelection.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">
              ✅ Success! Platforms Selected
            </h3>
            <div className="space-y-2">
              <p className="text-green-800">
                <span className="font-medium">Selected Platforms:</span>{' '}
                {lastSelection.join(', ')}
              </p>
              <p className="text-green-800">
                <span className="font-medium">Count:</span> {lastSelection.length}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {lastSelection.map((platform) => (
                <span
                  key={platform}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📋 Testing Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Click "Open Platform Selection Modal" button</li>
            <li>Select one or more platforms from the grid</li>
            <li>Verify the selected count updates</li>
            <li>Try clicking "Download" without selecting (should show error)</li>
            <li>Select platforms and click "Download"</li>
            <li>Verify the success message appears with your selections</li>
            <li>Click "Reset" to clear and test again</li>
          </ol>
        </div>

        {/* Features Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            ✨ Modal Features
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Multi-select functionality (select multiple platforms)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Visual feedback (checkmark on selected platforms)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Validation (requires at least one platform)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Selected count display</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Responsive grid layout</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Platform icons and labels</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Cancel and confirm actions</span>
            </li>
          </ul>
        </div>

        {/* Next Steps Card */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">
            🚀 Next Steps
          </h3>
          <p className="text-purple-800 mb-3">
            Once you've verified the modal works correctly:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-purple-800">
            <li>Integrate the modal into your asset detail page</li>
            <li>Update the download handler to use platforms</li>
            <li>Test the complete download flow</li>
            <li>Check the download history page</li>
            <li>Verify audit logs show platform information</li>
          </ol>
          <p className="text-purple-800 mt-3">
            See <code className="bg-purple-100 px-2 py-1 rounded">PLATFORM_MODAL_INTEGRATION_EXAMPLE.md</code> for integration instructions.
          </p>
        </div>
      </div>

      {/* Platform Selection Modal */}
      <PlatformSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        assetTitle="Test Asset - Marketing Banner"
      />
    </div>
  );
}
