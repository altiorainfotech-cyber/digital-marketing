import React from 'react';

export interface SidebarItem {
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

export interface SidebarProps {
  /**
   * Navigation items
   */
  items: SidebarItem[];
  /**
   * Logo or branding element
   */
  logo?: React.ReactNode;
  /**
   * Footer content
   */
  footer?: React.ReactNode;
  /**
   * Whether the sidebar is collapsed
   */
  collapsed?: boolean;
  /**
   * Callback when collapse state changes
   */
  onCollapsedChange?: (collapsed: boolean) => void;
  /**
   * Whether to show on mobile (hidden by default on mobile)
   */
  showOnMobile?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Sidebar component provides persistent navigation for admin and dashboard layouts.
 * Supports icons, badges, active states, and collapsible behavior.
 */
export function Sidebar({
  items,
  logo,
  footer,
  collapsed = false,
  onCollapsedChange,
  showOnMobile = false,
  className = '',
}: SidebarProps) {
  return (
    <aside
      className={`flex flex-col h-full bg-[#1f1f1f] border-r border-neutral-700 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } ${showOnMobile ? '' : 'hidden md:flex'} ${className}`}
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      {logo && (
        <div className="flex items-center h-16 px-4 border-b border-neutral-700">
          {logo}
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4" aria-label="Main navigation">
        <ul className="space-y-1 px-2">
          {items.map((item) => (
            <li key={item.id}>
              <SidebarLink item={item} collapsed={collapsed} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {footer && (
        <div className="border-t border-neutral-700 p-4">
          {footer}
        </div>
      )}
    </aside>
  );
}

/**
 * SidebarLink component - individual navigation link
 */
interface SidebarLinkProps {
  item: SidebarItem;
  collapsed: boolean;
}

function SidebarLink({ item, collapsed }: SidebarLinkProps) {
  const baseClasses = `
    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
    transition-colors duration-150
    ${collapsed ? 'justify-center' : ''}
  `;

  const stateClasses = item.disabled
    ? 'text-neutral-500 cursor-not-allowed'
    : item.active
    ? 'bg-[#2663eb]/20 text-white border-l-4 border-[#2663eb]'
    : 'text-white hover:bg-[#2a2a2a]';

  const content = (
    <>
      {item.icon && (
        <span className="flex-shrink-0 w-5 h-5" aria-hidden="true">
          {item.icon}
        </span>
      )}
      
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          
          {item.badge !== undefined && (
            <span
              className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-[#2663eb] text-white"
              aria-label={`${item.badge} items`}
            >
              {item.badge}
            </span>
          )}
        </>
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
      title={collapsed ? item.label : undefined}
    >
      {content}
    </a>
  );
}
