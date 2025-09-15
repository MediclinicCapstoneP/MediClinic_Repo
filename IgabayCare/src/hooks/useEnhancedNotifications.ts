import { useState, useEffect, useCallback } from 'react';
import { EnhancedNotificationService, EnhancedNotificationFilters, NotificationStats } from '../services/enhancedNotificationService';
import { Notification } from '../services/notificationService';

interface UseEnhancedNotificationsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  filters?: EnhancedNotificationFilters;
  realTime?: boolean;
}

interface UseEnhancedNotificationsResult {
  notifications: Notification[];
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markMultipleAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (notificationId: string) => Promise<void>;
  dismissMultiple: (notificationIds: string[]) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  updateFilters: (newFilters: EnhancedNotificationFilters) => void;
  createAppointmentNotification: (
    appointmentId: string,
    type: 'appointment_confirmed' | 'appointment_reminder' | 'appointment_cancelled' | 'appointment_completed',
    customData?: any
  ) => Promise<void>;
  createSystemNotification: (title: string, message: string, options?: any) => Promise<void>;
}

export const useEnhancedNotifications = (
  userId: string,
  options: UseEnhancedNotificationsOptions = {}
): UseEnhancedNotificationsResult => {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    filters: initialFilters = { limit: 20, offset: 0 },
    realTime = true
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<EnhancedNotificationFilters>(initialFilters);
  const [subscription, setSubscription] = useState<{ unsubscribe: () => void } | null>(null);

  // Fetch notifications with current filters
  const fetchNotifications = useCallback(async (isLoadMore = false) => {
    if (!userId) return;

    try {
      if (!isLoadMore) {
        setLoading(true);
        setError(null);
      }

      const currentFilters = isLoadMore 
        ? { ...filters, offset: notifications.length }
        : filters;

      const result = await EnhancedNotificationService.getNotifications(userId, currentFilters);

      if (result.success) {
        const newNotifications = result.notifications || [];
        
        if (isLoadMore) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }

        // Check if there are more notifications to load
        setHasMore(newNotifications.length === (currentFilters.limit || 20));
      } else {
        setError(result.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      if (!isLoadMore) {
        setLoading(false);
      }
    }
  }, [userId, filters, notifications.length]);

  // Fetch notification statistics
  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await EnhancedNotificationService.getNotificationStats(userId);
      if (result.success) {
        setStats(result.stats || null);
      }
    } catch (err) {
      console.error('Error fetching notification stats:', err);
    }
  }, [userId]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const result = await EnhancedNotificationService.markMultipleAsRead([notificationId]);
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        
        // Update stats
        setStats(prev => prev ? {
          ...prev,
          unread: Math.max(0, prev.unread - 1)
        } : null);
      } else {
        setError(result.error || 'Failed to mark notification as read');
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    }
  }, []);

  // Mark multiple notifications as read
  const markMultipleAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const result = await EnhancedNotificationService.markMultipleAsRead(notificationIds);
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => notificationIds.includes(n.id) ? { ...n, is_read: true } : n)
        );
        
        // Update stats
        const unreadCount = notifications.filter(n => notificationIds.includes(n.id) && !n.is_read).length;
        setStats(prev => prev ? {
          ...prev,
          unread: Math.max(0, prev.unread - unreadCount)
        } : null);
      } else {
        setError(result.error || 'Failed to mark notifications as read');
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError('Failed to mark notifications as read');
    }
  }, [notifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const result = await EnhancedNotificationService.markMultipleAsRead(unreadIds);
      
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setStats(prev => prev ? { ...prev, unread: 0 } : null);
      } else {
        setError(result.error || 'Failed to mark all notifications as read');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  }, [notifications]);

  // Dismiss notification
  const dismiss = useCallback(async (notificationId: string) => {
    try {
      const result = await EnhancedNotificationService.deleteMultiple([notificationId]);
      
      if (result.success) {
        const dismissedNotification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Update stats
        if (dismissedNotification) {
          setStats(prev => prev ? {
            ...prev,
            total: prev.total - 1,
            unread: dismissedNotification.is_read ? prev.unread : Math.max(0, prev.unread - 1)
          } : null);
        }
      } else {
        setError(result.error || 'Failed to dismiss notification');
      }
    } catch (err) {
      console.error('Error dismissing notification:', err);
      setError('Failed to dismiss notification');
    }
  }, [notifications]);

  // Dismiss multiple notifications
  const dismissMultiple = useCallback(async (notificationIds: string[]) => {
    try {
      const result = await EnhancedNotificationService.deleteMultiple(notificationIds);
      
      if (result.success) {
        const dismissedNotifications = notifications.filter(n => notificationIds.includes(n.id));
        setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
        
        // Update stats
        const unreadCount = dismissedNotifications.filter(n => !n.is_read).length;
        setStats(prev => prev ? {
          ...prev,
          total: prev.total - dismissedNotifications.length,
          unread: Math.max(0, prev.unread - unreadCount)
        } : null);
      } else {
        setError(result.error || 'Failed to dismiss notifications');
      }
    } catch (err) {
      console.error('Error dismissing notifications:', err);
      setError('Failed to dismiss notifications');
    }
  }, [notifications]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(false), fetchStats()]);
  }, [fetchNotifications, fetchStats]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await fetchNotifications(true);
    }
  }, [hasMore, loading, fetchNotifications]);

  // Update filters
  const updateFilters = useCallback((newFilters: EnhancedNotificationFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
    setHasMore(true);
  }, []);

  // Create appointment notification
  const createAppointmentNotification = useCallback(async (
    appointmentId: string,
    type: 'appointment_confirmed' | 'appointment_reminder' | 'appointment_cancelled' | 'appointment_completed',
    customData?: any
  ) => {
    try {
      const result = await EnhancedNotificationService.createAppointmentNotification(
        userId,
        appointmentId,
        type,
        customData
      );
      
      if (result.success && result.notification) {
        setNotifications(prev => [result.notification!, ...prev]);
        setStats(prev => prev ? {
          ...prev,
          total: prev.total + 1,
          unread: prev.unread + 1
        } : null);
      } else {
        setError(result.error || 'Failed to create appointment notification');
      }
    } catch (err) {
      console.error('Error creating appointment notification:', err);
      setError('Failed to create appointment notification');
    }
  }, [userId]);

  // Create system notification
  const createSystemNotification = useCallback(async (
    title: string,
    message: string,
    options?: any
  ) => {
    try {
      const result = await EnhancedNotificationService.createSystemNotification(
        userId,
        title,
        message,
        options
      );
      
      if (result.success && result.notification) {
        setNotifications(prev => [result.notification!, ...prev]);
        setStats(prev => prev ? {
          ...prev,
          total: prev.total + 1,
          unread: prev.unread + 1
        } : null);
      } else {
        setError(result.error || 'Failed to create system notification');
      }
    } catch (err) {
      console.error('Error creating system notification:', err);
      setError('Failed to create system notification');
    }
  }, [userId]);

  // Initial load and setup
  useEffect(() => {
    if (userId) {
      fetchNotifications(false);
      fetchStats();
    }
  }, [userId, filters, fetchNotifications, fetchStats]);

  // Setup real-time subscription
  useEffect(() => {
    if (!userId || !realTime) return;

    const sub = EnhancedNotificationService.subscribeToNotifications(userId, (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case 'INSERT':
          if (newRecord) {
            setNotifications(prev => [newRecord, ...prev]);
            setStats(prev => prev ? {
              ...prev,
              total: prev.total + 1,
              unread: prev.unread + (newRecord.is_read ? 0 : 1)
            } : null);
          }
          break;

        case 'UPDATE':
          if (newRecord) {
            setNotifications(prev => 
              prev.map(n => n.id === newRecord.id ? newRecord : n)
            );
            
            // Update stats if read status changed
            if (oldRecord && oldRecord.is_read !== newRecord.is_read) {
              setStats(prev => prev ? {
                ...prev,
                unread: newRecord.is_read 
                  ? Math.max(0, prev.unread - 1)
                  : prev.unread + 1
              } : null);
            }
          }
          break;

        case 'DELETE':
          if (oldRecord) {
            setNotifications(prev => prev.filter(n => n.id !== oldRecord.id));
            setStats(prev => prev ? {
              ...prev,
              total: prev.total - 1,
              unread: oldRecord.is_read ? prev.unread : Math.max(0, prev.unread - 1)
            } : null);
          }
          break;
      }
    });

    setSubscription(sub);

    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [userId, realTime]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(() => {
      fetchStats(); // Only refresh stats, real-time handles notifications
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, userId, fetchStats]);

  return {
    notifications,
    stats,
    loading,
    error,
    hasMore,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    dismiss,
    dismissMultiple,
    refresh,
    loadMore,
    updateFilters,
    createAppointmentNotification,
    createSystemNotification
  };
};

export default useEnhancedNotifications;
