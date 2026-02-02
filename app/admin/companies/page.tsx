/**
 * Company Management Page
 * 
 * Admin page for managing companies with DataTable and Modal
 * 
 * Requirements: 9.3, 9.4, 9.5, 9.6, 9.7, 9.9
 */

'use client';

import { ProtectedRoute } from '@/components/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DataTable, Column } from '@/lib/design-system/components/composite/DataTable/DataTable';
import { Modal } from '@/lib/design-system/components/composite/Modal/Modal';
import { Button } from '@/lib/design-system/components/primitives/Button/Button';
import { Input } from '@/lib/design-system/components/primitives/Input/Input';
import { Badge } from '@/lib/design-system/components/primitives/Badge/Badge';
import { Plus, Trash2, Search, X, AlertCircle } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  createdAt: string;
  userCount?: number;
}

function CompanyManagementContent() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Filter companies based on search
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredCompanies(
        companies.filter((company) =>
          company.name.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredCompanies(companies);
    }
  }, [companies, searchQuery]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/companies');
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      const data = await response.json();
      setCompanies(data.companies || []);
      setFilteredCompanies(data.companies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      setFormError('Company name is required');
      return;
    }

    setError(null);
    setFormError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create company');
      }

      // Reset form and refresh list
      handleCloseCreateModal();
      fetchCompanies();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/companies/${companyToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete company');
      }

      handleCloseDeleteModal();
      fetchCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete company');
      setSubmitting(false);
    }
  };

  const handleOpenCreateModal = () => {
    setCompanyName('');
    setFormError('');
    setError(null);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCompanyName('');
    setFormError('');
  };

  const handleOpenDeleteModal = (company: Company) => {
    setCompanyToDelete(company);
    setError(null);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setCompanyToDelete(null);
    setSubmitting(false);
  };

  // Define table columns
  const columns: Column<Company>[] = [
    {
      key: 'name',
      header: 'Company Name',
      sortable: true,
      render: (company) => (
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {company.name}
        </span>
      ),
    },
    {
      key: 'users',
      header: 'Users',
      sortable: true,
      render: (company) => {
        const userCount = company.userCount || 0;
        return (
          <Badge variant={userCount > 0 ? 'primary' : 'default'}>
            {userCount} {userCount === 1 ? 'user' : 'users'}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (company) => (
        <span className="text-neutral-600 dark:text-neutral-400">
          {new Date(company.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (company) => {
        const userCount = company.userCount || 0;
        const canDelete = userCount === 0;

        return (
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDeleteModal(company);
            }}
            disabled={!canDelete}
            title={!canDelete ? 'Cannot delete company with users' : 'Delete company'}
          >
            Delete
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Company Management
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Manage companies and view user assignments
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-5 h-5" />}
          onClick={handleOpenCreateModal}
        >
          Create Company
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              iconPosition="left"
              fullWidth
            />
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              icon={<X className="w-4 h-4" />}
              onClick={() => setSearchQuery('')}
            >
              Clear
            </Button>
          )}
        </div>
        
        {searchQuery && (
          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <span>Showing {filteredCompanies.length} of {companies.length} companies</span>
          </div>
        )}
      </div>

      {/* Companies Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredCompanies}
          loading={loading}
          emptyMessage="No companies found"
        />
      </div>

      {/* Info Box */}
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
              Deletion Protection
            </h3>
            <p className="mt-1 text-sm text-primary-700 dark:text-primary-300">
              Companies can only be deleted if they have no associated users. 
              This protection ensures data integrity and prevents accidental data loss.
            </p>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        title="Create New Company"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={handleCloseCreateModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCompany}
              loading={submitting}
            >
              Create Company
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <Input
            label="Company Name"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            error={formError}
            helperText="Company name must be unique"
            placeholder="Enter unique company name"
            fullWidth
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        title="Delete Company"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={handleCloseDeleteModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteCompany}
              loading={submitting}
            >
              Delete Company
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning-900 dark:text-warning-100">
                Warning: This action cannot be undone
              </p>
              <p className="mt-1 text-sm text-warning-700 dark:text-warning-300">
                This will permanently delete the company and all associated data.
              </p>
            </div>
          </div>
          
          {companyToDelete && (
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              Are you sure you want to delete <strong>{companyToDelete.name}</strong>?
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function CompanyManagementPage() {
  return (
    <ProtectedRoute>
      <CompanyManagementContent />
    </ProtectedRoute>
  );
}
