import { supabase } from '../supabaseClient';
import { Notification } from './notificationService';

export interface EnhancedNotificationFilters {
  type?: string[];
  priority?: string[];
  isRead?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  recentCount: number;
}

export class EnhancedNotificationService {
  /**
   * Get notifications with enhanced filtering and pagination
   */
  static async getNotifications(
    userId: string,
    filters?: EnhancedNotificationFilters
  ): Promise<{ success: boolean; notifications?: Notification[]; total?: number; error?: string }> {
    try {
      console.log('🔍 Fetching notifications for user:', userId, 'with filters:', filters);

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.type && filters.type.length > 0) {
        query = query.in('type', filters.type);
      }

      if (filters?.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }

      if (filters?.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }

      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      // Filter out expired notifications
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(
          filters.offset, 
          filters.offset + (filters.limit || 20) - 1
        );
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching notifications:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Fetched ${data?.length || 0} notifications`);
      return { 
        success: true, 
        notifications: data || [], 
        total: count || 0 
      };

    } catch (error) {
      console.error('❌ Unexpected error fetching notifications:', error);
      return { success: false, error: 'Failed to fetch notifications' };
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(
    userId: string
  ): Promise<{ success: boolean; stats?: NotificationStats; error?: string }> {
    try {
      // Get all notifications for stats
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('type, priority, is_read, created_at')
        .eq('user_id', userId)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      if (error) {
        console.error('❌ Error fetching notification stats:', error);
        return { success: false, error: error.message };
      }

      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const stats: NotificationStats = {
        total: notifications?.length || 0,
        unread: notifications?.filter(n => !n.is_read).length || 0,
        byType: {},
        byPriority: {},
        recentCount: notifications?.filter(n => 
          new Date(n.created_at) > last24Hours
        ).length || 0
      };

      // Calculate type distribution
      notifications?.forEach(notification => {
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
        stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      });

      return { success: true, stats };

    } catch (error) {
      console.error('❌ Error calculating notification stats:', error);
      return { success: false, error: 'Failed to calculate notification stats' };
    }
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(
    notificationIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds);

      if (error) {
        console.error('❌ Error marking notifications as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error marking notifications as read:', error);
      return { success: false, error: 'Failed to mark notifications as read' };
    }
  }

  /**
   * Delete multiple notifications
   */
  static async deleteMultiple(
    notificationIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds);

      if (error) {
        console.error('❌ Error deleting notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error deleting notifications:', error);
      return { success: false, error: 'Failed to delete notifications' };
    }
  }

  /**
   * Create appointment-related notifications
   */
  static async createAppointmentNotification(
    userId: string,
    appointmentId: string,
    type: 'appointment_confirmed' | 'appointment_reminder' | 'appointment_cancelled' | 'appointment_completed',
    customData?: {
      title?: string;
      message?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      actionUrl?: string;
      actionText?: string;
    }
  ): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    try {
      // Get appointment details for context
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          clinics (clinic_name),
          doctors (first_name, last_name, specialty)
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError) {
        console.error('❌ Error fetching appointment details:', appointmentError);
        return { success: false, error: appointmentError.message };
      }

      // Generate notification content based on type
      let title = customData?.title;
      let message = customData?.message;
      let priority = customData?.priority || 'normal';
      let actionUrl = customData?.actionUrl;
      let actionText = customData?.actionText;

      const clinicName = appointment.clinics?.clinic_name || 'the clinic';
      const doctorName = appointment.doctors 
        ? `Dr. ${appointment.doctors.first_name} ${appointment.doctors.last_name}`
        : 'your doctor';
      const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString();
      const appointmentTime = appointment.appointment_time;

      switch (type) {
        case 'appointment_confirmed':
          title = title || 'Appointment Confirmed';
          message = message || `Your appointment with ${doctorName} at ${clinicName} on ${appointmentDate} at ${appointmentTime} has been confirmed.`;
          actionUrl = actionUrl || `/appointments/${appointmentId}`;
          actionText = actionText || 'View Details';
          break;

        case 'appointment_reminder':
          title = title || 'Appointment Reminder';
          message = message || `Reminder: You have an appointment with ${doctorName} at ${clinicName} tomorrow at ${appointmentTime}.`;
          priority = 'high';
          actionUrl = actionUrl || `/appointments/${appointmentId}`;
          actionText = actionText || 'View Appointment';
          break;

        case 'appointment_cancelled':
          title = title || 'Appointment Cancelled';
          message = message || `Your appointment with ${doctorName} at ${clinicName} on ${appointmentDate} has been cancelled.`;
          priority = 'high';
          actionUrl = actionUrl || '/appointments';
          actionText = actionText || 'Book New Appointment';
          break;

        case 'appointment_completed':
          title = title || 'Appointment Completed';
          message = message || `Your appointment with ${doctorName} at ${clinicName} has been completed. Please rate your experience.`;
          actionUrl = actionUrl || `/appointments/${appointmentId}/review`;
          actionText = actionText || 'Leave Review';
          break;
      }

      // Create the notification
      const { data: notification, error: createError } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          appointment_id: appointmentId,
          type,
          title,
          message,
          priority,
          action_url: actionUrl,
          action_text: actionText,
          is_read: false,
          metadata: {
            appointmentDate: appointment.appointment_date,
            appointmentTime: appointment.appointment_time,
            clinicName,
            doctorName,
            specialty: appointment.doctors?.specialty
          }
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating notification:', createError);
        return { success: false, error: createError.message };
      }

      console.log(`✅ Created ${type} notification for appointment ${appointmentId}`);
      return { success: true, notification };

    } catch (error) {
      console.error('❌ Unexpected error creating appointment notification:', error);
      return { success: false, error: 'Failed to create appointment notification' };
    }
  }

  /**
   * Create system notification
   */
  static async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      actionUrl?: string;
      actionText?: string;
      expiresAt?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          type: 'system',
          title,
          message,
          priority: options?.priority || 'normal',
          action_url: options?.actionUrl,
          action_text: options?.actionText,
          expires_at: options?.expiresAt,
          metadata: options?.metadata,
          is_read: false
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating system notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true, notification };

    } catch (error) {
      console.error('❌ Unexpected error creating system notification:', error);
      return { success: false, error: 'Failed to create system notification' };
    }
  }

  /**
   * Subscribe to real-time notification updates
   */
  static subscribeToNotifications(
    userId: string,
    callback: (payload: any) => void
  ): { unsubscribe: () => void } {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(subscription);
      }
    };
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        console.error('❌ Error cleaning up expired notifications:', error);
        return { success: false, error: error.message };
      }

      const deletedCount = data?.length || 0;
      console.log(`✅ Cleaned up ${deletedCount} expired notifications`);
      return { success: true, deletedCount };

    } catch (error) {
      console.error('❌ Unexpected error cleaning up notifications:', error);
      return { success: false, error: 'Failed to cleanup expired notifications' };
    }
  }
}

export default EnhancedNotificationService;
