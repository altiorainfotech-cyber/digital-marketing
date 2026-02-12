/**
 * Asset List Page - Redesigned
 * 
 * Modern asset management interface with search, filters, and view toggle
 * 
 * Requirements: 6.7, 6.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth';
import { useUser } from '@/lib/auth/hooks';
import { AssetCard, AssetCardData, CalendarFilter } from '@/components/assets';
import { Button } from '@/lib/design-system/components/primitives/Button';
import { Input } from '@/lib/design-system/components/primitives/Input';
import { Select } from '@/lib/design-system/components/primitives/Select';
import { Badge } from '@/lib/design-system/components/primitives/Badge';
import { EmptyState } from '@/lib/design-system/components/patterns/EmptyState';
import { LoadingState, SkeletonCard } from '@/lib/design-system/components/patterns/LoadingState';
import { Pagination } from '@/lib/design-system/components/composite/Pagination';
import { 
  Search, 
  X, 
  Grid3x3, 
  List, 
  Upload, 
  BarChart3,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Home
} from 'lucide-react';
import { AssetType, UploadType, AssetStatus, UserRole } from '@/app/generated/prisma';

interface SearchFilters {
  query: string;
  assetType: string;
  status: string;
  uploadType: string;
  companyId: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  date: string;
}

interface Company {
  id: string;
  name: string;
}

function AssetListContent() {
  const user = useUser();
  const router = useRouter();

  // State
  const [assets, setAssets] = useState<AssetCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [limit] = useState(20);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'company'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    assetType: '',
    status: '',
    uploadType: '',
    companyId: '',
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
    date: '',
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN;

  // Debounced search - reset page and assets on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, query: searchInput }));
      setPage(1);
      setAssets([]); // Clear assets on new search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load companies
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

    if (isAdmin) {
      fetchCompanies();
    }
  }, [isAdmin]);

  // Load assets with infinite scroll support
  useEffect(() => {
    const fetchAssets = async () => {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError('');

      try {
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
        if (filters.date) params.append('date', filters.date);

        const response = await fetch(`/api/assets/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to load assets');
        }

        const data = await response.json();
        
        if (page === 1) {
          setAssets(data.assets || []);
        } else {
          setAssets(prev => [...prev, ...(data.assets || [])]);
        }
        
        setTotal(data.total || 0);
        setHasMore((data.assets || []).length === limit);
      } catch (err: any) {
        setError(err.message || 'Failed to load assets');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchAssets();
  }, [page, limit, filters]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore || loading) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // Load more when user is 300px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        setPage(prev => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, loading]);

  // Filter handlers
  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
    setAssets([]); // Clear assets on filter change
  };

  const clearFilter = (key: keyof SearchFilters) => {
    if (key === 'query') {
      setSearchInput('');
    }
    if (key === 'date') {
      setSelectedDate(null);
    }
    handleFilterChange(key, '');
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSelectedDate(null);
    setFilters({
      query: '',
      assetType: '',
      status: '',
      uploadType: '',
      companyId: '',
      sortBy: 'uploadedAt',
      sortOrder: 'desc',
      date: '',
    });
    setPage(1);
    setAssets([]); // Clear assets on filter clear
  };

  // Selection handlers
  const handleSelectAsset = (id: string, selected: boolean) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedAssets(new Set(assets.map(a => a.id)));
    } else {
      setSelectedAssets(new Set());
    }
  };

  // Delete handler - CONTENT_CREATOR can delete DRAFT and PENDING assets
  const handleDeleteSelected = async () => {
    if (selectedAssets.size === 0) return;

    const assetsToDelete = assets.filter(a => selectedAssets.has(a.id));
    
    // For CONTENT_CREATOR, only allow deleting DRAFT and PENDING_REVIEW assets
    if (user?.role === UserRole.CONTENT_CREATOR) {
      const nonDeletableAssets = assetsToDelete.filter(
        a => a.status !== AssetStatus.DRAFT && a.status !== AssetStatus.PENDING_REVIEW
      );
      if (nonDeletableAssets.length > 0) {
        setError('Content creators can only delete draft and pending assets');
        return;
      }
    }

    if (!confirm(`Are you sure you want to delete ${selectedAssets.size} asset(s)?`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedAssets).map(async (assetId) => {
        const response = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error(`Failed to delete asset ${assetId}:`, errorData);
          throw new Error(errorData.error || errorData.details || `Failed to delete asset ${assetId}`);
        }
        return response;
      });

      const results = await Promise.allSettled(deletePromises);
      const failedDeletes = results.filter(r => r.status === 'rejected');

      if (failedDeletes.length > 0) {
        const firstError = (failedDeletes[0] as PromiseRejectedResult).reason;
        throw new Error(`Failed to delete ${failedDeletes.length} asset(s): ${firstError.message}`);
      }

      // Remove deleted assets from state
      setAssets(prev => prev.filter(a => !selectedAssets.has(a.id)));
      setSelectedAssets(new Set());
      setTotal(prev => prev - selectedAssets.size);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete assets');
    }
  };

  // Quick action handler
  const handleQuickAction = async (action: string, assetId: string) => {
    if (action === 'download') {
      try {
        const response = await fetch(`/api/assets/${assetId}/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to generate download URL' }));
          throw new Error(errorData.error || errorData.details || 'Failed to generate download URL');
        }

        const data = await response.json();
        
        if (!data.downloadUrl) {
          throw new Error('No download URL received from server');
        }
        
        window.open(data.downloadUrl, '_blank');
      } catch (err: any) {
        console.error('Download error:', err);
        alert(err.message || 'Failed to download asset');
      }
    }
  };

  // Date filter handler
  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      // Format date as YYYY-MM-DD for API
      const dateStr = date.toISOString().split('T')[0];
      handleFilterChange('date', dateStr);
    } else {
      handleFilterChange('date', '');
    }
  };

  // Active filters count
  const activeFiltersCount = [
    filters.query,
    filters.assetType,
    filters.status,
    filters.uploadType,
    filters.companyId,
    filters.date,
  ].filter(Boolean).length;

  return (
    <div className="assets-page min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                icon={<Upload className="w-4 h-4" />}
                onClick={() => router.push('/assets/upload')}
              >
                Upload Asset
              </Button>
              <Button
                variant="outline"
                icon={<Home className="w-4 h-4" />}
                onClick={() => router.push('/admin')}
              >
                Admin Panel
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Search Bar */}
          <div className="mb-4 flex gap-3">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search by title, description, or tags..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                icon={<Search className="w-5 h-5" />}
                iconPosition="left"
                fullWidth
              />
            </div>
            <CalendarFilter
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="primary" size="sm">
                  {activeFiltersCount}
                </Badge>
              )}
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-label="List view"
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('company')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'company'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  aria-label="Company folder view"
                  title="Company folder view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Asset Type */}
                <Select
                  label="Asset Type"
                  value={filters.assetType}
                  onChange={(e) => handleFilterChange('assetType', e.target.value)}
                  options={[
                    { value: '', label: 'All Types' },
                    { value: AssetType.IMAGE, label: 'Image' },
                    { value: AssetType.VIDEO, label: 'Video' },
                    { value: AssetType.DOCUMENT, label: 'Document' },
                    { value: AssetType.LINK, label: 'Link' },
                    { value: AssetType.CAROUSEL, label: 'Carousel' },
                  ]}
                  fullWidth
                />

                {/* Status */}
                <Select
                  label="Status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: AssetStatus.DRAFT, label: 'Draft' },
                    { value: AssetStatus.PENDING_REVIEW, label: 'Pending Review' },
                    { value: AssetStatus.APPROVED, label: 'Approved' },
                    { value: AssetStatus.REJECTED, label: 'Rejected' },
                  ]}
                  fullWidth
                />

                {/* Upload Type */}
                <Select
                  label="Upload Type"
                  value={filters.uploadType}
                  onChange={(e) => handleFilterChange('uploadType', e.target.value)}
                  options={[
                    { value: '', label: 'All Types' },
                    { value: UploadType.SEO, label: 'SEO' },
                    { value: UploadType.DOC, label: 'Doc' },
                  ]}
                  fullWidth
                />

                {/* Company (Admin only) */}
                {isAdmin && (
                  <Select
                    label="Company"
                    value={filters.companyId}
                    onChange={(e) => handleFilterChange('companyId', e.target.value)}
                    options={[
                      { value: '', label: 'All Companies' },
                      ...companies.map(c => ({ value: c.id, label: c.name })),
                    ]}
                    fullWidth
                  />
                )}
              </div>

              {/* Sort Controls */}
              <div className="flex items-end gap-4">
                <Select
                  label="Sort By"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  options={[
                    { value: 'uploadedAt', label: 'Upload Date' },
                    { value: 'title', label: 'Title' },
                    { value: 'approvedAt', label: 'Approval Date' },
                    { value: 'fileSize', label: 'File Size' },
                  ]}
                />

                <Select
                  label="Order"
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                  options={[
                    { value: 'desc', label: 'Descending' },
                    { value: 'asc', label: 'Ascending' },
                  ]}
                />

                {activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={clearAllFilters}
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Active Filter Badges */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              {filters.query && (
                <Badge variant="primary" className="flex items-center gap-1">
                  Search: {filters.query}
                  <button
                    onClick={() => clearFilter('query')}
                    className="ml-1 hover:text-blue-900"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.assetType && (
                <Badge variant="primary" className="flex items-center gap-1">
                  Type: {filters.assetType}
                  <button
                    onClick={() => clearFilter('assetType')}
                    className="ml-1 hover:text-blue-900"
                    aria-label="Clear asset type filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.status && (
                <Badge variant="primary" className="flex items-center gap-1">
                  Status: {filters.status.replace('_', ' ')}
                  <button
                    onClick={() => clearFilter('status')}
                    className="ml-1 hover:text-blue-900"
                    aria-label="Clear status filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.uploadType && (
                <Badge variant="primary" className="flex items-center gap-1">
                  Upload: {filters.uploadType}
                  <button
                    onClick={() => clearFilter('uploadType')}
                    className="ml-1 hover:text-blue-900"
                    aria-label="Clear upload type filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.companyId && (
                <Badge variant="primary" className="flex items-center gap-1">
                  Company: {companies.find(c => c.id === filters.companyId)?.name}
                  <button
                    onClick={() => clearFilter('companyId')}
                    className="ml-1 hover:text-blue-900"
                    aria-label="Clear company filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.date && (
                <Badge variant="primary" className="flex items-center gap-1">
                  Date: {selectedDate?.toLocaleDateString()}
                  <button
                    onClick={() => clearFilter('date')}
                    className="ml-1 hover:text-blue-900"
                    aria-label="Clear date filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-900 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Selection Mode Indicator */}
        {!loading && assets.length > 0 && selectedAssets.size === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-600">
              💡 Click on any asset card to select it. Select multiple assets to perform bulk actions.
            </p>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedAssets.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedAssets.size} asset{selectedAssets.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedAssets(new Set())}
                className="text-sm text-blue-700 hover:text-blue-900 underline"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteSelected}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && assets.length === 0 && (
          <EmptyState
            icon={<Upload className="w-16 h-16" />}
            title="No assets found"
            message={
              activeFiltersCount > 0
                ? 'Try adjusting your search filters to find what you\'re looking for.'
                : 'Get started by uploading your first asset to the system.'
            }
            action={{
              label: 'Upload Asset',
              onClick: () => router.push('/assets/upload'),
              variant: 'primary',
            }}
          />
        )}

        {/* Grid View */}
        {!loading && assets.length > 0 && viewMode === 'grid' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  view="grid"
                  selected={selectedAssets.has(asset.id)}
                  onSelect={handleSelectAsset}
                  onQuickAction={handleQuickAction}
                  showCheckbox={true}
                />
              ))}
            </div>
            {loadingMore && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}
          </>
        )}

        {/* List View */}
        {!loading && assets.length > 0 && viewMode === 'list' && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      view="list"
                      selected={selectedAssets.has(asset.id)}
                      onSelect={handleSelectAsset}
                      onQuickAction={handleQuickAction}
                      showCheckbox={true}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {loadingMore && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Company Folder View */}
        {!loading && assets.length > 0 && viewMode === 'company' && (() => {
          // Group assets by company
          const assetsByCompany = assets.reduce((acc, asset) => {
            const companyName = asset.company?.name || asset.Company?.name || 'No Company';
            if (!acc[companyName]) {
              acc[companyName] = [];
            }
            acc[companyName].push(asset);
            return acc;
          }, {} as Record<string, typeof assets>);

          const sortedCompanyNames = Object.keys(assetsByCompany).sort();

          return (
            <>
              <div className="space-y-4">
                {sortedCompanyNames.map((companyName) => {
                  const companyAssets = assetsByCompany[companyName];
                  const isExpanded = expandedCompanies.has(companyName);

                  return (
                    <div key={companyName} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      {/* Company Folder Header */}
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedCompanies);
                          if (isExpanded) {
                            newExpanded.delete(companyName);
                          } else {
                            newExpanded.add(companyName);
                          }
                          setExpandedCompanies(newExpanded);
                        }}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <svg 
                            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <div className="text-left">
                            <h3 className="text-lg font-semibold text-gray-900">{companyName}</h3>
                            <p className="text-sm text-gray-500">{companyAssets.length} asset{companyAssets.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <Badge variant="primary" size="sm">
                          {companyAssets.length}
                        </Badge>
                      </button>

                      {/* Company Assets Grid - Always show all when expanded */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 p-6 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {companyAssets.map((asset) => (
                              <AssetCard
                                key={asset.id}
                                asset={asset}
                                view="grid"
                                selected={selectedAssets.has(asset.id)}
                                onSelect={handleSelectAsset}
                                onQuickAction={handleQuickAction}
                                showCheckbox={false}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {loadingMore && (
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </div>
              )}
            </>
          );
        })()}

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
