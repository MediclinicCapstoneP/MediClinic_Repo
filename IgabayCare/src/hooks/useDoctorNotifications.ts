import { useState, useEffect, useCallback } from 'react';
import { DoctorNotificationService, DoctorNotification } from '../services/doctorNotificationService';

interface UseDoctorNotificationsResult {
  notifications: DoctorNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
  createAppointmentNotification: (params: {
    appointmentId: string;
    type: 'appointment_confirmed' | 'appointment_cancelled' | 'appointment_reminder';
    patientName: string;
    appointmentTime: string;
    clinicId: string;
  }) => Promise<void>;
}

/**
 * Custom hook for managing doctor notifications with real-time updates
 */
export const useDoctorNotifications = (
  doctorUserId: string,
  options?: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    limit?: number;
  }
): UseDoctorNotificationsResult => {
  const [notifications, setNotifications] = useState<DoctorNotification[]>([]);
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
    if (!doctorUserId) return;

    try {
      setLoading(true);
      setError(null);

      const { notifications: fetchedNotifications, error: fetchError } = 
        await DoctorNotificationService.getDoctorNotifications(doctorUserId, {
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
      console.error('Error fetching doctor notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [doctorUserId, limit]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { success, error: markError } = await DoctorNotificationService.markAsRead(notificationId);
      
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
      const { success, error: markError } = await DoctorNotificationService.markAllAsRead(doctorUserId);
      
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
  }, [doctorUserId]);

  /**
   * Dismiss (delete) a notification
   */
  const dismiss = useCallback(async (notificationId: string) => {
    try {
      const { success, error: dismissError } = await DoctorNotificationService.deleteNotification(notificationId);
      
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
   * Create appointment notification
   */
  const createAppointmentNotification = useCallback(async (params: {
    appointmentId: string;
    type: 'appointment_confirmed' | 'appointment_cancelled' | 'appointment_reminder';
    patientName: string;
    appointmentTime: string;
    clinicId: string;
  }) => {
    try {
      const { notification, error: createError } = await DoctorNotificationService.createAppointmentNotificationForDoctor({
        doctorUserId,
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
      console.error('Error creating appointment notification:', err);
      setError('Failed to create appointment notification');
    }
  }, [doctorUserId]);

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
    if (!doctorUserId) return;

    // Initial fetch
    fetchNotifications();

    // Set up real-time subscription
    DoctorNotificationService.subscribeToNotifications(
      doctorUserId,
      () => {
        // Refresh notifications when new ones arrive
        fetchNotifications();
      }
    );
  }, [doctorUserId, fetchNotifications]);

  /**
   * Set up auto-refresh interval
   */
  useEffect(() => {
    if (!autoRefresh || !doctorUserId) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, doctorUserId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh,
    createAppointmentNotification
  };
};

export default useDoctorNotifications;
