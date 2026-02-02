/**
 * Notifications Page
 * 
 * Full notification list with filtering capabilities
 * Allows users to view, filter, and manage all their notifications
 * 
 * Requirements: 10.3, 10.4, 10.6, 10.8
 * 
 * Key Features:
 * - Display all notifications with pagination
 * - Filter tabs (All, Unread, Read)
 * - Mark all as read functionality
 * - Mark individual notifications as read
 * - Pagination support
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Upload, 
  CheckCircle, 
  XCircle, 
  Share2, 
  MessageSquare, 
  AlertTriangle,
  Bell,
  Loader2
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth';
import { useUser } from '@/lib/auth/hooks';
import { Icon } from '@/lib/design-system/components/primitives/Icon';
import { Button } from '@/lib/design-system/components/primitives/Button';
import { EmptyState } from '@/lib/design-system/components/patterns/EmptyState';
import { PageContainer } from '@/lib/design-system/components/patterns/PageContainer';
import { PageHeader } from '@/lib/design-system/components/patterns/PageHeader';
import { Breadcrumb } from '@/lib/design-system/components/composite/Breadcrumb';
import { Notification } from '@/types';

type FilterTab = 'all' | 'unread' | 'read';

function NotificationsContent() {
  const user = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (activeTab === 'unread') {
        params.append('isRead', 'false');
      } else if (activeTab === 'read') {
        params.append('isRead', 'true');
      }
      
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());

      const response = await fetch(`/api/notifications?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setTotalPages(Math.ceil((data.total || 0) / pageSize));
      } else {
        console.error('Failed to fetch notifications');
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
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Fetch notifications when filters or page change
  useEffect(() => {
    fetchNotifications();
  }, [activeTab, page]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  // Get notification type label
  const getTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <PageContainer>
        <PageHeader
          title="Notifications"
          breadcrumbs={
            <Breadcrumb
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Notifications' }
              ]}
            />
          }
        />

        <div className="mt-6 space-y-6">
          {/* Filter Tabs and Actions */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${activeTab === 'all'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                    }
                  `}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab('unread')}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${activeTab === 'unread'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                    }
                  `}
                >
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button
                  onClick={() => setActiveTab('read')}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${activeTab === 'read'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                    }
                  `}
                >
                  Read
                </button>
              </div>

              {/* Mark All as Read Button */}
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="px-4 py-12 flex flex-col items-center justify-center">
                <Icon size={32}>
                  <Loader2 className="animate-spin text-primary-500" />
                </Icon>
                <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-12">
                <EmptyState
                  icon={<Bell />}
                  title="No notifications"
                  message={
                    activeTab === 'unread' 
                      ? "You're all caught up! No unread notifications."
                      : "You don't have any notifications yet."
                  }
                />
              </div>
            ) : (
              <>
                <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {notifications.map((notification) => {
                    const IconComponent = getNotificationIcon(notification.type);
                    const iconColor = getIconColor(notification.type);
                    
                    return (
                      <li
                        key={notification.id}
                        className={`
                          px-6 py-4 
                          hover:bg-neutral-50 dark:hover:bg-neutral-700/50
                          transition-colors duration-150
                          ${!notification.isRead 
                            ? 'bg-primary-50/50 dark:bg-primary-900/10' 
                            : ''
                          }
                        `}
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`flex-shrink-0 ${iconColor}`}>
                            <Icon size={24}>
                              <IconComponent />
                            </Icon>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className={`
                                  text-base 
                                  ${!notification.isRead 
                                    ? 'font-semibold text-neutral-900 dark:text-neutral-100' 
                                    : 'font-medium text-neutral-700 dark:text-neutral-300'
                                  }
                                `}>
                                  {notification.title}
                                </p>
                                {notification.message && (
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                    {notification.message}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2">
                                  <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                    {formatDate(notification.createdAt)}
                                  </p>
                                  <span className="
                                    inline-flex items-center 
                                    px-2 py-0.5 rounded 
                                    text-xs font-medium 
                                    bg-neutral-100 dark:bg-neutral-700 
                                    text-neutral-800 dark:text-neutral-200
                                  ">
                                    {getTypeLabel(notification.type)}
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="
                                    flex-shrink-0
                                    text-sm font-medium
                                    text-primary-600 hover:text-primary-800
                                    dark:text-primary-400 dark:hover:text-primary-300
                                    transition-colors duration-150
                                  "
                                  title="Mark as read"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>

                            {/* Link to related resource */}
                            {notification.relatedResourceType === 'ASSET' && notification.relatedResourceId && (
                              <Link
                                href={`/assets/${notification.relatedResourceId}`}
                                className="
                                  inline-flex items-center mt-2 
                                  text-sm font-medium
                                  text-primary-600 hover:text-primary-800
                                  dark:text-primary-400 dark:hover:text-primary-300
                                "
                              >
                                View asset →
                              </Link>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Summary */}
          {!loading && notifications.length > 0 && (
            <div className="text-center text-sm text-neutral-600 dark:text-neutral-400">
              Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}
