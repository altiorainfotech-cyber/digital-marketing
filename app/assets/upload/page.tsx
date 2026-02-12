/**
 * Asset Upload Page - Redesigned
 * 
 * Modern upload interface with drag-and-drop, file previews, and progress tracking
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth';
import { useUser } from '@/lib/auth/hooks';
import { Button } from '@/lib/design-system/components/primitives/Button';
import { Input } from '@/lib/design-system/components/primitives/Input';
import { Select } from '@/lib/design-system/components/primitives/Select';
import { Badge } from '@/lib/design-system/components/primitives/Badge';
import { 
  Upload, 
  X, 
  FileImage, 
  FileVideo, 
  FileText, 
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { AssetType, UploadType, VisibilityLevel, UserRole } from '@/app/generated/prisma';

interface Company {
  id: string;
  name: string;
}

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

function AssetUploadContent() {
  const user = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [files, setFiles] = useState<FilePreview[]>([]);

  // UI state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  // Load companies
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

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const filePreviews: FilePreview[] = newFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    setFiles(prev => [...prev, ...filePreviews]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const validateForm = (): string | null => {
    // Company is only required for SEO uploads
    if (uploadType === UploadType.SEO && !companyId) {
      return 'Company is required for SEO/Digital Marketing uploads';
    }

    if (assetType === AssetType.LINK && !url.trim()) {
      return 'URL is required for link assets';
    }

    if (assetType === AssetType.CAROUSEL && files.length < 2) {
      return 'At least 2 files are required for carousel assets';
    }

    if (assetType !== AssetType.LINK && assetType !== AssetType.CAROUSEL && files.length === 0) {
      return 'At least one file is required';
    }

    if (assetType === AssetType.CAROUSEL) {
      // Validate that carousel only contains images and videos
      const invalidFiles = files.filter(f => 
        !f.file.type.startsWith('image/') && !f.file.type.startsWith('video/')
      );
      if (invalidFiles.length > 0) {
        return 'Carousel can only contain images and videos';
      }
    }

    return null;
  };

  const uploadFile = async (filePreview: FilePreview, submitForReview: boolean) => {
    const { file } = filePreview;

    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === filePreview.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      // Step 1: Get presigned URL
      const presignResponse = await fetch('/api/assets/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || file.name, // Use filename if title is empty
          assetType,
          uploadType,
          companyId: uploadType === UploadType.SEO ? companyId : undefined, // Only send companyId for SEO uploads
          fileName: file.name,
          contentType: file.type,
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
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setFiles(prev => prev.map(f => 
              f.id === filePreview.id ? { ...f, progress } : f
            ));
          }
        });

        await new Promise((resolve, reject) => {
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response);
            } else {
              reject(new Error('Upload failed'));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Upload failed')));
          xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

          xhr.open('PUT', uploadUrl);
          // Don't set Content-Type header - it's already in the presigned URL signature
          // Setting it manually triggers CORS preflight which requires additional R2 configuration
          xhr.send(file);
        });
      }

      // Step 3: Complete the upload
      const completeResponse = await fetch('/api/assets/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          metadata: {
            size: file.size,
          },
          submitForReview: uploadType === UploadType.SEO ? submitForReview : undefined,
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Failed to complete upload');
      }

      // Update status to success
      setFiles(prev => prev.map(f => 
        f.id === filePreview.id ? { ...f, status: 'success', progress: 100 } : f
      ));

      return assetId;
    } catch (err: any) {
      // Update status to error
      setFiles(prev => prev.map(f => 
        f.id === filePreview.id ? { ...f, status: 'error', error: err.message } : f
      ));
      throw err;
    }
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
      // For LINK type, create asset directly
      if (assetType === AssetType.LINK) {
        const response = await fetch('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || 'Untitled Link',
            assetType,
            uploadType,
            companyId: uploadType === UploadType.SEO ? companyId : undefined,
            url,
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

      // For CAROUSEL type, upload all files as carousel items
      if (assetType === AssetType.CAROUSEL) {
        const response = await fetch('/api/assets/carousel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || 'Untitled Carousel',
            description,
            tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            uploadType,
            companyId: uploadType === UploadType.SEO ? companyId : undefined,
            targetPlatforms: targetPlatforms ? targetPlatforms.split(',').map(p => p.trim()).filter(Boolean) : [],
            campaignName,
            visibility: isAdmin && visibility ? visibility : undefined,
            submitForReview: uploadType === UploadType.SEO ? submitForReview : undefined,
            fileCount: files.length,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create carousel');
        }

        const { carouselId } = await response.json();

        // Upload all files and collect their storage URLs
        const uploadedItems: any[] = [];
        
        for (let i = 0; i < files.length; i++) {
          const filePreview = files[i];
          const { file } = filePreview;

          setFiles(prev => prev.map(f => 
            f.id === filePreview.id ? { ...f, status: 'uploading', progress: 0 } : f
          ));

          try {
            // Get presigned URL for carousel item (doesn't create Asset record)
            const presignResponse = await fetch('/api/assets/carousel/presign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                carouselId,
                fileName: file.name,
                contentType: file.type,
              }),
            });

            if (!presignResponse.ok) {
              throw new Error(`Failed to get upload URL for file ${i + 1}`);
            }

            const { uploadUrl, storageUrl } = await presignResponse.json();

            // Upload file to presigned URL
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                setFiles(prev => prev.map(f => 
                  f.id === filePreview.id ? { ...f, progress } : f
                ));
              }
            });

            await new Promise((resolve, reject) => {
              xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  setFiles(prev => prev.map(f => 
                    f.id === filePreview.id ? { ...f, status: 'success', progress: 100 } : f
                  ));
                  
                  uploadedItems.push({
                    storageUrl,
                    fileSize: file.size,
                    mimeType: file.type,
                  });
                  
                  resolve(xhr.response);
                } else {
                  reject(new Error(`Upload failed with status ${xhr.status}`));
                }
              });

              xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
              });

              xhr.open('PUT', uploadUrl);
              xhr.setRequestHeader('Content-Type', file.type);
              xhr.send(file);
            });
          } catch (err: any) {
            setFiles(prev => prev.map(f => 
              f.id === filePreview.id ? { ...f, status: 'error', error: err.message } : f
            ));
            throw err;
          }
        }

        // Finalize carousel with all uploaded items
        const finalizeResponse = await fetch('/api/assets/carousel/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carouselId,
            items: uploadedItems,
          }),
        });

        if (!finalizeResponse.ok) {
          const errorData = await finalizeResponse.json();
          throw new Error(errorData.error || 'Failed to finalize carousel');
        }

        router.push(`/assets/${carouselId}`);
        return;
      }

      // Upload all files individually
      const uploadPromises = files.map(file => uploadFile(file, submitForReview));
      const assetIds = await Promise.all(uploadPromises);

      // Redirect to first asset or assets list
      if (assetIds.length === 1) {
        router.push(`/assets/${assetIds[0]}`);
      } else {
        router.push('/assets');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload assets');
    } finally {
      setLoading(false);
    }
  };

  const getMicrocopy = () => {
    if (uploadType === UploadType.SEO) {
      return 'This upload will be visible to Admin for review. Admin will decide if/when this content is shared with SEO Specialists or the Company.';
    } else {
      return "This file will be private to you only. Admin and other users won't see it unless you explicitly share it.";
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <FileImage className="w-8 h-8" />;
    if (file.type.startsWith('video/')) return <FileVideo className="w-8 h-8" />;
    return <FileText className="w-8 h-8" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                icon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => router.push('/assets')}
              >
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Upload Asset</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()}>
            {/* Upload Type Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Upload Mode
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUploadType(UploadType.SEO)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    uploadType === UploadType.SEO
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 mb-1">
                      SEO / Digital Marketing
                    </div>
                    <div className="text-sm text-gray-600">
                      For company marketing content
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType(UploadType.DOC)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    uploadType === UploadType.DOC
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 mb-1">
                      Doc (Private)
                    </div>
                    <div className="text-sm text-gray-600">
                      For personal documents
                    </div>
                  </div>
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                {getMicrocopy()}
              </p>
            </div>

            {/* Asset Type */}
            <div className="mb-6">
              <Select
                label="Asset Type"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                options={[
                  { value: AssetType.IMAGE, label: 'Image' },
                  { value: AssetType.VIDEO, label: 'Video' },
                  { value: AssetType.DOCUMENT, label: 'Document' },
                  { value: AssetType.LINK, label: 'Link' },
                  { value: AssetType.CAROUSEL, label: 'Carousel (Multiple Images/Videos)' },
                ]}
                fullWidth
                required
              />
              {assetType === AssetType.CAROUSEL && (
                <p className="mt-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  Upload multiple images and videos that will be grouped together as a carousel
                </p>
              )}
            </div>

            {/* Company - Required for SEO uploads only */}
            {uploadType === UploadType.SEO && (
              <div className="mb-6">
                {loadingCompanies ? (
                  <div className="text-sm text-gray-500">Loading companies...</div>
                ) : (
                  <Select
                    label="Company"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    options={[
                      { value: '', label: 'Select a company' },
                      ...companies.map(c => ({ value: c.id, label: c.name })),
                    ]}
                    fullWidth
                    required
                  />
                )}
              </div>
            )}

            {/* Title - Optional */}
            <div className="mb-6">
              <Input
                label="Title (optional)"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter asset title"
                fullWidth
              />
            </div>

            {/* Visibility (Admin only, SEO mode) */}
            {isAdmin && uploadType === UploadType.SEO && (
              <div className="mb-6">
                <Select
                  label="Visibility (optional)"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as VisibilityLevel)}
                  options={[
                    { value: '', label: 'Default (Admin Only)' },
                    { value: VisibilityLevel.UPLOADER_ONLY, label: 'Uploader Only' },
                    { value: VisibilityLevel.ADMIN_ONLY, label: 'Admin Only' },
                    { value: VisibilityLevel.COMPANY, label: 'Company' },
                    { value: VisibilityLevel.TEAM, label: 'Team' },
                    { value: VisibilityLevel.ROLE, label: 'Role' },
                    { value: VisibilityLevel.SELECTED_USERS, label: 'Selected Users' },
                    { value: VisibilityLevel.PUBLIC, label: 'Public' },
                  ]}
                  helperText="As an Admin, you can choose who can see this asset. Leave blank for Admin Only."
                  fullWidth
                />
              </div>
            )}

            {/* URL (Link type only) */}
            {assetType === AssetType.LINK && (
              <div className="mb-6">
                <Input
                  label="URL"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  icon={<LinkIcon className="w-5 h-5" />}
                  fullWidth
                  required
                />
              </div>
            )}

            {/* File Upload (non-Link types) */}
            {assetType !== AssetType.LINK && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Files <span className="text-red-500">*</span>
                </label>

                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    transition-all duration-200
                    ${dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  <p className="text-base font-medium text-gray-900 mb-1">
                    {dragActive ? 'Drop files here' : 'Drag and drop files here'}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    {assetType === AssetType.IMAGE && 'Supported: JPG, PNG, GIF, WebP'}
                    {assetType === AssetType.VIDEO && 'Supported: MP4, MOV, AVI, WebM'}
                    {assetType === AssetType.DOCUMENT && 'Supported: PDF, DOC, DOCX, TXT'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileInput}
                    className="hidden"
                    accept={
                      assetType === AssetType.IMAGE
                        ? 'image/*'
                        : assetType === AssetType.VIDEO
                        ? 'video/*'
                        : '*'
                    }
                    multiple
                  />
                </div>

                {/* File Previews */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {files.map((filePreview) => (
                      <div
                        key={filePreview.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        {/* Preview/Icon */}
                        <div className="flex-shrink-0">
                          {filePreview.preview ? (
                            <img
                              src={filePreview.preview}
                              alt={filePreview.file.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded text-gray-600">
                              {getFileIcon(filePreview.file)}
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {filePreview.file.name}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeFile(filePreview.id)}
                              className="text-gray-400 hover:text-gray-600"
                              disabled={filePreview.status === 'uploading'}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>

                          {/* Progress Bar */}
                          {filePreview.status === 'uploading' && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${filePreview.progress}%` }}
                              />
                            </div>
                          )}

                          {/* Status */}
                          {filePreview.status === 'success' && (
                            <div className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              <span>Uploaded successfully</span>
                            </div>
                          )}

                          {filePreview.status === 'error' && (
                            <div className="flex items-center gap-1 text-red-600 text-sm">
                              <AlertCircle className="w-4 h-4" />
                              <span>{filePreview.error || 'Upload failed'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              {uploadType === UploadType.SEO ? (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
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
