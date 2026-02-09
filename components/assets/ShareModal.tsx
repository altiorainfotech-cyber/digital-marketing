/**
 * ShareModal Component
 * 
 * Modal for sharing assets with specific users
 * 
 * Requirements: 13.1-13.5
 * 
 * Key Features:
 * - User selection interface
 * - Share/revoke actions
 * - Display current shares
 * - Only available for Doc assets with UPLOADER_ONLY or SELECTED_USERS visibility
 */

'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@/app/generated/prisma';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
}

interface Share {
  id: string;
  assetId: string;
  sharedById: string;
  sharedWithId: string;
  targetType?: string;
  targetId?: string;
  createdAt: string;
  sharedWith?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ShareModalProps {
  assetId: string;
  assetTitle: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export function ShareModal({
  assetId,
  assetTitle,
  isOpen,
  onClose,
  currentUserId,
}: ShareModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load users and shares when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadShares();
    }
  }, [isOpen, assetId]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        // Filter out current user
        const filteredUsers = data.users.filter((u: User) => u.id !== currentUserId);
        setUsers(filteredUsers);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadShares = async () => {
    setSharesLoading(true);
    try {
      const response = await fetch(`/api/assets/${assetId}/share`);
      if (response.ok) {
        const data = await response.json();
        setShares(data.shares || []);
      }
    } catch (err) {
      console.error('Failed to load shares:', err);
    } finally {
      setSharesLoading(false);
    }
  };

  const handleShare = async () => {
    if (selectedUserIds.length === 0) {
      setError('Please select at least one user to share with');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/assets/${assetId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sharedWithIds: selectedUserIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to share asset');
      }

      // Reload shares and reset selection
      await loadShares();
      setSelectedUserIds([]);
      setSearchQuery('');
    } catch (err: any) {
      setError(err.message || 'Failed to share asset');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (sharedWithId: string) => {
    if (!confirm('Are you sure you want to revoke access for this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/assets/${assetId}/share/${sharedWithId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to revoke share');
      }

      // Reload shares
      await loadShares();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke share');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const isUserShared = (userId: string) => {
    return shares.some((share) => share.sharedWithId === userId);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const notAlreadyShared = !isUserShared(user.id);
    return matchesSearch && notAlreadyShared;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Share Asset</h2>
              <p className="text-sm text-gray-600 mt-1">{assetTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Current Shares */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Currently Shared With
            </h3>
            {sharesLoading ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">Loading shares...</p>
            ) : shares.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                This asset is not shared with anyone yet.
              </p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {share.sharedWith?.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {share.sharedWith?.email || ''}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Shared on {new Date(share.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevoke(share.sharedWithId)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Share with New Users */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Share with Users
            </h3>

            {/* Search */}
            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* User List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {searchQuery
                    ? 'No users found matching your search.'
                    : 'No users available to share with.'}
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.role.replace('_', ' ')}
                        {user.companyId && ' • Company User'}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {selectedUserIds.length > 0 && (
              <span>{selectedUserIds.length} user(s) selected</span>
            )}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={loading || selectedUserIds.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
