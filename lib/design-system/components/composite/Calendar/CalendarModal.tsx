/**
 * CalendarModal Component
 * 
 * Modal wrapper for the Calendar component with backdrop and animations
 * 
 * Requirements: 26.2, 26.3, 26.14, 26.15
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Calendar, CalendarProps } from './Calendar';
import { Button } from '../../primitives/Button';

export interface CalendarModalProps extends Omit<CalendarProps, 'className'> {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when the modal should close
   */
  onClose: () => void;
  /**
   * Modal title
   */
  title?: string;
}

/**
 * CalendarModal - Modal wrapper for Calendar component
 */
export function CalendarModal({
  isOpen,
  onClose,
  title = 'Select a Day',
  onDateSelect,
  ...calendarProps
}: CalendarModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle date selection and close modal
  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transition-all duration-300 animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            id="calendar-modal-title"
            className="text-xl font-semibold text-gray-900"
          >
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            icon={<X className="w-5 h-5" />}
            aria-label="Close calendar"
          />
        </div>

        {/* Calendar */}
        <Calendar
          {...calendarProps}
          onDateSelect={handleDateSelect}
        />
      </div>
    </div>
  );
}
