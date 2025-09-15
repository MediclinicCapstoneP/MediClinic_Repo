import { supabase } from '../supabaseClient';

// Enhanced notification interfaces
export interface Notification {
  id: string;
  user_id: string;
  appointment_id?: string;
  title: string;
  message: string;
  type: 'appointment_completed' | 'appointment_reminder' | 'appointment_confirmed' | 'appointment_cancelled' | 'review_request' | 'system' | 'medical' | 'security';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  action_url?: string;
  action_text?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_appointment_completed: boolean;
  email_appointment_reminder: boolean;
  email_appointment_confirmed: boolean;
  email_review_request: boolean;
  push_appointment_completed: boolean;
  push_appointment_reminder: boolean;
  push_appointment_confirmed: boolean;
  push_review_request: boolean;
  sms_appointment_completed: boolean;
  sms_appointment_reminder: boolean;
  sms_appointment_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  user_id: string;
  appointment_id?: string;
  title: string;
  message: string;
  type: Notification['type'];
  priority?: Notification['priority'];
  action_url?: string;
  action_text?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
}

export class NotificationService {
  /**
   * Get all notifications for a user
   */
  static async getNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
      type?: Notification['type'];
    }
  ): Promise<{ notifications: Notification[]; error?: string }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options?.unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      // Filter out expired notifications
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return { notifications: [], error: error.message };
      }

      return { notifications: data || [] };
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return { notifications: [], error: 'Failed to fetch notifications' };
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<{ count: number; error?: string }> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

      if (error) {
        console.error('Error fetching unread count:', error);
        return { count: 0, error: error.message };
      }

      return { count: count || 0 };
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return { count: 0, error: 'Failed to fetch unread count' };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return { success: false, error: 'Failed to mark all notifications as read' };
    }
  }

  /**
   * Create a new notification
   */
  static async createNotification(params: CreateNotificationParams): Promise<{ notification?: Notification; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...params,
          priority: params.priority || 'normal'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return { error: error.message };
      }

      return { notification: data };
    } catch (error) {
      console.error('Error in createNotification:', error);
      return { error: 'Failed to create notification' };
    }
  }

  /**
   * Create appointment completion notification
   */
  static async createAppointmentCompletionNotification(
    appointmentId: string,
    patientUserId: string
  ): Promise<{ notification?: Notification; error?: string }> {
    try {
      // Use the database function for consistency
      const { data, error } = await supabase
        .rpc('create_appointment_completion_notification', {
          p_appointment_id: appointmentId,
          p_patient_user_id: patientUserId
        });

      if (error) {
        console.error('Error creating appointment completion notification:', error);
        return { error: error.message };
      }

      // Fetch the created notification
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) {
        console.error('Error fetching created notification:', fetchError);
        return { error: fetchError.message };
      }

      return { notification };
    } catch (error) {
      console.error('Error in createAppointmentCompletionNotification:', error);
      return { error: 'Failed to create appointment completion notification' };
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return { success: false, error: 'Failed to delete notification' };
    }
  }

  /**
   * Get notification preferences for a user
   */
  static async getNotificationPreferences(userId: string): Promise<{ preferences?: NotificationPreferences; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no preferences exist, create default ones
        if (error.code === 'PGRST116') {
          return this.createDefaultNotificationPreferences(userId);
        }
        console.error('Error fetching notification preferences:', error);
        return { error: error.message };
      }

      return { preferences: data };
    } catch (error) {
      console.error('Error in getNotificationPreferences:', error);
      return { error: 'Failed to fetch notification preferences' };
    }
  }

  /**
   * Update notification preferences for a user
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<{ preferences?: NotificationPreferences; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert([{
          user_id: userId,
          ...preferences
        }])
        .select()
        .single();

      if (error) {
        console.error('Error updating notification preferences:', error);
        return { error: error.message };
      }

      return { preferences: data };
    } catch (error) {
      console.error('Error in updateNotificationPreferences:', error);
      return { error: 'Failed to update notification preferences' };
    }
  }

  /**
   * Create default notification preferences for a user
   */
  private static async createDefaultNotificationPreferences(userId: string): Promise<{ preferences?: NotificationPreferences; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert([{
          user_id: userId,
          email_appointment_completed: true,
          email_appointment_reminder: true,
          email_appointment_confirmed: true,
          email_review_request: true,
          push_appointment_completed: true,
          push_appointment_reminder: true,
          push_appointment_confirmed: true,
          push_review_request: true,
          sms_appointment_completed: false,
          sms_appointment_reminder: false,
          sms_appointment_confirmed: false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating default notification preferences:', error);
        return { error: error.message };
      }

      return { preferences: data };
    } catch (error) {
      console.error('Error in createDefaultNotificationPreferences:', error);
      return { error: 'Failed to create default notification preferences' };
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  static subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): { unsubscribe: () => void } {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(subscription);
      }
    };
  }

  /**
   * Get appointment-related notifications for a specific appointment
   */
  static async getAppointmentNotifications(
    appointmentId: string,
    userId: string
  ): Promise<{ notifications: Notification[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('appointment_id', appointmentId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching appointment notifications:', error);
        return { notifications: [], error: error.message };
      }

      return { notifications: data || [] };
    } catch (error) {
      console.error('Error in getAppointmentNotifications:', error);
      return { notifications: [], error: 'Failed to fetch appointment notifications' };
    }
  }

  /**
   * Check if user should receive a specific type of notification
   */
  static async shouldReceiveNotification(
    userId: string,
    notificationType: 'appointment_completed' | 'appointment_reminder' | 'appointment_confirmed' | 'review_request',
    deliveryMethod: 'email' | 'push' | 'sms'
  ): Promise<{ shouldReceive: boolean; error?: string }> {
    try {
      const { preferences, error } = await this.getNotificationPreferences(userId);
      
      if (error || !preferences) {
        return { shouldReceive: false, error };
      }

      const prefKey = `${deliveryMethod}_${notificationType}` as keyof NotificationPreferences;
      const shouldReceive = Boolean(preferences[prefKey]);

      return { shouldReceive };
    } catch (error) {
      console.error('Error in shouldReceiveNotification:', error);
      return { shouldReceive: false, error: 'Failed to check notification preferences' };
    }
  }
}