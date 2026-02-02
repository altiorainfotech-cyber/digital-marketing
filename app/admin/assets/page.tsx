/**
 * Admin Assets Page
 * 
 * Admin page for viewing all assets (placeholder for future implementation)
 * 
 * Requirements: 7.1-7.5
 */

'use client';

import { ProtectedRoute } from '@/components/auth';
import { AdminLayout } from '@/components/admin';
import { useIsAdmin } from '@/lib/auth/hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function AdminAssetsContent() {
  const isAdmin = useIsAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Assets</h1>
          <p className="mt-2 text-gray-600">
            View and manage all assets in the system
          </p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">📁</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Asset Management Coming Soon
          </h2>
          <p className="text-gray-600">
            This page will display all assets with search, filter, and management capabilities.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            For now, use the Pending Approvals page to review assets awaiting approval.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminAssetsPage() {
  return (
    <ProtectedRoute>
      <AdminAssetsContent />
    </ProtectedRoute>
  );
}
