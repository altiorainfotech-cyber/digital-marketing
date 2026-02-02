/**
 * Asset List Page
 * 
 * Displays assets with search, filter, and sort capabilities
 * 
 * Requirements: 7.1-7.5, 15.1-15.6
 * 
 * Key Features:
 * - Asset grid/list view with thumbnails
 * - Search by title, description, tags
 * - Filter by status, type, company, upload type
 * - Sort by upload date, title, approval date, file size
 * - Role-based filtering (automatic)
 * - Pagination
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth';
import { useUser } from '@/lib/auth/hooks';
import { AssetType, UploadType, AssetStatus, UserRole } from '@/app/generated/prisma';

interface Asset {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  assetType: AssetType;
  uploadType: UploadType;
  status: AssetStatus;
  visibility: string;
  companyId?: string;
  uploaderId: string;
  storageUrl: string;
  fileSize?: number;
  uploadedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  uploader?: {
    name: string;
    email: string;
  };
  company?: {
    name: string;
  };
}

interface SearchFilters {
  query: string;
  assetType: string;
  status: string;
  uploadType: string;
  companyId: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

function AssetListContent() {
  const user = useUser();
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    assetType: '',
    status: '',
    uploadType: '',
    companyId: '',
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
  });

  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);

  // Load companies for filter
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/companies');
        if (response.ok) {
          const data = await response.json();
          setCompanies(data.companies || []);
        }
      } catch (err) {
        console.error('Failed to load companies:', err);
      }
    };

    if (user?.role === UserRole.ADMIN) {
      fetchCompanies();
    }
  }, [user]);

  // Load assets
  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      setError('');

      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        if (filters.query) params.append('query', filters.query);
        if (filters.assetType) params.append('assetType', filters.assetType);
        if (filters.status) params.append('status', filters.status);
        if (filters.uploadType) params.append('uploadType', filters.uploadType);
        if (filters.companyId) params.append('companyId', filters.companyId);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

        const response = await fetch(`/api/assets/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to load assets');
        }

        const data = await response.json();
        setAssets(data.assets || []);
        setTotal(data.total || 0);
      } catch (err: any) {
        setError(err.message || 'Failed to load assets');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [page, limit, filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const getStatusBadgeColor = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case AssetStatus.PENDING_REVIEW:
        return 'bg-yellow-100 text-yellow-800';
      case AssetStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case AssetStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssetTypeIcon = (assetType: AssetType) => {
    switch (assetType) {
      case AssetType.IMAGE:
        return '🖼️';
      case AssetType.VIDEO:
        return '🎥';
      case AssetType.DOCUMENT:
        return '📄';
      case AssetType.LINK:
        return '🔗';
      default:
        return '📁';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Assets</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/analytics')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                📊 Analytics
              </button>
              <button
                onClick={() => router.push('/assets/upload')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upload Asset
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                placeholder="Search by title, description, or tags..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Asset Type Filter */}
              <div>
                <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Type
                </label>
                <select
                  id="assetType"
                  value={filters.assetType}
                  onChange={(e) => handleFilterChange('assetType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value={AssetType.IMAGE}>Image</option>
                  <option value={AssetType.VIDEO}>Video</option>
                  <option value={AssetType.DOCUMENT}>Document</option>
                  <option value={AssetType.LINK}>Link</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value={AssetStatus.DRAFT}>Draft</option>
                  <option value={AssetStatus.PENDING_REVIEW}>Pending Review</option>
                  <option value={AssetStatus.APPROVED}>Approved</option>
                  <option value={AssetStatus.REJECTED}>Rejected</option>
                </select>
              </div>

              {/* Upload Type Filter */}
              <div>
                <label htmlFor="uploadType" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Type
                </label>
                <select
                  id="uploadType"
                  value={filters.uploadType}
                  onChange={(e) => handleFilterChange('uploadType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value={UploadType.SEO}>SEO</option>
                  <option value={UploadType.DOC}>Doc</option>
                </select>
              </div>

              {/* Company Filter (Admin only) */}
              {user?.role === UserRole.ADMIN && (
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <select
                    id="company"
                    value={filters.companyId}
                    onChange={(e) => handleFilterChange('companyId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Companies</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Sort and View Controls */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <div>
                  <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    id="sortBy"
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="uploadedAt">Upload Date</option>
                    <option value="title">Title</option>
                    <option value="approvedAt">Approval Date</option>
                    <option value="fileSize">File Size</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <select
                    id="sortOrder"
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading assets...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && assets.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No assets found</h2>
            <p className="text-gray-600 mb-6">
              {filters.query || filters.assetType || filters.status || filters.uploadType
                ? 'Try adjusting your search filters'
                : 'Get started by uploading your first asset'}
            </p>
            <button
              onClick={() => router.push('/assets/upload')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Upload Asset
            </button>
          </div>
        )}

        {/* Grid View */}
        {!loading && assets.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => router.push(`/assets/${asset.id}`)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{getAssetTypeIcon(asset.assetType)}</div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(
                        asset.status
                      )}`}
                    >
                      {asset.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                    {asset.title}
                  </h3>

                  {asset.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{asset.description}</p>
                  )}

                  {asset.tags && asset.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {asset.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {asset.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          +{asset.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Uploaded: {formatDate(asset.uploadedAt)}</div>
                    {asset.fileSize && <div>Size: {formatFileSize(asset.fileSize)}</div>}
                    {asset.company && <div>Company: {asset.company.name}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && assets.length > 0 && viewMode === 'list' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => router.push(`/assets/${asset.id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{getAssetTypeIcon(asset.assetType)}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{asset.title}</div>
                          {asset.description && (
                            <div className="text-sm text-gray-500 truncate max-w-md">
                              {asset.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {asset.assetType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(
                          asset.status
                        )}`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(asset.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(asset.uploadedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && assets.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}{' '}
              results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AssetListPage() {
  return (
    <ProtectedRoute>
      <AssetListContent />
    </ProtectedRoute>
  );
}
