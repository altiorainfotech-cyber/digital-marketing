/**
 * NotificationBell Component
 * 
 * Displays a notification bell icon with unread count badge
 * Provides a dropdown menu for recent notifications
 * 
 * Requirements: 10.1, 10.5
 * 
 * Key Features:
 * - Bell icon with unread count badge
 * - Animation for new notifications (pulse effect)
 * - Dropdown menu showing recent notifications
 * - Mark individual notifications as read
 * - Link to full notifications page
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Icon } from '@/lib/design-system/components/primitives/Icon';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  userId?: string;
  className?: string;
}

export function NotificationBell({ userId, className = '' }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const previousCountRef = useRef(0);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications?limit=1');
      if (response.ok) {
        const data = await response.json();
        const newCount = data.unreadCount || 0;
        
        // Trigger animation if count increased
        if (newCount > previousCountRef.current) {
          setHasNewNotification(true);
          setTimeout(() => setHasNewNotification(false), 1000);
        }
        
        previousCountRef.current = newCount;
        setUnreadCount(newCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Handle unread count change from dropdown
  const handleUnreadCountChange = (count: number) => {
    setUnreadCount(count);
    previousCountRef.current = count;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-full
          text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100
          dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          transition-all duration-150
          ${hasNewNotification ? 'animate-pulse' : ''}
        `}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icon size={24}>
          <Bell className={hasNewNotification ? 'animate-shake' : ''} />
        </Icon>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span
            className="
              absolute -top-1 -right-1
              inline-flex items-center justify-center
              min-w-[20px] h-5 px-1.5
              text-xs font-bold leading-none
              text-white bg-error-500
              rounded-full
              animate-scale-in
            "
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </div>
  );
}
