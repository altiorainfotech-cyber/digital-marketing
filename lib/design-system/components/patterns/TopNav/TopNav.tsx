import React from 'react';

export interface TopNavItem {
  /**
   * Unique identifier
   */
  id: string;
  /**
   * Display label
   */
  label: string;
  /**
   * Navigation href
   */
  href: string;
  /**
   * Whether this item is currently active
   */
  active?: boolean;
  /**
   * Whether this item is disabled
   */
  disabled?: boolean;
}

export interface TopNavProps {
  /**
   * Logo or branding element
   */
  logo?: React.ReactNode;
  /**
   * Navigation items
   */
  items?: TopNavItem[];
  /**
   * Right-side content (user menu, notifications, etc.)
   */
  rightContent?: React.ReactNode;
  /**
   * Whether to show a bottom border
   */
  bordered?: boolean;
  /**
   * Whether the nav is sticky
   */
  sticky?: boolean;
  /**
   * Whether to show mobile menu button
   */
  showMobileMenu?: boolean;
  /**
   * Callback when mobile menu button is clicked
   */
  onMobileMenuClick?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * TopNav component provides horizontal navigation bar for the top of pages.
 * Includes logo, navigation items, and right-side content area.
 */
export function TopNav({
  logo,
  items = [],
  rightContent,
  bordered = true,
  sticky = false,
  showMobileMenu = false,
  onMobileMenuClick,
  className = '',
}: TopNavProps) {
  return (
    <nav
      className={`
        bg-white dark:bg-neutral-900
        ${bordered ? 'border-b border-neutral-200 dark:border-neutral-800' : ''}
        ${sticky ? 'sticky top-0 z-30' : ''}
        ${className}
      `}
      aria-label="Top navigation"
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Button */}
          {showMobileMenu && onMobileMenuClick && (
            <div className="md:hidden mr-2">
              <MobileMenuButton onClick={onMobileMenuClick} />
            </div>
          )}

          {/* Logo */}
          {logo && (
            <div className="flex-shrink-0">
              {logo}
            </div>
          )}

          {/* Navigation Items */}
          {items.length > 0 && (
            <div className="hidden md:flex items-center space-x-1 flex-1 ml-8">
              {items.map((item) => (
                <TopNavLink key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Right Content */}
          {rightContent && (
            <div className="flex items-center gap-3 ml-auto">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

/**
 * TopNavLink component - individual navigation link
 */
interface TopNavLinkProps {
  item: TopNavItem;
}

function TopNavLink({ item }: TopNavLinkProps) {
  const baseClasses = `
    px-3 py-2 rounded-lg text-sm font-medium
    transition-colors duration-150
  `;

  const stateClasses = item.disabled
    ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
    : item.active
    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50';

  if (item.disabled) {
    return (
      <div className={`${baseClasses} ${stateClasses}`} aria-disabled="true">
        {item.label}
      </div>
    );
  }

  return (
    <a
      href={item.href}
      className={`${baseClasses} ${stateClasses}`}
      aria-current={item.active ? 'page' : undefined}
    >
      {item.label}
    </a>
  );
}

/**
 * MobileMenuButton component - hamburger menu button for mobile
 */
export interface MobileMenuButtonProps {
  /**
   * Callback when button is clicked
   */
  onClick: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function MobileMenuButton({ onClick, className = '' }: MobileMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center justify-center p-2 rounded-lg
        text-neutral-700 dark:text-neutral-300
        hover:bg-neutral-100 dark:hover:bg-neutral-800
        focus:outline-none focus:ring-2 focus:ring-primary-500
        min-w-[44px] min-h-[44px]
        ${className}
      `}
      aria-label="Open menu"
    >
      <span className="sr-only">Open menu</span>
      
      {/* Hamburger Icon */}
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}
