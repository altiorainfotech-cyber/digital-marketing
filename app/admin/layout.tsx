/**
 * Admin Layout
 * 
 * Provides persistent sidebar navigation and top bar for admin pages
 * 
 * Requirements: 9.1, 9.2, 12.1, 12.2, 12.3
 */

'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar, SidebarItem } from '@/lib/design-system/components/patterns/Sidebar/Sidebar';
import { TopNav } from '@/lib/design-system/components/patterns/TopNav/TopNav';
import { useUser, useSignOut, useIsAdmin, useSession } from '@/lib/auth/hooks';
import { 
  Users, 
  Building2, 
  FileCheck, 
  FolderOpen, 
  ScrollText, 
  BarChart3,
  LayoutDashboard,
  LogOut,
  User
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const signOut = useSignOut();
  const isAdmin = useIsAdmin();
  const { status } = useSession();

  // Redirect if not admin - use useEffect to avoid setState during render
  useEffect(() => {
    // Only redirect if we've confirmed the user is NOT an admin
    // Don't redirect during loading state
    if (status === 'authenticated' && !isAdmin) {
      router.push('/dashboard');
    }
  }, [status, isAdmin, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render admin content if not admin
  if (!isAdmin) {
    return null;
  }

  // Define sidebar navigation items
  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="w-5 h-5" />,
      active: pathname === '/admin',
    },
    {
      id: 'users',
      label: 'Users',
      href: '/admin/users',
      icon: <Users className="w-5 h-5" />,
      active: pathname?.startsWith('/admin/users'),
    },
    {
      id: 'companies',
      label: 'Companies',
      href: '/admin/companies',
      icon: <Building2 className="w-5 h-5" />,
      active: pathname?.startsWith('/admin/companies'),
    },
    {
      id: 'assets',
      label: 'Assets',
      href: '/admin/assets',
      icon: <FolderOpen className="w-5 h-5" />,
      active: pathname?.startsWith('/admin/assets'),
    },
    {
      id: 'approvals',
      label: 'Pending Approvals',
      href: '/admin/approvals',
      icon: <FileCheck className="w-5 h-5" />,
      active: pathname?.startsWith('/admin/approvals'),
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      href: '/admin/audit-logs',
      icon: <ScrollText className="w-5 h-5" />,
      active: pathname?.startsWith('/admin/audit-logs'),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      active: pathname?.startsWith('/analytics'),
    },
  ];

  // Logo component
  const logo = (
    <a href="/admin" className="flex items-center gap-2">
      <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">DA</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">DASCMS</span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">Admin</span>
      </div>
    </a>
  );

  // User menu component for top nav
  const userMenu = (
    <div className="flex items-center gap-4">
      {/* User info */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <User className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {user?.name}
          </span>
        </div>
        <span className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
          {user?.role?.replace('_', ' ')}
        </span>
      </div>

      {/* Sign out button */}
      <button
        onClick={signOut}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        aria-label="Sign out"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Top Navigation Bar */}
      <TopNav
        logo={logo}
        rightContent={userMenu}
        bordered
        sticky
      />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar Navigation */}
        <Sidebar
          items={sidebarItems}
          className="flex-shrink-0"
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
