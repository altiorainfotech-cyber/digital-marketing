/**
 * NotificationDropdown Component
 * 
 * Dropdown menu displaying recent notifications with smooth animations
 * 
 * Requirements: 10.2, 10.3, 10.4, 10.6, 10.7, 10.8
 * 
 * Key Features:
 * - Smooth slide-in animation
 * - Display recent notifications with icons, titles, messages, timestamps
 * - Distinguish unread notifications with styling
 * - Mark as read buttons
 * - View all link
 * - Empty state
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  Share2, 
  MessageSquare, 
  AlertTriangle,
  Bell,
  Loader2
} from 'lucide-react';
import { Icon } from '@/lib/design-system/components/primitives/Icon';
import { Button } from '@/lib/design-system/components/primitives/Button';
import { EmptyState } from '@/lib/design-system/components/patterns/EmptyState';
import { Notification } from '@/types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationDropdown({ 
  isOpen, 
  onClose,
  onUnreadCountChange 
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=5');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        const count = data.unreadCount || 0;
        setUnreadCount(count);
        onUnreadCountChange?.(count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
          )
        );
        const newCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newCount);
        onUnreadCountChange?.(newCount);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ASSET_UPLOADED':
        return Upload;
      case 'ASSET_APPROVED':
        return CheckCircle;
      case 'ASSET_REJECTED':
        return XCircle;
      case 'ASSET_SHARED':
        return Share2;
      case 'COMMENT_ADDED':
        return MessageSquare;
      case 'SYSTEM_ALERT':
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  // Get icon color based on type
  const getIconColor = (type: string) => {
    switch (type) {
      case 'ASSET_UPLOADED':
        return 'text-primary-500';
      case 'ASSET_APPROVED':
        return 'text-success-500';
      case 'ASSET_REJECTED':
        return 'text-error-500';
      case 'ASSET_SHARED':
        return 'text-info-500';
      case 'COMMENT_ADDED':
        return 'text-primary-500';
      case 'SYSTEM_ALERT':
        return 'text-warning-500';
      default:
        return 'text-neutral-500';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="
        absolute right-0 mt-2 w-96
        bg-white dark:bg-neutral-800
        rounded-lg shadow-xl
        ring-1 ring-black/5 dark:ring-white/10
        z-50
        animate-slide-in
        overflow-hidden
      "
      role="region"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="
        px-4 py-3 
        border-b border-neutral-200 dark:border-neutral-700
        flex items-center justify-between
      ">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Notifications
        </h3>
        {unreadCount > 0 && (
          <span className="
            px-2 py-1 
            text-xs font-medium 
            text-primary-700 dark:text-primary-300
            bg-primary-50 dark:bg-primary-900/30
            rounded-full
          ">
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-8 flex flex-col items-center justify-center text-neutral-500">
            <Icon size={32}>
              <Loader2 className="animate-spin" />
            </Icon>
            <p className="mt-2 text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState
              icon={<Bell />}
              title="No notifications"
              message="You're all caught up! Check back later for updates."
            />
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {notifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              const iconColor = getIconColor(notification.type);
              
              return (
                <li
                  key={notification.id}
                  className={`
                    px-4 py-3 
                    hover:bg-neutral-50 dark:hover:bg-neutral-700/50
                    transition-colors duration-150
                    ${!notification.isRead 
                      ? 'bg-primary-50/50 dark:bg-primary-900/10 font-medium' 
                      : ''
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 ${iconColor}`}>
                      <Icon size={20}>
                        <IconComponent />
                      </Icon>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`
                        text-sm 
                        ${!notification.isRead 
                          ? 'text-neutral-900 dark:text-neutral-100 font-semibold' 
                          : 'text-neutral-700 dark:text-neutral-300'
                        }
                      `}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="
                          text-sm text-neutral-600 dark:text-neutral-400 
                          mt-1 line-clamp-2
                        ">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Mark as Read Button */}
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="
                          flex-shrink-0 
                          text-xs font-medium
                          text-primary-600 hover:text-primary-800
                          dark:text-primary-400 dark:hover:text-primary-300
                          transition-colors duration-150
                        "
                        aria-label="Mark as read"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="
        px-4 py-3 
        border-t border-neutral-200 dark:border-neutral-700
        bg-neutral-50 dark:bg-neutral-800/50
      ">
        <Link
          href="/notifications"
          className="
            block text-center 
            text-sm font-medium 
            text-primary-600 hover:text-primary-800
            dark:text-primary-400 dark:hover:text-primary-300
            transition-colors duration-150
          "
          onClick={onClose}
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
