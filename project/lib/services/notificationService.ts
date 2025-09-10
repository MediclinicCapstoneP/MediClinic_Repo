import { supabase } from '../supabase';

export interface Notification {
  id: string;
  user_id: string;
  user_type: 'patient' | 'doctor' | 'clinic';
  title: string;
  message: string;
  notification_type: 'appointment_confirmed' | 'appointment_cancelled' | 'appointment_reminder' | 'payment_received' | 'rating_request' | 'system_update' | 'appointment_pending_payment' | 'appointment_completed';
  appointment_id?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read_at?: string;
  created_at: string;
}

export interface GetNotificationsParams {
  user_id: string;
  limit?: number;
  offset?: number;
  notification_type?: string;
  unread_only?: boolean;
}

export interface CreateNotificationParams {
  user_id: string;
  user_type: 'patient' | 'doctor' | 'clinic';
  title: string;
  message: string;
  notification_type: 'appointment_confirmed' | 'appointment_cancelled' | 'appointment_reminder' | 'payment_received' | 'rating_request' | 'system_update' | 'appointment_pending_payment' | 'appointment_completed';
  appointment_id?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export class NotificationService {
  async getNotifications(params: GetNotificationsParams) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', params.user_id)
        .order('created_at', { ascending: false });

      if (params.notification_type) {
        query = query.eq('notification_type', params.notification_type);
      }

      if (params.unread_only) {
        query = query.is('read_at', null);
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
            user_type: params.user_type,
            title: params.title,
            message: params.message,
            notification_type: params.notification_type,
            appointment_id: params.appointment_id,
            priority: params.priority || 'normal',
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
        .update({ read_at: new Date().toISOString() })
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
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

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
        .is('read_at', null);

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
    userType: 'patient' | 'doctor' | 'clinic',
    appointmentId: string,
    type: 'confirmed' | 'cancelled' | 'reminder' | 'pending_payment' | 'completed',
    customMessage?: string
  ) {
    const messages = {
      confirmed: 'Your appointment has been confirmed',
      cancelled: 'Your appointment has been cancelled',
      reminder: 'You have an upcoming appointment',
      pending_payment: 'Payment is required for your appointment',
      completed: 'Your appointment has been completed',
    };

    const notificationTypes = {
      confirmed: 'appointment_confirmed' as const,
      cancelled: 'appointment_cancelled' as const,
      reminder: 'appointment_reminder' as const,
      pending_payment: 'appointment_pending_payment' as const,
      completed: 'appointment_completed' as const,
    };

    return this.createNotification({
      user_id: userId,
      user_type: userType,
      title: `Appointment ${type.replace('_', ' ')}`,
      message: customMessage || messages[type],
      notification_type: notificationTypes[type],
      appointment_id: appointmentId,
      priority: type === 'pending_payment' ? 'high' : 'normal',
    });
  }

  async createPaymentNotification(
    userId: string,
    userType: 'patient' | 'doctor' | 'clinic',
    appointmentId: string,
    amount: number
  ) {
    return this.createNotification({
      user_id: userId,
      user_type: userType,
      title: 'Payment Received',
      message: `Payment of ₱${amount} was successfully processed`,
      notification_type: 'payment_received',
      appointment_id: appointmentId,
      priority: 'normal',
    });
  }

  async createSystemNotification(
    userId: string,
    userType: 'patient' | 'doctor' | 'clinic',
    title: string,
    message: string,
    appointmentId?: string
  ) {
    return this.createNotification({
      user_id: userId,
      user_type: userType,
      title,
      message,
      notification_type: 'system_update',
      appointment_id: appointmentId,
      priority: 'normal',
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
