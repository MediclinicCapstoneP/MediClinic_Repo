import { useState, useEffect, useCallback } from 'react';
import { NotificationService, Notification } from '../services/notificationService';

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing notifications with real-time updates
 * @param userId - The authenticated user's ID
 * @param options - Configuration options
 * @returns Notification management functions and state
 */
export const useNotifications = (
  userId: string,
  options?: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    limit?: number;
  }
): UseNotificationsResult => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    limit = 50
  } = options || {};

  /**
   * Fetch notifications from the service
   */
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch notifications
      const { notifications: fetchedNotifications, error: fetchError } = 
        await NotificationService.getNotifications(userId, {
          limit,
          unreadOnly: false
        });

      if (fetchError) {
        setError(fetchError);
        return;
      }

      setNotifications(fetchedNotifications || []);

      // Fetch unread count
      const { count, error: countError } = await NotificationService.getUnreadCount(userId);
      if (!countError) {
        setUnreadCount(count || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { success, error: markError } = await NotificationService.markAsRead(notificationId);
      
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else if (markError) {
        throw new Error(markError);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const { success, error: markError } = await NotificationService.markAllAsRead(userId);
      
      if (success) {
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      } else if (markError) {
        throw new Error(markError);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  }, [userId]);

  /**
   * Dismiss (delete) a notification
   */
  const dismiss = useCallback(async (notificationId: string) => {
    try {
      const { success, error: dismissError } = await NotificationService.deleteNotification(notificationId);
      
      if (success) {
        // Update local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Update unread count if the dismissed notification was unread
        const dismissedNotification = notifications.find(n => n.id === notificationId);
        if (dismissedNotification && !dismissedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else if (dismissError) {
        throw new Error(dismissError);
      }
    } catch (err) {
      console.error('Error dismissing notification:', err);
      setError('Failed to dismiss notification');
    }
  }, [notifications]);

  /**
   * Refresh notifications
   */
  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Set up real-time subscription
   */
  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchNotifications();

    // Set up real-time subscription
    const { unsubscribe: unsub } = NotificationService.subscribeToNotifications(
      userId,
      (notification) => {
        // Add new notification to the beginning of the list
        setNotifications(prev => [notification, ...prev]);
        
        // Update unread count
        if (!notification.is_read) {
          setUnreadCount(prev => prev + 1);
        }
      }
    );

    setUnsubscribe(() => unsub);

    // Cleanup subscription on unmount
    return () => {
      if (unsub) {
        unsub();
      }
    };
  }, [userId, fetchNotifications]);

  /**
   * Set up auto-refresh interval
   */
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh
  };
};

/**
 * Custom hook for managing appointment completion notifications specifically
 * @param userId - The authenticated user's ID
 * @returns Appointment completion notifications and management functions
 */
export const useAppointmentCompletionNotifications = (
  userId: string
): {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  dismiss: (notificationId: string) => Promise<void>;
  rateAppointment: (appointmentId: string) => void;
} => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchCompletionNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch only appointment completion notifications
        const { notifications: fetchedNotifications, error: fetchError } = 
          await NotificationService.getNotifications(userId, {
            type: 'appointment_completed',
            unreadOnly: false,
            limit: 20
          });

        if (fetchError) {
          setError(fetchError);
          return;
        }

        setNotifications(fetchedNotifications || []);

        // Count unread appointment completion notifications
        const unread = fetchedNotifications?.filter(n => !n.is_read).length || 0;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Error fetching appointment completion notifications:', err);
        setError('Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletionNotifications();
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { success, error: markError } = await NotificationService.markAsRead(notificationId);
      
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else if (markError) {
        throw new Error(markError);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    }
  }, []);

  const dismiss = useCallback(async (notificationId: string) => {
    try {
      const { success, error: dismissError } = await NotificationService.deleteNotification(notificationId);
      
      if (success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        const dismissedNotification = notifications.find(n => n.id === notificationId);
        if (dismissedNotification && !dismissedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else if (dismissError) {
        throw new Error(dismissError);
      }
    } catch (err) {
      console.error('Error dismissing notification:', err);
      setError('Failed to dismiss notification');
    }
  }, [notifications]);

  const rateAppointment = useCallback((appointmentId: string) => {
    // This would typically trigger opening the rating modal
    // Implementation depends on how the parent component handles this
    console.log('Rate appointment triggered for:', appointmentId);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    dismiss,
    rateAppointment
  };
};

export default useNotifications;