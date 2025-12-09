import { supabase, UserRole } from '../supabase';

// Notification interface matching the actual database schema
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string; // 'appointment' | 'payment' | 'reminder' | 'system'
  is_read: boolean;
  created_at: string;
  appointment_id?: string;
  user_type?: string | null;
  action_url?: string | null;
  metadata?: any;
  expires_at?: string | null;
  // Frontend compatibility - maps to is_read
  read: boolean;
}

export interface GetNotificationsParams {
  user_id: string;
  limit?: number;
  offset?: number;
  type?: string;
  read?: boolean;
}

export interface CreateNotificationParams {
  user_id: string;
  user_type?: string | null;
  title: string;
  message: string;
  type: string;
  appointment_id?: string;
  action_url?: string | null;
  metadata?: any;
  expires_at?: string | null;
}

// Transform DB notification to include read property for frontend compatibility
const transformNotification = (dbNotification: any): Notification => ({
  ...dbNotification,
  read: dbNotification.is_read === true || dbNotification.is_read === 'true',
});

export class NotificationService {
  async getNotifications(params: GetNotificationsParams) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', params.user_id)
        .order('created_at', { ascending: false });

      if (params.type) {
        query = query.eq('type', params.type);
      }

      if (params.read !== undefined) {
        query = query.eq('is_read', params.read);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, error: error.message };
      }

      const notifications = (data || []).map(transformNotification);

      return {
        success: true,
        notifications,
      };
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return { success: false, error: 'Failed to fetch notifications' };
    }
  }

  async createNotification(params: CreateNotificationParams) {
    try {
      const notificationData: any = {
        user_id: params.user_id,
        title: params.title,
        message: params.message,
        type: params.type,
        is_read: false,
      };

      if (params.user_type !== undefined) {
        notificationData.user_type = params.user_type;
      }

      if (params.appointment_id) {
        notificationData.appointment_id = params.appointment_id;
      }

      if (params.action_url !== undefined) {
        notificationData.action_url = params.action_url;
      }

      if (params.metadata !== undefined) {
        notificationData.metadata = params.metadata;
      }

      if (params.expires_at !== undefined) {
        notificationData.expires_at = params.expires_at;
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        notification: transformNotification(data),
      };
    } catch (error) {
      console.error('Error in createNotification:', error);
      return { success: false, error: 'Failed to create notification' };
    }
  }

  async markAsRead(notificationId: string) {
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

  async markAllAsRead(userId: string) {
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

  async deleteNotification(notificationId: string) {
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

  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread count:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        count: count || 0,
      };
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return { success: false, error: 'Failed to fetch unread count' };
    }
  }

  // Helper methods for creating specific notification types
  async createAppointmentNotification(
    userId: string,
    appointmentId: string,
    type: 'booked' | 'confirmed' | 'cancelled' | 'reminder',
    appointmentDetails?: any
  ) {
    const messages = {
      booked: 'Your appointment has been successfully booked',
      confirmed: 'Your appointment has been confirmed',
      cancelled: 'Your appointment has been cancelled',
      reminder: 'You have an upcoming appointment',
    };

    return this.createNotification({
      user_id: userId,
      user_type: 'patient',
      title: `Appointment ${type}`,
      message: messages[type],
      type: 'appointment',
      appointment_id: appointmentId,
    });
  }

  async createPaymentNotification(
    userId: string,
    paymentId: string,
    type: 'success' | 'failed' | 'refund',
    amount?: number
  ) {
    const messages = {
      success: `Payment of ₱${amount} was successful`,
      failed: `Payment of ₱${amount} failed`,
      refund: `Refund of ₱${amount} has been processed`,
    };

    return this.createNotification({
      user_id: userId,
      user_type: 'patient',
      title: `Payment ${type}`,
      message: messages[type],
      type: 'payment',
    });
  }

  async createSystemNotification(userId: string, title: string, message: string, userType: string = 'patient') {
    return this.createNotification({
      user_id: userId,
      user_type: userType,
      title,
      message,
      type: 'system',
    });
  }

  // Real-time subscription for notifications
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(transformNotification(payload.new));
        }
      )
      .subscribe();
  }
}

export const notificationService = new NotificationService();
