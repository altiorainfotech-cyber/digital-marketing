/**
 * Dashboard Layout for Content Creators and SEO Specialists
 * 
 * Provides persistent sidebar navigation and top bar for non-admin users
 */

'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar, SidebarItem } from '@/lib/design-system/components/patterns/Sidebar/Sidebar';
import { TopNav } from '@/lib/design-system/components/patterns/TopNav/TopNav';
import { useUser, useSignOut, useSession } from '@/lib/auth/hooks';
import { 
  LayoutDashboard,
  FolderOpen,
  Upload,
  BarChart3,
  Download,
  LogOut,
  User
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const signOut = useSignOut();
  const { status } = useSession();

  // Redirect admin users to admin panel
  useEffect(() => {
    if (status === 'authenticated' && user?.role === 'ADMIN') {
      router.push('/admin');
    }
  }, [status, user?.role, router]);

  // Define sidebar navigation items based on role
  const getSidebarItems = (): SidebarItem[] => {
    const baseItems: SidebarItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        active: pathname === '/dashboard',
      },
      {
        id: 'assets',
        label: 'Assets',
        href: '/assets',
        icon: <FolderOpen className="w-5 h-5" />,
        active: pathname?.startsWith('/assets'),
      },
      {
        id: 'upload',
        label: 'Upload Asset',
        href: '/assets/upload',
        icon: <Upload className="w-5 h-5" />,
        active: pathname === '/assets/upload',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/analytics',
        icon: <BarChart3 className="w-5 h-5" />,
        active: pathname?.startsWith('/analytics'),
      },
    ];

    // Add download history for SEO Specialists
    if (user?.role === 'SEO_SPECIALIST') {
      baseItems.splice(3, 0, {
        id: 'downloads',
        label: 'Download History',
        href: '/downloads',
        icon: <Download className="w-5 h-5" />,
        active: pathname?.startsWith('/downloads'),
      });
    }

    // Add platform downloads for Content Creators
    if (user?.role === 'CONTENT_CREATOR') {
      baseItems.splice(4, 0, {
        id: 'platform-downloads',
        label: 'Platform Downloads',
        href: '/platform-downloads',
        icon: <Download className="w-5 h-5" />,
        active: pathname?.startsWith('/platform-downloads'),
      });
    }

    return baseItems;
  };

  const sidebarItems = getSidebarItems();

  // Logo component
  const logo = (
    <a href="/dashboard" className="flex items-center gap-2">
      <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-sm">DA</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">DASCMS</span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {user?.role === 'CONTENT_CREATOR' ? 'Creator' : 'SEO'}
        </span>
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

  // Don't render dashboard content for admin users (they'll be redirected)
  if (user?.role === 'ADMIN') {
    return null;
  }

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
          {children}
        </main>
      </div>
    </div>
  );
}
