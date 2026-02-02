import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  showIcon?: boolean;
}

export const ErrorMessage = React.forwardRef<HTMLDivElement, ErrorMessageProps>(
  (
    {
      showIcon = true,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'flex items-start gap-1.5 text-sm text-red-500 mt-1';
    const errorMessageClasses = `${baseStyles} ${className}`;

    return (
      <div ref={ref} className={errorMessageClasses} {...props}>
        {showIcon && (
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
        )}
        <span>{children}</span>
      </div>
    );
  }
);

ErrorMessage.displayName = 'ErrorMessage';
