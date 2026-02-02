import React from 'react';
import { X } from 'lucide-react';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  onRemove?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      variant = 'default',
      size = 'md',
      onRemove,
      disabled = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full transition-colors duration-200';

    // Variant styles
    const variantStyles = {
      default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      primary: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      success: 'bg-green-100 text-green-800 hover:bg-green-200',
      warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      error: 'bg-red-100 text-red-800 hover:bg-red-200',
    };

    // Size styles
    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };

    // Disabled styles
    const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

    const chipClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`;

    // Remove button size based on chip size
    const removeIconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;

    return (
      <div ref={ref} className={chipClasses} {...props}>
        <span>{children}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="flex-shrink-0 hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current rounded-full transition-opacity duration-200 disabled:cursor-not-allowed"
            aria-label="Remove"
          >
            <X size={removeIconSize} />
          </button>
        )}
      </div>
    );
  }
);

Chip.displayName = 'Chip';
