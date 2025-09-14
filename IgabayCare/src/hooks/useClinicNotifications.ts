import { useState, useEffect, useCallback } from 'react';
import { ClinicNotificationService, ClinicNotification } from '../services/clinicNotificationService';

interface UseClinicNotificationsResult {
  notifications: ClinicNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
  createNewAppointmentNotification: (params: {
    appointmentId: string;
    patientName: string;
    doctorName: string;
    appointmentTime: string;
    amount: number;
  }) => Promise<void>;
  createRevenueMilestoneNotification: (milestone: number, period: 'daily' | 'weekly' | 'monthly') => Promise<void>;
}

/**
 * Custom hook for managing clinic notifications with real-time updates
 */
export const useClinicNotifications = (
  clinicUserId: string,
  options?: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    limit?: number;
  }
): UseClinicNotificationsResult => {
  const [notifications, setNotifications] = useState<ClinicNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    limit = 50
  } = options || {};

  /**
   * Fetch notifications from the service
   */
  const fetchNotifications = useCallback(async () => {
    if (!clinicUserId) return;

    try {
      setLoading(true);
      setError(null);

      const { notifications: fetchedNotifications, error: fetchError } = 
        await ClinicNotificationService.getClinicNotifications(clinicUserId, {
          limit,
          unreadOnly: false
        });

      if (fetchError) {
        setError(fetchError);
        return;
      }

      setNotifications(fetchedNotifications || []);

      // Count unread notifications
      const unread = fetchedNotifications?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching clinic notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [clinicUserId, limit]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { success, error: markError } = await ClinicNotificationService.markAsRead(notificationId);
      
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

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const { success, error: markError } = await ClinicNotificationService.markAllAsRead(clinicUserId);
      
      if (success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      } else if (markError) {
        throw new Error(markError);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  }, [clinicUserId]);

  /**
   * Dismiss (delete) a notification
   */
  const dismiss = useCallback(async (notificationId: string) => {
    try {
      const { success, error: dismissError } = await ClinicNotificationService.deleteNotification(notificationId);
      
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

  /**
   * Create new appointment notification
   */
  const createNewAppointmentNotification = useCallback(async (params: {
    appointmentId: string;
    patientName: string;
    doctorName: string;
    appointmentTime: string;
    amount: number;
  }) => {
    try {
      const { notification, error: createError } = await ClinicNotificationService.createNewAppointmentNotification({
        clinicUserId,
        ...params
      });

      if (createError) {
        throw new Error(createError);
      }

      if (notification) {
        setNotifications(prev => [notification, ...prev]);
        if (!notification.is_read) {
          setUnreadCount(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error('Error creating new appointment notification:', err);
      setError('Failed to create appointment notification');
    }
  }, [clinicUserId]);

  /**
   * Create revenue milestone notification
   */
  const createRevenueMilestoneNotification = useCallback(async (
    milestone: number,
    period: 'daily' | 'weekly' | 'monthly'
  ) => {
    try {
      const { notification, error: createError } = await ClinicNotificationService.createRevenueMilestoneNotification(
        clinicUserId,
        milestone,
        period
      );

      if (createError) {
        throw new Error(createError);
      }

      if (notification) {
        setNotifications(prev => [notification, ...prev]);
        if (!notification.is_read) {
          setUnreadCount(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error('Error creating revenue milestone notification:', err);
      setError('Failed to create revenue milestone notification');
    }
  }, [clinicUserId]);

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
    if (!clinicUserId) return;

    // Initial fetch
    fetchNotifications();

    // Set up real-time subscription
    ClinicNotificationService.subscribeToNotifications(
      clinicUserId,
      () => {
        // Refresh notifications when new ones arrive
        fetchNotifications();
      }
    );
  }, [clinicUserId, fetchNotifications]);

  /**
   * Set up auto-refresh interval
   */
  useEffect(() => {
    if (!autoRefresh || !clinicUserId) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, clinicUserId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh,
    createNewAppointmentNotification,
    createRevenueMilestoneNotification
  };
};

export default useClinicNotifications;
