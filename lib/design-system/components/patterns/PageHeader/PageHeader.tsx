import React from 'react';

export interface PageHeaderProps {
  /**
   * Page title
   */
  title: string;
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  /**
   * Action buttons or elements to display on the right
   */
  actions?: React.ReactNode;
  /**
   * Breadcrumb navigation
   */
  breadcrumbs?: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * PageHeader component provides consistent page title and action layout.
 * Displays title, optional subtitle, and action buttons.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`mb-6 ${className}`}>
      {breadcrumbs && (
        <nav className="mb-3" aria-label="Breadcrumb">
          {breadcrumbs}
        </nav>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              {subtitle}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
