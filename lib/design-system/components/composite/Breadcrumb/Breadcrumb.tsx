import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Icon } from '../../primitives/Icon';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

export function Breadcrumb({
  items,
  separator,
  className = '',
  'data-testid': testId,
}: BreadcrumbProps) {
  const defaultSeparator = (
    <Icon size={16}>
      <ChevronRight />
    </Icon>
  );
  const separatorElement = separator ?? defaultSeparator;
  
  return (
    <nav
      className={`flex items-center gap-2 text-sm ${className}`}
      aria-label="Breadcrumb"
      data-testid={testId}
    >
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center gap-2">
              {item.href || item.onClick ? (
                <a
                  href={item.href}
                  onClick={item.onClick}
                  className={`
                    transition-colors duration-150
                    ${
                      isLast
                        ? 'text-neutral-900 dark:text-neutral-100 font-medium'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }
                  `}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={`
                    ${
                      isLast
                        ? 'text-neutral-900 dark:text-neutral-100 font-medium'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }
                  `}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              
              {!isLast && (
                <span className="text-neutral-400 dark:text-neutral-600" aria-hidden="true">
                  {separatorElement}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
