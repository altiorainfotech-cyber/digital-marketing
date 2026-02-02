import React from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  labelPosition?: 'left' | 'right';
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      error,
      labelPosition = 'right',
      className = '',
      disabled,
      checked,
      id,
      ...props
    },
    ref
  ) => {
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

    // Base switch track styles
    const baseTrackStyles = 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

    // Track color based on state
    const trackColorStyles = checked ? 'bg-blue-600' : 'bg-gray-300';

    const trackClasses = `${baseTrackStyles} ${trackColorStyles} ${className}`;

    // Toggle circle styles
    const toggleStyles = checked
      ? 'translate-x-6'
      : 'translate-x-1';

    const toggleClasses = `inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${toggleStyles}`;

    return (
      <div className="flex items-center">
        {label && labelPosition === 'left' && (
          <label
            htmlFor={switchId}
            className={`mr-3 text-sm text-gray-700 cursor-pointer ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {label}
          </label>
        )}

        <label
          htmlFor={switchId}
          className={trackClasses}
        >
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            className="sr-only"
            disabled={disabled}
            checked={checked}
            role="switch"
            aria-checked={checked}
            {...props}
          />
          <span className={toggleClasses} />
        </label>

        {label && labelPosition === 'right' && (
          <label
            htmlFor={switchId}
            className={`ml-3 text-sm text-gray-700 cursor-pointer ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {label}
          </label>
        )}

        {error && (
          <p className="ml-3 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
