import { useState, useEffect, useCallback } from 'react';
import { NotificationService, Notification } from '../services/notificationService';
import RealTimeNotificationService, { RealTimeNotificationOptions } from '../services/realTimeNotificationService';

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
  isRealTimeConnected: boolean;
  testNotification: () => Promise<void>;
  connectionStatus: {
    state: 'disconnected' | 'connecting' | 'connected' | 'error';
    subscriptions: number;
    retryAttempts: { [key: string]: number };
  };
  forceReconnect: () => Promise<void>;
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
    realTime?: boolean;
    playSound?: boolean;
    showBrowserNotification?: boolean;
    vibrate?: boolean;
  }
): UseNotificationsResult => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    state: 'disconnected' as 'disconnected' | 'connecting' | 'connected' | 'error',
    subscriptions: 0,
    retryAttempts: {} as { [key: string]: number }
  });

  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    limit = 50,
    realTime = true,
    playSound = true,
    showBrowserNotification = true,
    vibrate = true
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
   * Send a test notification
   */
  const testNotification = useCallback(async () => {
    try {
      const result = await RealTimeNotificationService.testNotification(userId, 'system');
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error sending test notification:', err);
      setError('Failed to send test notification');
    }
  }, [userId]);

  /**
   * Force reconnection of real-time notifications
   */
  const forceReconnect = useCallback(async () => {
    try {
      setError(null);
      setIsRealTimeConnected(false);
      
      const result = await RealTimeNotificationService.forceReconnect();
      if (result.success) {
        // Re-initialize subscriptions after reconnect
        await fetchNotifications();
        setIsRealTimeConnected(true);
      } else {
        setError(result.error || 'Failed to reconnect');
        setIsRealTimeConnected(false);
      }
    } catch (err) {
      console.error('Error forcing reconnect:', err);
      setError('Failed to force reconnect');
      setIsRealTimeConnected(false);
    }
  }, [fetchNotifications]);

  /**
   * Update connection status periodically
   */
  useEffect(() => {
    const updateConnectionStatus = () => {
      const status = RealTimeNotificationService.getConnectionStatus();
      setConnectionStatus(status);
      setIsRealTimeConnected(status.state === 'connected');
    };

    // Update immediately
    updateConnectionStatus();
    
    // Update every 5 seconds
    const interval = setInterval(updateConnectionStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  /**
   * Set up real-time subscription with error handling
   */
  useEffect(() => {
    if (!userId) return;

    let isSubscriptionActive = true;

    // Initial fetch with error handling
    fetchNotifications().catch(err => {
      console.error('Initial notification fetch failed:', err);
      if (isSubscriptionActive) {
        setError('Failed to load notifications');
      }
    });

    let realtimeUnsubscribe: (() => void) | null = null;

    // Set up real-time subscription if enabled
    if (realTime) {
      // Initialize real-time service with better error handling
      RealTimeNotificationService.initialize()
        .then(({ success, error }) => {
          if (!isSubscriptionActive) return; // Component unmounted
          
          if (success) {
            setIsRealTimeConnected(true);
            setError(null); // Clear any previous errors
          
          // Subscribe to real-time notifications
          const { unsubscribe: realTimeUnsub } = RealTimeNotificationService.subscribeToUserNotifications(
            userId,
            {
              onNotificationReceived: (notification) => {
                try {
                  // Add new notification to the beginning of the list
                  setNotifications(prev => [notification, ...prev]);
                  
                  // Update unread count
                  if (!notification.is_read) {
                    setUnreadCount(prev => prev + 1);
                  }
                } catch (err) {
                  console.error('Error handling received notification:', err);
                }
              },
              onNotificationUpdated: (notification) => {
                try {
                  setNotifications(prev => 
                    prev.map(n => n.id === notification.id ? notification : n)
                  );
                  
                  // Update unread count if read status changed
                  if (notification.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                  }
                } catch (err) {
                  console.error('Error handling updated notification:', err);
                }
              },
              onNotificationDeleted: (notificationId) => {
                try {
                  const deletedNotification = notifications.find(n => n.id === notificationId);
                  setNotifications(prev => prev.filter(n => n.id !== notificationId));
                  
                  // Update unread count if deleted notification was unread
                  if (deletedNotification && !deletedNotification.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                  }
                } catch (err) {
                  console.error('Error handling deleted notification:', err);
                }
              },
              playSound,
              showBrowserNotification,
              vibrate
            }
          );
          
          realtimeUnsubscribe = realTimeUnsub;
          } else {
            console.warn('Failed to initialize real-time notifications:', error);
            setIsRealTimeConnected(false);
            // Don't set error for real-time failures, fall back to polling
          }
        })
        .catch(err => {
          console.error('Error initializing real-time notifications:', err);
          setIsRealTimeConnected(false);
          // Don't set error for real-time failures, fall back to polling
        });
    } else {
      // Fallback to legacy subscription
      const { unsubscribe: legacyUnsub } = NotificationService.subscribeToNotifications(
        userId,
        (notification) => {
          setNotifications(prev => [notification, ...prev]);
          
          if (!notification.is_read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      );
      
      realtimeUnsubscribe = legacyUnsub;
    }

    setUnsubscribe(() => realtimeUnsubscribe);

    // Cleanup subscription on unmount
    return () => {
      isSubscriptionActive = false;
      if (realtimeUnsubscribe) {
        try {
          realtimeUnsubscribe();
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
      }
      setIsRealTimeConnected(false);
    };
  }, [userId, realTime, playSound, showBrowserNotification, vibrate]); // Removed fetchNotifications and notifications from dependencies

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
    refresh,
    isRealTimeConnected,
    testNotification,
    connectionStatus,
    forceReconnect
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