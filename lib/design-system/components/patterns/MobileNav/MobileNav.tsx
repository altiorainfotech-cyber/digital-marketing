import React, { useEffect } from 'react';

export interface MobileNavItem {
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
   * Icon element
   */
  icon?: React.ReactNode;
  /**
   * Badge content (number or text)
   */
  badge?: string | number;
  /**
   * Whether this item is currently active
   */
  active?: boolean;
  /**
   * Whether this item is disabled
   */
  disabled?: boolean;
}

export interface MobileNavProps {
  /**
   * Whether the drawer is open
   */
  isOpen: boolean;
  /**
   * Callback when drawer should close
   */
  onClose: () => void;
  /**
   * Navigation items
   */
  items: MobileNavItem[];
  /**
   * Logo or branding element
   */
  logo?: React.ReactNode;
  /**
   * Footer content
   */
  footer?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * MobileNav component provides a slide-in navigation drawer for mobile devices.
 * Includes backdrop, slide animation, and focus trap.
 */
export function MobileNav({
  isOpen,
  onClose,
  items,
  logo,
  footer,
  className = '',
}: MobileNavProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 w-80 max-w-[85vw]
          bg-white dark:bg-neutral-900
          shadow-xl z-50
          transform transition-transform duration-300 ease-out
          md:hidden
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header with Logo and Close Button */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200 dark:border-neutral-800">
            {logo && <div className="flex-shrink-0">{logo}</div>}
            
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Close menu"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-4" aria-label="Mobile navigation">
            <ul className="space-y-1 px-4">
              {items.map((item) => (
                <li key={item.id}>
                  <MobileNavLink item={item} onClose={onClose} />
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          {footer && (
            <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
              {footer}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/**
 * MobileNavLink component - individual navigation link
 */
interface MobileNavLinkProps {
  item: MobileNavItem;
  onClose: () => void;
}

function MobileNavLink({ item, onClose }: MobileNavLinkProps) {
  const baseClasses = `
    flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium
    transition-colors duration-150
    min-h-[44px]
  `;

  const stateClasses = item.disabled
    ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
    : item.active
    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-l-4 border-primary-500'
    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800';

  const content = (
    <>
      {item.icon && (
        <span className="flex-shrink-0 w-6 h-6" aria-hidden="true">
          {item.icon}
        </span>
      )}
      
      <span className="flex-1">{item.label}</span>
      
      {item.badge !== undefined && (
        <span
          className="flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
          aria-label={`${item.badge} items`}
        >
          {item.badge}
        </span>
      )}
    </>
  );

  if (item.disabled) {
    return (
      <div className={`${baseClasses} ${stateClasses}`} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <a
      href={item.href}
      className={`${baseClasses} ${stateClasses}`}
      aria-current={item.active ? 'page' : undefined}
      onClick={onClose}
    >
      {content}
    </a>
  );
}

/**
 * BottomNav component provides bottom navigation bar for mobile devices.
 * Displays primary actions with icons and labels.
 */
export interface BottomNavItem {
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
   * Icon element (required for bottom nav)
   */
  icon: React.ReactNode;
  /**
   * Badge content (number or text)
   */
  badge?: string | number;
  /**
   * Whether this item is currently active
   */
  active?: boolean;
}

export interface BottomNavProps {
  /**
   * Navigation items (max 5 recommended)
   */
  items: BottomNavItem[];
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function BottomNav({ items, className = '' }: BottomNavProps) {
  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0
        bg-white dark:bg-neutral-900
        border-t border-neutral-200 dark:border-neutral-800
        shadow-lg z-30
        md:hidden
        ${className}
      `}
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => (
          <BottomNavLink key={item.id} item={item} />
        ))}
      </div>
    </nav>
  );
}

/**
 * BottomNavLink component - individual bottom navigation link
 */
interface BottomNavLinkProps {
  item: BottomNavItem;
}

function BottomNavLink({ item }: BottomNavLinkProps) {
  const baseClasses = `
    relative flex flex-col items-center justify-center
    px-3 py-2 rounded-lg text-xs font-medium
    transition-colors duration-150
    min-w-[64px] min-h-[44px]
  `;

  const stateClasses = item.active
    ? 'text-primary-600 dark:text-primary-400'
    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100';

  return (
    <a
      href={item.href}
      className={`${baseClasses} ${stateClasses}`}
      aria-current={item.active ? 'page' : undefined}
    >
      {/* Icon with Badge */}
      <div className="relative">
        <span className="w-6 h-6 flex items-center justify-center" aria-hidden="true">
          {item.icon}
        </span>
        
        {item.badge !== undefined && (
          <span
            className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-error-500 text-white min-w-[18px] text-center"
            aria-label={`${item.badge} notifications`}
          >
            {item.badge}
          </span>
        )}
      </div>
      
      {/* Label */}
      <span className="mt-1">{item.label}</span>
    </a>
  );
}
