import React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      required = false,
      disabled = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'block text-sm font-medium transition-colors duration-200';
    const colorStyles = disabled ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300';
    const labelClasses = `${baseStyles} ${colorStyles} ${className}`;

    return (
      <label ref={ref} className={labelClasses} {...props}>
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';
