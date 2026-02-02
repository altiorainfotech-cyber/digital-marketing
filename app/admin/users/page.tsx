/**
 * User Management Page
 * 
 * Admin page for managing users - list, create, and edit with DataTable and Modal
 * 
 * Requirements: 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10
 */

'use client';

import { ProtectedRoute } from '@/components/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@/types';
import { DataTable, Column } from '@/lib/design-system/components/composite/DataTable/DataTable';
import { Modal } from '@/lib/design-system/components/composite/Modal/Modal';
import { Button } from '@/lib/design-system/components/primitives/Button/Button';
import { Input } from '@/lib/design-system/components/primitives/Input/Input';
import { Select, SelectOption } from '@/lib/design-system/components/primitives/Select/Select';
import { Badge } from '@/lib/design-system/components/primitives/Badge/Badge';
import { Plus, Edit, Search, X, RefreshCw, Copy, Check, UserX, Trash2, UserCheck, CheckSquare, Square } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  company?: {
    id: string;
    name: string;
  };
  isActivated?: boolean;
  isActive?: boolean;
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
}

function UserManagementContent() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [activationCode, setActivationCode] = useState<string>('');
  const [showActivationCode, setShowActivationCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deactivatingUserId, setDeactivatingUserId] = useState<string | null>(null);
  
  // Bulk operations state
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false);
  const [bulkOperationResults, setBulkOperationResults] = useState<{
    success: string[];
    failed: { userId: string; error: string }[];
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.CONTENT_CREATOR,
    companyId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  // Filter users based on search and role filter
  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.company?.name.toLowerCase().includes(query)
      );
    }

    if (selectedRole) {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, selectedRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // For editing users, company is still required for non-admin users
    if (editingUser && formData.role !== UserRole.ADMIN && !formData.companyId) {
      errors.companyId = 'Company is required for non-admin users';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      if (editingUser) {
        // Update existing user (old workflow)
        const url = `/api/users/${editingUser.id}`;
        const method = 'PATCH';
        
        const body = {
          name: formData.name,
          role: formData.role,
          companyId: formData.companyId || undefined,
        };

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update user');
        }

        // Reset form and refresh list
        handleCloseModal();
        fetchUsers();
      } else {
        // Create new user with activation code (new workflow)
        const response = await fetch('/api/users/create-with-activation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create user');
        }

        const data = await response.json();
        
        // Show activation code to admin
        setActivationCode(data.activationCode);
        setShowActivationCode(true);
        
        // Refresh user list
        fetchUsers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingUser ? 'update' : 'create'} user`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: UserRole.CONTENT_CREATOR,
      companyId: '',
    });
    setFormErrors({});
    setError(null);
    setShowModal(true);
    setShowActivationCode(false);
    setActivationCode('');
    setCopiedCode(false);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId || '',
    });
    setFormErrors({});
    setError(null);
    setShowModal(true);
    setShowActivationCode(false);
    setActivationCode('');
    setCopiedCode(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: UserRole.CONTENT_CREATOR,
      companyId: '',
    });
    setFormErrors({});
    setError(null);
    setShowActivationCode(false);
    setActivationCode('');
    setCopiedCode(false);
  };

  const handleRegenerateCode = async () => {
    if (!showActivationCode) return;
    
    setRegeneratingCode(true);
    setError(null);
    
    try {
      // Find the newly created user by email
      const user = users.find(u => u.email === formData.email);
      if (!user) {
        throw new Error('User not found');
      }
      
      const response = await fetch(`/api/users/${user.id}/regenerate-activation-code`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate activation code');
      }
      
      const data = await response.json();
      setActivationCode(data.activationCode);
      setCopiedCode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate activation code');
    } finally {
      setRegeneratingCode(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activationCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedRole('');
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
    setBulkOperationResults(null);
  };

  // Bulk operations handlers
  const handleBulkDeactivate = async () => {
    const userIdsArray = Array.from(selectedUserIds);
    
    if (!confirm(`Are you sure you want to deactivate ${userIdsArray.length} user(s)? They will not be able to log in.`)) {
      return;
    }

    setBulkOperationInProgress(true);
    setError(null);
    setBulkOperationResults(null);

    try {
      const response = await fetch('/api/users/bulk-deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: userIdsArray }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deactivate users');
      }

      setBulkOperationResults(data.results);
      
      // Refresh user list
      await fetchUsers();
      
      // Clear selection if all succeeded
      if (data.results.failed.length === 0) {
        clearSelection();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate users');
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const handleBulkReactivate = async () => {
    const userIdsArray = Array.from(selectedUserIds);
    
    if (!confirm(`Are you sure you want to reactivate ${userIdsArray.length} user(s)?`)) {
      return;
    }

    setBulkOperationInProgress(true);
    setError(null);
    setBulkOperationResults(null);

    try {
      const response = await fetch('/api/users/bulk-reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: userIdsArray }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate users');
      }

      setBulkOperationResults(data.results);
      
      // Refresh user list
      await fetchUsers();
      
      // Clear selection if all succeeded
      if (data.results.failed.length === 0) {
        clearSelection();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate users');
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const handleBulkDelete = async () => {
    const userIdsArray = Array.from(selectedUserIds);
    
    const warningMessage = `⚠️ WARNING: You are about to PERMANENTLY DELETE ${userIdsArray.length} user(s).

IMPORTANT: Users with related data (assets, audit logs, etc.) cannot be deleted and will be skipped.

Consider using "Deactivate" instead to preserve data integrity.

This action CANNOT be undone!`;
    
    if (!confirm(warningMessage)) {
      return;
    }

    // Double confirmation for bulk delete
    if (!confirm(`This is your final confirmation. Type "DELETE" in the next prompt to proceed.`)) {
      return;
    }

    const confirmation = prompt('Type DELETE to confirm permanent deletion:');
    if (confirmation !== 'DELETE') {
      alert('Deletion cancelled. You must type DELETE exactly to confirm.');
      return;
    }

    setBulkOperationInProgress(true);
    setError(null);
    setBulkOperationResults(null);

    try {
      const response = await fetch('/api/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: userIdsArray }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete users');
      }

      setBulkOperationResults(data.results);
      
      // Show summary message
      if (data.results.failed.length > 0) {
        const relatedDataErrors = data.results.failed.filter((f: any) => 
          f.error.includes('related data')
        ).length;
        
        if (relatedDataErrors > 0) {
          setError(`${relatedDataErrors} user(s) could not be deleted because they have related data. Consider deactivating these users instead.`);
        }
      }
      
      // Refresh user list
      await fetchUsers();
      
      // Clear selection if all succeeded
      if (data.results.failed.length === 0) {
        clearSelection();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete users');
    } finally {
      setBulkOperationInProgress(false);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user? They will not be able to log in.')) {
      return;
    }

    setDeactivatingUserId(userId);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}/deactivate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deactivate user');
      }

      // Refresh user list
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
    } finally {
      setDeactivatingUserId(null);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    setDeactivatingUserId(userId);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}/reactivate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reactivate user');
      }

      // Refresh user list
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate user');
    } finally {
      setDeactivatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(userId);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a foreign key constraint error
        if (data.error && data.error.includes('related data')) {
          setError(`Cannot delete ${userName}: User has related data (assets, audit logs, etc.). Please deactivate the user instead.`);
        } else {
          throw new Error(data.error || 'Failed to delete user');
        }
        return;
      }

      // Refresh user list
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  // Define table columns
  const columns: Column<User>[] = [
    {
      key: 'select',
      header: '☑',
      render: (user) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectUser(user.id);
          }}
          className="flex items-center justify-center w-full"
          title={selectedUserIds.has(user.id) ? 'Deselect' : 'Select'}
        >
          {selectedUserIds.has(user.id) ? (
            <CheckSquare className="w-5 h-5 text-blue-600" />
          ) : (
            <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (user) => (
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {user.name}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (user) => (
        <span className="text-neutral-600 dark:text-neutral-400">
          {user.email}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user) => {
        const roleColors: Record<UserRole, 'primary' | 'info' | 'success'> = {
          [UserRole.ADMIN]: 'primary',
          [UserRole.CONTENT_CREATOR]: 'info',
          [UserRole.SEO_SPECIALIST]: 'success',
        };
        return (
          <Badge variant={roleColors[user.role]}>
            {user.role.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <Badge variant={user.isActive === false ? 'error' : 'success'}>
          {user.isActive === false ? 'Deactivated' : 'Active'}
        </Badge>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      render: (user) => (
        <span className="text-neutral-600 dark:text-neutral-400">
          {user.company?.name || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (user) => (
        <span className="text-neutral-600 dark:text-neutral-400">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditModal(user);
            }}
            title="Edit user"
          >
            Edit
          </Button>
          
          {user.isActive === false ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<UserCheck className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                handleReactivateUser(user.id);
              }}
              loading={deactivatingUserId === user.id}
              disabled={deactivatingUserId === user.id}
              title="Reactivate user"
              className="text-green-600 hover:text-green-700"
            >
              Reactivate
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              icon={<UserX className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                handleDeactivateUser(user.id);
              }}
              loading={deactivatingUserId === user.id}
              disabled={deactivatingUserId === user.id}
              title="Deactivate user"
              className="text-yellow-600 hover:text-yellow-700"
            >
              Deactivate
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteUser(user.id, user.name);
            }}
            loading={deletingUserId === user.id}
            disabled={deletingUserId === user.id}
            title="Delete user permanently"
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const roleOptions: SelectOption[] = [
    { value: '', label: 'All Roles' },
    { value: UserRole.ADMIN, label: 'Admin' },
    { value: UserRole.CONTENT_CREATOR, label: 'Content Creator' },
    { value: UserRole.SEO_SPECIALIST, label: 'SEO Specialist' },
  ];

  const formRoleOptions: SelectOption[] = [
    { value: UserRole.ADMIN, label: 'Admin' },
    { value: UserRole.CONTENT_CREATOR, label: 'Content Creator' },
    { value: UserRole.SEO_SPECIALIST, label: 'SEO Specialist' },
  ];

  const companyOptions: SelectOption[] = [
    { value: '', label: 'Select a company' },
    ...companies.map((company) => ({
      value: company.id,
      label: company.name,
    })),
  ];

  const hasActiveFilters = searchQuery || selectedRole;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            User Management
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Create and manage user accounts with roles and company assignments
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={handleOpenCreateModal}
        >
          Create User
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Info Banner about Deletion */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mt-0.5">
            <span className="text-blue-600 dark:text-blue-400 text-xs">ℹ️</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              About User Deletion
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Users with related data (uploaded assets, audit logs, approvals, etc.) cannot be deleted to maintain data integrity. 
              Use <strong>Deactivate</strong> instead to suspend access while preserving historical records.
            </p>
          </div>
        </div>
      </div>

      {/* Bulk Operation Results */}
      {bulkOperationResults && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="space-y-3">
            {bulkOperationResults.success.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Successfully processed {bulkOperationResults.success.length} user(s)
                  </p>
                </div>
              </div>
            )}
            
            {bulkOperationResults.failed.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                    Failed to process {bulkOperationResults.failed.length} user(s):
                  </p>
                  <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                    {bulkOperationResults.failed.map((failure, idx) => (
                      <li key={idx}>• {failure.error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBulkOperationResults(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedUserIds.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedUserIds.size} user(s) selected
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Choose an action to apply to selected users
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<UserX className="w-4 h-4" />}
                onClick={handleBulkDeactivate}
                loading={bulkOperationInProgress}
                disabled={bulkOperationInProgress}
                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
              >
                Deactivate
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                icon={<UserCheck className="w-4 h-4" />}
                onClick={handleBulkReactivate}
                loading={bulkOperationInProgress}
                disabled={bulkOperationInProgress}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                Reactivate
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleBulkDelete}
                loading={bulkOperationInProgress}
                disabled={bulkOperationInProgress}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
              
              <div className="w-px h-6 bg-blue-300 dark:bg-blue-700" />
              
              <Button
                variant="ghost"
                size="sm"
                icon={<X className="w-4 h-4" />}
                onClick={clearSelection}
                disabled={bulkOperationInProgress}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              iconPosition="left"
              fullWidth
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={roleOptions}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              fullWidth
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              icon={<X className="w-4 h-4" />}
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            icon={selectedUserIds.size === filteredUsers.length ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
            onClick={handleSelectAll}
            title={selectedUserIds.size === filteredUsers.length ? 'Deselect all' : 'Select all'}
          >
            {selectedUserIds.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
        
        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <span>Showing {filteredUsers.length} of {users.length} users</span>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={loading}
          emptyMessage="No users found"
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingUser ? 'Edit User' : 'Create New User'}
        size="md"
        footer={
          !showActivationCode ? (
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={submitting}
              >
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={handleCloseModal}
              >
                Done
              </Button>
            </div>
          )
        }
      >
        {!showActivationCode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              fullWidth
            />

            <Input
              label="Email"
              type="email"
              required
              disabled={!!editingUser}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              helperText={editingUser ? 'Email cannot be changed' : undefined}
              fullWidth
            />

            <Select
              label="Role"
              required
              options={formRoleOptions}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              error={formErrors.role}
              fullWidth
            />

            {editingUser && formData.role !== UserRole.ADMIN && (
              <Select
                label="Company"
                required
                options={companyOptions}
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                error={formErrors.companyId}
                fullWidth
              />
            )}
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
              <p className="text-success-700 dark:text-success-300 font-medium mb-2">
                User created successfully!
              </p>
              <p className="text-success-600 dark:text-success-400 text-sm">
                Share the activation code below with the user. They will use it to set their password and activate their account.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Activation Code
              </label>
              <div className="flex gap-2">
                <Input
                  value={activationCode}
                  readOnly
                  fullWidth
                  className="font-mono text-lg tracking-wider"
                />
                <Button
                  variant="ghost"
                  icon={copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  onClick={handleCopyCode}
                  title="Copy to clipboard"
                >
                  {copiedCode ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                This code will expire in 7 days. The user must activate their account before then.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={handleRegenerateCode}
                loading={regeneratingCode}
              >
                Regenerate Code
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <ProtectedRoute>
      <UserManagementContent />
    </ProtectedRoute>
  );
}
