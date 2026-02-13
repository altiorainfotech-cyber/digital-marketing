/**
 * Admin Dashboard Page
 * 
 * Main admin dashboard with overview and quick links
 * 
 * Requirements: 1.4, 2.3, 5.1
 */

'use client';

import { ProtectedRoute } from '@/components/auth';
import Link from 'next/link';
import { Users, Building2, FileCheck, FolderOpen, ScrollText } from 'lucide-react';
import { useEffect, useState } from 'react';

function AdminDashboardContent() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch admin statistics
  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);
  const quickLinks = [
    {
      title: 'User Management',
      description: 'Create and manage user accounts',
      href: '/admin/users',
      icon: <Users className="w-8 h-8" />,
      color: 'blue',
    },
    {
      title: 'Company Management',
      description: 'Manage companies and assignments',
      href: '/admin/companies',
      icon: <Building2 className="w-8 h-8" />,
      color: 'green',
    },
    {
      title: 'Pending Approvals',
      description: 'Review and approve assets',
      href: '/admin/approvals',
      icon: <FileCheck className="w-8 h-8" />,
      color: 'yellow',
    },
    {
      title: 'All Assets',
      description: 'View and manage all assets',
      href: '/admin/assets',
      icon: <FolderOpen className="w-8 h-8" />,
      color: 'purple',
    },
    {
      title: 'Audit Logs',
      description: 'View system activity and compliance logs',
      href: '/admin/audit-logs',
      icon: <ScrollText className="w-8 h-8" />,
      color: 'red',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage users, companies, and approve assets
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block p-6 bg-white dark:bg-neutral-900 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-neutral-200 dark:border-neutral-800 hover:border-primary-300 dark:hover:border-primary-700"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-primary-600 dark:text-primary-400">
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {link.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {link.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-6 border border-neutral-200 dark:border-neutral-800">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Quick Stats
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-100 dark:border-primary-900">
            <p className="text-sm text-primary-700 dark:text-primary-300 font-medium">Total Users</p>
            <p className="text-2xl font-bold text-primary-900 dark:text-primary-100 mt-1">
              {loading ? '...' : stats?.totalUsers || '0'}
            </p>
          </div>
          <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg border border-success-100 dark:border-success-900">
            <p className="text-sm text-success-700 dark:text-success-300 font-medium">Companies</p>
            <p className="text-2xl font-bold text-success-900 dark:text-success-100 mt-1">
              {loading ? '...' : stats?.totalCompanies || '0'}
            </p>
          </div>
          <div className="bg-warning-50 dark:bg-warning-900/20 p-4 rounded-lg border border-warning-100 dark:border-warning-900">
            <p className="text-sm text-warning-700 dark:text-warning-300 font-medium">Pending Approvals</p>
            <p className="text-2xl font-bold text-warning-900 dark:text-warning-100 mt-1">
              {loading ? '...' : stats?.pendingApprovals || '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
