import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  labelType?: 'floating' | 'fixed';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      labelType = 'fixed',
      type = 'text',
      className = '',
      disabled,
      required,
      id,
      placeholder,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const isPasswordType = type === 'password';
    const actualType = isPasswordType && showPassword ? 'text' : type;

    // Base input styles
    const baseInputStyles = 'w-full px-4 py-2 text-base border rounded-lg transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100';

    // Border and focus styles
    const borderStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

    // Icon padding adjustments
    const iconPaddingStyles = icon && iconPosition === 'left' ? 'pl-10' : icon && iconPosition === 'right' ? 'pr-10' : '';
    const passwordPaddingStyles = isPasswordType ? 'pr-10' : '';

    // Floating label styles
    const floatingLabelStyles = labelType === 'floating' ? 'pt-6 pb-2' : '';

    const inputClasses = `${baseInputStyles} ${borderStyles} ${iconPaddingStyles} ${passwordPaddingStyles} ${floatingLabelStyles} ${className}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {/* Fixed Label */}
        {label && labelType === 'fixed' && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Floating Label */}
          {label && labelType === 'floating' && (
            <label
              htmlFor={inputId}
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                isFocused || hasValue
                  ? 'top-2 text-xs text-blue-600'
                  : 'top-1/2 -translate-y-1/2 text-base text-gray-400'
              }`}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            type={actualType}
            className={inputClasses}
            disabled={disabled}
            required={required}
            placeholder={labelType === 'floating' ? '' : placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />

          {/* Right Icon */}
          {icon && iconPosition === 'right' && !isPasswordType && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Password Toggle */}
          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>

        {/* Helper Text */}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{helperText}</p>
        )}

        {/* Error Message */}
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
