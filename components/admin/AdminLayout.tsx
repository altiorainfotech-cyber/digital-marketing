/**
 * Admin Layout Component
 * 
 * Provides navigation and layout structure for admin pages
 * with role-based menu items
 * 
 * Requirements: 1.4, 2.3, 5.1
 */

'use client';

import { useUser, useSignOut, useIsAdmin } from '@/lib/auth/hooks';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const user = useUser();
  const signOut = useSignOut();
  const isAdmin = useIsAdmin();
  const pathname = usePathname();

  // Redirect if not admin (handled by ProtectedRoute in pages)
  if (!isAdmin) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Companies', href: '/admin/companies', icon: '🏢' },
    { name: 'Assets', href: '/admin/assets', icon: '📁' },
    { name: 'Pending Approvals', href: '/admin/approvals', icon: '✓' },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: '📋' },
    { name: 'Analytics', href: '/analytics', icon: '📈' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center">
                <span className="text-xl font-bold text-blue-600">DASCMS</span>
                <span className="ml-2 text-sm text-gray-500">Admin</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.name}
              </span>
              <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">
                {user?.role}
              </span>
              <button
                onClick={signOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] border-r border-gray-200">
          <nav className="mt-5 px-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                onClick={(e) => {
                  // Prevent default navigation if already on the page
                  if (isActive(item.href) && pathname === item.href) {
                    e.preventDefault();
                  }
                }}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
