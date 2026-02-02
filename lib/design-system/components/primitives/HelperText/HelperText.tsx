import React from 'react';

export interface HelperTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const HelperText = React.forwardRef<HTMLParagraphElement, HelperTextProps>(
  (
    {
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'text-sm text-gray-500 mt-1';
    const helperTextClasses = `${baseStyles} ${className}`;

    return (
      <p ref={ref} className={helperTextClasses} {...props}>
        {children}
      </p>
    );
  }
);

HelperText.displayName = 'HelperText';
