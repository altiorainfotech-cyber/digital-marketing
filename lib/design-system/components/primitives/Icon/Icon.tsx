import React from 'react';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 16 | 20 | 24 | 32;
  color?: string;
  children: React.ReactNode;
}

export const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  (
    {
      size = 24,
      color,
      className = '',
      children,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center flex-shrink-0';
    const iconClasses = `${baseStyles} ${className}`;

    const iconStyle = {
      width: `${size}px`,
      height: `${size}px`,
      color: color,
      ...style,
    };

    // Clone the child element and pass size props if it's a valid React element
    const childWithProps = React.isValidElement(children)
      ? React.cloneElement(children as React.ReactElement<any>, {
          size,
          ...(children.props || {}),
        })
      : children;

    return (
      <span
        ref={ref}
        className={iconClasses}
        style={iconStyle}
        {...props}
      >
        {childWithProps}
      </span>
    );
  }
);

Icon.displayName = 'Icon';
