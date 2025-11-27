import { supabase } from '../supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'appointment' | 'payment' | 'reminder' | 'system';
  read: boolean;
  created_at: string;
  updated_at: string;
  data?: any; // Additional metadata
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
  title: string;
  message: string;
  type: 'appointment' | 'payment' | 'reminder' | 'system';
  data?: any;
}

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
        query = query.eq('read', params.read);
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

      return {
        success: true,
        notifications: data as Notification[],
      };
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return { success: false, error: 'Failed to fetch notifications' };
    }
  }

  async createNotification(params: CreateNotificationParams) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: params.user_id,
            title: params.title,
            message: params.message,
            type: params.type,
            data: params.data,
            read: false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        notification: data as Notification,
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
        .update({ read: true, updated_at: new Date().toISOString() })
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
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false);

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
        .eq('read', false);

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
      title: `Appointment ${type}`,
      message: messages[type],
      type: 'appointment',
      data: {
        appointment_id: appointmentId,
        appointment_type: type,
        ...appointmentDetails,
      },
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
      title: `Payment ${type}`,
      message: messages[type],
      type: 'payment',
      data: {
        payment_id: paymentId,
        payment_type: type,
        amount,
      },
    });
  }

  async createSystemNotification(userId: string, title: string, message: string, data?: any) {
    return this.createNotification({
      user_id: userId,
      title,
      message,
      type: 'system',
      data,
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
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }
}

export const notificationService = new NotificationService();
