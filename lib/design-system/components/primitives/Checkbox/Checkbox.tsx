import React from 'react';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      indeterminate = false,
      className = '',
      disabled,
      id,
      checked,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    // Base checkbox styles
    const baseCheckboxStyles = 'w-5 h-5 border-2 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    // State styles
    const stateStyles = error
      ? 'border-red-500 focus:ring-red-200'
      : checked || indeterminate
      ? 'border-blue-600 bg-blue-600 focus:ring-blue-200'
      : 'border-gray-300 bg-white focus:ring-blue-200 hover:border-blue-400';

    const checkboxClasses = `${baseCheckboxStyles} ${stateStyles} ${className}`;

    return (
      <div className="flex items-start">
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="sr-only"
            disabled={disabled}
            checked={checked}
            aria-checked={indeterminate ? 'mixed' : checked}
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className={checkboxClasses}
          >
            {(checked || indeterminate) && (
              <span className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
                {indeterminate ? <Minus size={16} /> : <Check size={16} />}
              </span>
            )}
          </label>
        </div>

        {label && (
          <label
            htmlFor={checkboxId}
            className={`ml-2 text-sm text-gray-700 cursor-pointer ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {label}
          </label>
        )}

        {error && (
          <p className="ml-7 mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
