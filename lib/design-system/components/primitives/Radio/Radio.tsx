import React from 'react';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

export const Radio: React.FC<RadioProps> = ({
  name,
  options,
  value,
  onChange,
  error,
  disabled = false,
  orientation = 'vertical',
}) => {
  const handleChange = (optionValue: string) => {
    if (onChange) {
      onChange(optionValue);
    }
  };

  const containerClasses = orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'flex flex-col gap-2';

  return (
    <div>
      <div className={containerClasses}>
        {options.map((option) => {
          const radioId = `${name}-${option.value}`;
          const isChecked = value === option.value;
          const isDisabled = disabled || option.disabled;

          // Base radio styles
          const baseRadioStyles = 'w-5 h-5 border-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

          // State styles
          const stateStyles = error
            ? 'border-red-500 focus:ring-red-200'
            : isChecked
            ? 'border-blue-600 focus:ring-blue-200'
            : 'border-gray-300 bg-white focus:ring-blue-200 hover:border-blue-400';

          const radioClasses = `${baseRadioStyles} ${stateStyles}`;

          return (
            <div key={option.value} className="flex items-center">
              <div className="relative flex items-center">
                <input
                  type="radio"
                  id={radioId}
                  name={name}
                  value={option.value}
                  checked={isChecked}
                  onChange={() => handleChange(option.value)}
                  disabled={isDisabled}
                  className="sr-only"
                />
                <label
                  htmlFor={radioId}
                  className={radioClasses}
                >
                  {isChecked && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                    </span>
                  )}
                </label>
              </div>

              <label
                htmlFor={radioId}
                className={`ml-2 text-sm text-gray-700 cursor-pointer ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

Radio.displayName = 'Radio';
