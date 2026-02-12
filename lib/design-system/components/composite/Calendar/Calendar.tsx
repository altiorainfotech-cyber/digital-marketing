/**
 * Calendar Component
 * 
 * Interactive calendar for date selection with month/year navigation
 * 
 * Requirements: 26.4, 26.5, 26.6, 26.7, 26.8, 26.9, 26.14, 26.16
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../primitives/Button';

export interface CalendarProps {
  /**
   * Currently selected date
   */
  selectedDate?: Date;
  /**
   * Callback when a date is selected
   */
  onDateSelect: (date: Date) => void;
  /**
   * Minimum selectable date
   */
  minDate?: Date;
  /**
   * Maximum selectable date
   */
  maxDate?: Date;
  /**
   * Dates to disable
   */
  disabledDates?: Date[];
  /**
   * Dates to highlight
   */
  highlightedDates?: Date[];
  /**
   * Dates with assets (shows icon indicator)
   */
  datesWithAssets?: Date[];
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Get the days in a month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
 */
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is disabled
 */
function isDateDisabled(
  date: Date,
  minDate?: Date,
  maxDate?: Date,
  disabledDates?: Date[]
): boolean {
  if (minDate && date < minDate) return true;
  if (maxDate && date > maxDate) return true;
  if (disabledDates?.some(d => isSameDay(d, date))) return true;
  return false;
}

/**
 * Calendar component for date selection
 */
export function Calendar({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDates,
  highlightedDates,
  datesWithAssets,
  className = '',
}: CalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Calculate calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Generate calendar dates
  const calendarDates: (Date | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startOffset; i++) {
    calendarDates.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDates.push(new Date(currentYear, currentMonth, day));
  }

  // Navigation handlers
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, date: Date | null) => {
    if (!date) return;

    let newDate: Date | null = null;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newDate = new Date(date);
        newDate.setDate(date.getDate() - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newDate = new Date(date);
        newDate.setDate(date.getDate() + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newDate = new Date(date);
        newDate.setDate(date.getDate() - 7);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newDate = new Date(date);
        newDate.setDate(date.getDate() + 7);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isDateDisabled(date, minDate, maxDate, disabledDates)) {
          onDateSelect(date);
        }
        return;
      default:
        return;
    }

    if (newDate) {
      // Update month/year if needed
      if (newDate.getMonth() !== currentMonth || newDate.getFullYear() !== currentYear) {
        setCurrentMonth(newDate.getMonth());
        setCurrentYear(newDate.getFullYear());
      }
      setFocusedDate(newDate);
    }
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (!isDateDisabled(date, minDate, maxDate, disabledDates)) {
      onDateSelect(date);
    }
  };

  return (
    <div className={`bg-white rounded-lg ${className}`} role="application" aria-label="Calendar">
      {/* Header with Month/Year and Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          icon={<ChevronLeft className="w-4 h-4" />}
          aria-label="Previous month"
        />
        
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextMonth}
          icon={<ChevronRight className="w-4 h-4" />}
          aria-label="Next month"
        />
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-2"
            aria-label={day}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDates.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const isToday = isSameDay(date, today);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isDisabled = isDateDisabled(date, minDate, maxDate, disabledDates);
          const isHighlighted = highlightedDates?.some(d => isSameDay(d, date));
          const hasAssets = datesWithAssets?.some(d => isSameDay(d, date));
          const isFocused = focusedDate && isSameDay(date, focusedDate);

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(date)}
              onKeyDown={(e) => handleKeyDown(e, date)}
              disabled={isDisabled}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium
                transition-all duration-200 relative
                ${isDisabled 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-900 hover:bg-gray-100 cursor-pointer'
                }
                ${isSelected 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : ''
                }
                ${isToday && !isSelected 
                  ? 'ring-2 ring-blue-600 ring-inset' 
                  : ''
                }
                ${isHighlighted && !isSelected 
                  ? 'bg-blue-50' 
                  : ''
                }
                ${hasAssets && !isSelected
                  ? 'bg-blue-50'
                  : ''
                }
                ${isFocused && !isSelected
                  ? 'ring-2 ring-blue-400 ring-offset-2'
                  : ''
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
              aria-label={`${date.toLocaleDateString()}${isSelected ? ', selected' : ''}${isToday ? ', today' : ''}${hasAssets ? ', has assets' : ''}`}
              aria-current={isToday ? 'date' : undefined}
              aria-disabled={isDisabled}
              tabIndex={isToday || isSelected ? 0 : -1}
            >
              <span>{date.getDate()}</span>
              {hasAssets && (
                <svg 
                  className={`w-3 h-3 mt-0.5 ${isSelected ? 'text-white' : 'text-blue-600'}`}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
              )}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
