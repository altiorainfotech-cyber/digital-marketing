import React from 'react';
import { User } from 'lucide-react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  shape?: 'circle' | 'square';
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = 'Avatar',
      size = 'md',
      fallback,
      shape = 'circle',
      className = '',
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);

    const baseStyles = 'inline-flex items-center justify-center overflow-hidden bg-gray-200 text-gray-600 font-medium';

    // Size styles
    const sizeStyles = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg',
    };

    // Shape styles
    const shapeStyles = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

    const avatarClasses = `${baseStyles} ${sizeStyles[size]} ${shapeStyles} ${className}`;

    // Icon size based on avatar size
    const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 32;

    // Get initials from fallback text
    const getInitials = (text: string): string => {
      const words = text.trim().split(/\s+/);
      if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
      }
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    };

    const handleImageError = () => {
      setImageError(true);
    };

    return (
      <div ref={ref} className={avatarClasses} {...props}>
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : fallback ? (
          <span>{getInitials(fallback)}</span>
        ) : (
          <User size={iconSize} />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
