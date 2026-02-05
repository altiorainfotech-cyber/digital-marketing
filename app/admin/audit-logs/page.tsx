/**
 * Audit Log Viewer Page
 * 
 * Admin page for viewing audit logs with filtering
 * 
 * Requirements: 12.3, 12.5
 */

'use client';

import { ProtectedRoute } from '@/components/auth';
import { AdminLayout } from '@/components/admin';
import { useIsAdmin } from '@/lib/auth/hooks';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuditAction, ResourceType } from '@/types';

interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  asset?: {
    id: string;
    title: string;
    assetType: string;
  };
}

interface PaginatedAuditLogs {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function AuditLogViewerContent() {
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Filter state
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
    userRole: '',
  });

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchAuditLogs();
  }, [isAdmin, router, page, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.userId) params.append('userId', filters.userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.userRole) params.append('userRole', filters.userRole);

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data: PaginatedAuditLogs = await response.json();
      setAuditLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      action: '',
      resourceType: '',
      startDate: '',
      endDate: '',
      userRole: '',
    });
    setPage(1);
  };

  const getActionBadgeColor = (action: AuditAction) => {
    switch (action) {
      case AuditAction.CREATE:
        return 'bg-green-100 text-green-800';
      case AuditAction.UPDATE:
        return 'bg-blue-100 text-blue-800';
      case AuditAction.DELETE:
        return 'bg-red-100 text-red-800';
      case AuditAction.APPROVE:
        return 'bg-emerald-100 text-emerald-800';
      case AuditAction.REJECT:
        return 'bg-orange-100 text-orange-800';
      case AuditAction.DOWNLOAD:
        return 'bg-purple-100 text-purple-800';
      case AuditAction.SHARE:
        return 'bg-indigo-100 text-indigo-800';
      case AuditAction.VISIBILITY_CHANGE:
        return 'bg-yellow-100 text-yellow-800';
      case AuditAction.LOGIN:
        return 'bg-cyan-100 text-cyan-800';
      case AuditAction.LOGOUT:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceTypeBadgeColor = (resourceType: ResourceType) => {
    switch (resourceType) {
      case ResourceType.ASSET:
        return 'bg-blue-100 text-blue-800';
      case ResourceType.USER:
        return 'bg-purple-100 text-purple-800';
      case ResourceType.COMPANY:
        return 'bg-green-100 text-green-800';
      case ResourceType.APPROVAL:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isSensitiveOperation = (action: AuditAction) => {
    return [
      AuditAction.APPROVE,
      AuditAction.REJECT,
      AuditAction.VISIBILITY_CHANGE,
    ].includes(action);
  };

  const formatMetadata = (metadata: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return 'No additional context';
    }

    return Object.entries(metadata)
      .map(([key, value]) => {
        if (typeof value === 'object') {
          return `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${value}`;
      })
      .join(', ');
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-gray-600">
            View system activity and track all operations for compliance
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                placeholder="Filter by user ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                {Object.values(AuditAction).map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource Type
              </label>
              <select
                value={filters.resourceType}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Resources</option>
                {Object.values(ResourceType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Role
              </label>
              <select
                value={filters.userRole}
                onChange={(e) => handleFilterChange('userRole', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="CONTENT_CREATOR">Content Creator</option>
                <option value="SEO_SPECIALIST">SEO Specialist</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end md:col-span-2 lg:col-span-1">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Audit Logs List */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Audit Log Entries
            </h2>
            <span className="text-sm text-gray-500">
              {total} total entries
            </span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No audit logs found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{log.user?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{log.user?.email || log.userId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                          {isSensitiveOperation(log.action) && (
                            <span className="ml-2 text-xs text-orange-600" title="Sensitive operation with detailed context">
                              ⚠️
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getResourceTypeBadgeColor(log.resourceType)}`}>
                              {log.resourceType}
                            </span>
                            {log.asset && (
                              <div className="text-xs text-gray-500 mt-1">
                                {log.asset.title}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {log.action === 'DOWNLOAD' && log.metadata?.platforms ? (
                            <div>
                              <div className="font-medium text-gray-700">
                                Platforms: {Array.isArray(log.metadata.platforms) 
                                  ? log.metadata.platforms.join(', ') 
                                  : log.metadata.platformIntent || 'Not specified'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatMetadata(log.metadata)}
                              </div>
                            </div>
                          ) : (
                            formatMetadata(log.metadata)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {page} of {totalPages} ({total} total entries)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                Audit Log Details
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Log ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{selectedLog.id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedLog.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">User</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedLog.user?.name} ({selectedLog.user?.email})
                </p>
                <p className="text-xs text-gray-500">Role: {selectedLog.user?.role}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Action</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getActionBadgeColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                  {isSensitiveOperation(selectedLog.action) && (
                    <span className="ml-2 text-xs text-orange-600">
                      ⚠️ Sensitive Operation
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Resource</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getResourceTypeBadgeColor(selectedLog.resourceType)}`}>
                    {selectedLog.resourceType}
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-900 font-mono">{selectedLog.resourceId}</p>
                {selectedLog.asset && (
                  <p className="text-sm text-gray-600 mt-1">
                    Asset: {selectedLog.asset.title} ({selectedLog.asset.assetType})
                  </p>
                )}
              </div>

              {selectedLog.ipAddress && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">IP Address</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedLog.ipAddress}</p>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Agent</label>
                  <p className="mt-1 text-sm text-gray-900 break-all">{selectedLog.userAgent}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metadata
                  {isSensitiveOperation(selectedLog.action) && (
                    <span className="ml-2 text-xs text-orange-600">
                      (Detailed context for sensitive operation)
                    </span>
                  )}
                </label>
                
                {/* Special display for download actions with platforms */}
                {selectedLog.action === 'DOWNLOAD' && selectedLog.metadata?.platforms && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      Platform Usage
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedLog.metadata.platforms) ? (
                        selectedLog.metadata.platforms.map((platform: string) => (
                          <span
                            key={platform}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {platform}
                          </span>
                        ))
                      ) : (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {selectedLog.metadata.platformIntent || 'Not specified'}
                        </span>
                      )}
                    </div>
                    {selectedLog.metadata.userRole && (
                      <div className="mt-2 text-xs text-blue-700">
                        Downloaded by: {selectedLog.metadata.userRole}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                  <pre className="text-xs text-gray-900 whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AuditLogViewerPage() {
  return (
    <ProtectedRoute>
      <AuditLogViewerContent />
    </ProtectedRoute>
  );
}
