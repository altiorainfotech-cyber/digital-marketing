/**
 * CalendarFilter Component
 * 
 * Calendar filter integration for asset management
 * 
 * Requirements: 26.1, 26.2, 26.9, 26.10, 26.11, 26.12, 26.13, 26.18
 */

'use client';

import React, { useState } from 'react';
import { CalendarModal } from '@/lib/design-system/components/composite/Calendar';
import { Button } from '@/lib/design-system/components/primitives/Button';
import { Badge } from '@/lib/design-system/components/primitives/Badge';
import { Calendar as CalendarIcon, X } from 'lucide-react';

export interface CalendarFilterProps {
  /**
   * Callback when a date is selected
   */
  onDateSelect: (date: Date | null) => void;
  /**
   * Currently selected date
   */
  selectedDate?: Date | null;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * CalendarFilter - Calendar filter integration for asset management
 */
export function CalendarFilter({ onDateSelect, selectedDate }: CalendarFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setIsCalendarOpen(false);
  };

  const handleClearDate = () => {
    onDateSelect(null);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Calendar Button */}
      <Button
        variant={selectedDate ? 'primary' : 'outline'}
        size="md"
        icon={<CalendarIcon className="w-4 h-4" />}
        onClick={() => setIsCalendarOpen(true)}
        aria-label="Filter by date"
      >
        {selectedDate ? formatDate(selectedDate) : 'Filter by Date'}
      </Button>

      {/* Clear Button */}
      {selectedDate && (
        <Button
          variant="ghost"
          size="sm"
          icon={<X className="w-4 h-4" />}
          onClick={handleClearDate}
          aria-label="Clear date filter"
        />
      )}

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate || undefined}
        onDateSelect={handleDateSelect}
        title="Select a Day"
      />
    </div>
  );
}
