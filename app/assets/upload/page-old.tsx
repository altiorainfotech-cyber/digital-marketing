/**
 * Asset Upload Page
 * 
 * Allows users to upload assets in SEO or Doc mode
 * 
 * Requirements: 3.1-3.12, 4.1-4.7, 17.1-17.6
 * 
 * Key Features:
 * - SEO/Doc mode toggle
 * - Company selection (required for SEO)
 * - Asset type, title, description, tags, file upload
 * - Optional fields: target platforms, campaign name (SEO mode)
 * - Admin visibility selector (all 7 levels)
 * - Non-Admin automatic visibility (ADMIN_ONLY for SEO, UPLOADER_ONLY for Doc)
 * - Presigned URL upload flow
 * - "Save Draft" and "Submit for Review" buttons (SEO mode)
 * - "Save" button (Doc mode)
 * - Appropriate microcopy based on mode
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth';
import { useUser } from '@/lib/auth/hooks';
import { AssetType, UploadType, VisibilityLevel, UserRole } from '@/app/generated/prisma';

interface Company {
  id: string;
  name: string;
}

function AssetUploadContent() {
  const user = useUser();
  const router = useRouter();

  // Form state
  const [uploadType, setUploadType] = useState<UploadType>(UploadType.SEO);
  const [assetType, setAssetType] = useState<AssetType>(AssetType.IMAGE);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [targetPlatforms, setTargetPlatforms] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [visibility, setVisibility] = useState<VisibilityLevel | ''>('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // UI state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  // Load companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const response = await fetch('/api/companies');
        if (response.ok) {
          const data = await response.json();
          setCompanies(data.companies || []);
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  // Reset form when upload type changes
  useEffect(() => {
    setCompanyId('');
    setTargetPlatforms('');
    setCampaignName('');
    setVisibility('');
  }, [uploadType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const validateForm = (): string | null => {
    if (!title.trim()) {
      return 'Title is required';
    }

    if (assetType === AssetType.LINK && !url.trim()) {
      return 'URL is required for link assets';
    }

    if (assetType !== AssetType.LINK && !file) {
      return 'File is required';
    }

    if (uploadType === UploadType.SEO && !companyId) {
      return 'Company is required for SEO/Digital marketing uploads';
    }

    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
    if (tagArray.length > 20) {
      return 'Cannot have more than 20 tags';
    }

    if (description.length > 1000) {
      return 'Description cannot exceed 1000 characters';
    }

    return null;
  };

  const handleSubmit = async (submitForReview: boolean = false) => {
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
      const platformArray = targetPlatforms.split(',').map(p => p.trim()).filter(p => p);

      // For LINK type, create asset directly
      if (assetType === AssetType.LINK) {
        const response = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description: description || undefined,
            tags: tagArray.length > 0 ? tagArray : undefined,
            assetType,
            uploadType,
            companyId: companyId || undefined,
            url,
            targetPlatforms: platformArray.length > 0 ? platformArray : undefined,
            campaignName: campaignName || undefined,
            submitForReview: uploadType === UploadType.SEO ? submitForReview : undefined,
            visibility: isAdmin && visibility ? visibility : undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create asset');
        }

        const data = await response.json();
        router.push(`/assets/${data.id}`);
        return;
      }

      // Step 1: Get presigned URL
      const presignResponse = await fetch('/api/assets/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          tags: tagArray.length > 0 ? tagArray : undefined,
          assetType,
          uploadType,
          companyId: companyId || undefined,
          fileName: file!.name,
          contentType: file!.type,
          targetPlatforms: platformArray.length > 0 ? platformArray : undefined,
          campaignName: campaignName || undefined,
          visibility: isAdmin && visibility ? visibility : undefined,
        }),
      });

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { assetId, uploadUrl } = await presignResponse.json();

      // Step 2: Upload file to presigned URL
      if (uploadUrl) {
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file!.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }
      }

      // Step 3: Complete the upload
      const completeResponse = await fetch('/api/assets/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          metadata: {
            size: file!.size,
          },
          submitForReview: uploadType === UploadType.SEO ? submitForReview : undefined,
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Failed to complete upload');
      }

      // Redirect to asset detail page
      router.push(`/assets/${assetId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to upload asset');
    } finally {
      setLoading(false);
    }
  };

  const getMicrocopy = () => {
    if (uploadType === UploadType.SEO) {
      return 'You must select a Company. This upload will be visible to Admin for review. Admin will decide if/when this content is shared with SEO Specialists or the Company.';
    } else {
      return "This file will be private to you only. Admin and other users won't see it unless you explicitly share it.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Upload Asset</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/assets')}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Back to Assets
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()}>
            {/* Upload Type Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Mode
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setUploadType(UploadType.SEO)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                    uploadType === UploadType.SEO
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  SEO / Digital Marketing
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType(UploadType.DOC)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                    uploadType === UploadType.DOC
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Doc (Private)
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">{getMicrocopy()}</p>
            </div>

            {/* Asset Type */}
            <div className="mb-6">
              <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 mb-2">
                Asset Type
              </label>
              <select
                id="assetType"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={AssetType.IMAGE}>Image</option>
                <option value={AssetType.VIDEO}>Video</option>
                <option value={AssetType.DOCUMENT}>Document</option>
                <option value={AssetType.LINK}>Link</option>
              </select>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter asset title"
              />
            </div>

            {/* Company (SEO mode only) */}
            {uploadType === UploadType.SEO && (
              <div className="mb-6">
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company <span className="text-red-500">*</span>
                </label>
                {loadingCompanies ? (
                  <div className="text-sm text-gray-500">Loading companies...</div>
                ) : (
                  <select
                    id="company"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter asset description"
              />
              <p className="mt-1 text-xs text-gray-500">
                {description.length}/1000 characters
              </p>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (optional)
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter tags separated by commas (max 20)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate tags with commas. Maximum 20 tags.
              </p>
            </div>

            {/* Target Platforms (SEO mode only) */}
            {uploadType === UploadType.SEO && (
              <div className="mb-6">
                <label htmlFor="targetPlatforms" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Platforms (optional)
                </label>
                <input
                  type="text"
                  id="targetPlatforms"
                  value={targetPlatforms}
                  onChange={(e) => setTargetPlatforms(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., X, LinkedIn, Instagram"
                />
              </div>
            )}

            {/* Campaign Name (SEO mode only) */}
            {uploadType === UploadType.SEO && (
              <div className="mb-6">
                <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name (optional)
                </label>
                <input
                  type="text"
                  id="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter campaign name"
                />
              </div>
            )}

            {/* Visibility (Admin only, SEO mode) */}
            {isAdmin && uploadType === UploadType.SEO && (
              <div className="mb-6">
                <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility (optional)
                </label>
                <select
                  id="visibility"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as VisibilityLevel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Default (Admin Only)</option>
                  <option value={VisibilityLevel.UPLOADER_ONLY}>Uploader Only</option>
                  <option value={VisibilityLevel.ADMIN_ONLY}>Admin Only</option>
                  <option value={VisibilityLevel.COMPANY}>Company</option>
                  <option value={VisibilityLevel.TEAM}>Team</option>
                  <option value={VisibilityLevel.ROLE}>Role</option>
                  <option value={VisibilityLevel.SELECTED_USERS}>Selected Users</option>
                  <option value={VisibilityLevel.PUBLIC}>Public</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  As an Admin, you can choose who can see this asset. Leave blank for Admin Only.
                </p>
              </div>
            )}

            {/* URL (Link type only) */}
            {assetType === AssetType.LINK && (
              <div className="mb-6">
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>
            )}

            {/* File Upload (non-Link types) */}
            {assetType !== AssetType.LINK && (
              <div className="mb-6">
                <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                  File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  accept={
                    assetType === AssetType.IMAGE
                      ? 'image/*'
                      : assetType === AssetType.VIDEO
                      ? 'video/*'
                      : '*'
                  }
                />
                {file && (
                  <p className="mt-1 text-xs text-gray-500">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              {uploadType === UploadType.SEO ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit for Review'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  className="w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function AssetUploadPage() {
  return (
    <ProtectedRoute>
      <AssetUploadContent />
    </ProtectedRoute>
  );
}
