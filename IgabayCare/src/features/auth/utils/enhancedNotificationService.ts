import { supabase } from '../../../supabaseClient';

interface NotificationData {
  userId: string;
  userType: 'patient' | 'clinic' | 'doctor';
  title: string;
  message: string;
  type: string;
  notificationType: 'appointment_booked' | 'appointment_confirmed' | 'appointment_reminder' | 
                   'appointment_completed' | 'follow_up_scheduled' | 'payment_confirmed' | 
                   'payment_failed' | 'appointment_cancelled' | 'general';
  appointmentId?: string;
  transactionId?: string;
  scheduledFor?: string;
  sendEmail?: boolean;
  sendSms?: boolean;
}

interface ReminderData {
  appointmentId: string;
  patientId: string;
  appointmentDateTime: string;
  clinicName: string;
  reminderTypes?: ('24_hours' | '2_hours' | '30_minutes')[];
}

export const enhancedNotificationService = {
  /**
   * Create a comprehensive notification
   */
  async createNotification(data: NotificationData): Promise<{
    success: boolean;
    notification?: any;
    error?: string;
  }> {
    try {
      console.log('🔔 Creating notification:', data.title);

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: data.userId,
          user_type: data.userType,
          title: data.title,
          message: data.message,
          type: data.type,
          notification_type: data.notificationType,
          appointment_id: data.appointmentId,
          transaction_id: data.transactionId,
          scheduled_for: data.scheduledFor,
          email_sent: false,
          sms_sent: false,
          is_read: false
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating notification:', error);
        return { success: false, error: error.message };
      }

      // Send email if requested
      if (data.sendEmail) {
        await this.sendEmailNotification(notification.id, data.userId, data.title, data.message);
      }

      // Send SMS if requested
      if (data.sendSms) {
        await this.sendSmsNotification(notification.id, data.userId, data.message);
      }

      console.log('✅ Notification created:', notification.id);
      return { success: true, notification };
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      return { success: false, error: 'Failed to create notification' };
    }
  },

  /**
   * Create appointment booking confirmation notification
   */
  async createAppointmentBookingNotification(
    patientId: string,
    appointmentId: string,
    clinicName: string,
    appointmentDate: string,
    appointmentTime: string,
    paymentAmount: number,
    sendEmail: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = new Date(`2000-01-01T${appointmentTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return this.createNotification({
      userId: patientId,
      userType: 'patient',
      title: 'Appointment Booked Successfully',
      message: `Your appointment at ${clinicName} has been booked for ${formattedDate} at ${formattedTime}. Payment: ₱${paymentAmount.toFixed(2)}`,
      type: 'appointment_confirmation',
      notificationType: 'appointment_booked',
      appointmentId,
      sendEmail
    });
  },

  /**
   * Create payment confirmation notification
   */
  async createPaymentConfirmationNotification(
    patientId: string,
    appointmentId: string,
    transactionId: string,
    amount: number,
    paymentMethod: string,
    sendEmail: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    return this.createNotification({
      userId: patientId,
      userType: 'patient',
      title: 'Payment Confirmed',
      message: `Your payment of ₱${amount.toFixed(2)} via ${paymentMethod} has been confirmed. Your appointment is now confirmed.`,
      type: 'payment_confirmation',
      notificationType: 'payment_confirmed',
      appointmentId,
      transactionId,
      sendEmail
    });
  },

  /**
   * Create payment failure notification
   */
  async createPaymentFailureNotification(
    patientId: string,
    appointmentId: string,
    transactionId: string,
    amount: number,
    reason: string,
    sendEmail: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    return this.createNotification({
      userId: patientId,
      userType: 'patient',
      title: 'Payment Failed',
      message: `Your payment of ₱${amount.toFixed(2)} could not be processed. Reason: ${reason}. Please try again or contact support.`,
      type: 'payment_failure',
      notificationType: 'payment_failed',
      appointmentId,
      transactionId,
      sendEmail
    });
  },

  /**
   * Create appointment reminder notifications
   */
  async createAppointmentReminders(data: ReminderData): Promise<{
    success: boolean;
    reminders?: any[];
    error?: string;
  }> {
    try {
      console.log('⏰ Creating appointment reminders for:', data.appointmentId);

      const appointmentDateTime = new Date(data.appointmentDateTime);
      const reminderTypes = data.reminderTypes || ['24_hours', '2_hours'];
      const reminders = [];

      for (const reminderType of reminderTypes) {
        let reminderTime: Date;
        let subject: string;
        let message: string;

        switch (reminderType) {
          case '24_hours':
            reminderTime = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
            subject = 'Appointment Reminder - Tomorrow';
            message = `Reminder: You have an appointment at ${data.clinicName} tomorrow at ${appointmentDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}. Please arrive 15 minutes early.`;
            break;
          case '2_hours':
            reminderTime = new Date(appointmentDateTime.getTime() - 2 * 60 * 60 * 1000);
            subject = 'Appointment Reminder - In 2 Hours';
            message = `Reminder: Your appointment at ${data.clinicName} is in 2 hours. Please prepare any necessary documents and arrive on time.`;
            break;
          case '30_minutes':
            reminderTime = new Date(appointmentDateTime.getTime() - 30 * 60 * 1000);
            subject = 'Appointment Reminder - In 30 Minutes';
            message = `Reminder: Your appointment at ${data.clinicName} is in 30 minutes. Please head to the clinic now.`;
            break;
          default:
            continue;
        }

        // Only create reminders for future times
        if (reminderTime > new Date()) {
          const { data: reminder, error } = await supabase
            .from('appointment_reminders')
            .insert([{
              appointment_id: data.appointmentId,
              patient_id: data.patientId,
              reminder_type: reminderType,
              reminder_time: reminderTime.toISOString(),
              subject,
              message,
              send_email: true,
              send_sms: false,
              send_push: true,
              status: 'scheduled'
            }])
            .select()
            .single();

          if (error) {
            console.error(`❌ Error creating ${reminderType} reminder:`, error);
          } else {
            reminders.push(reminder);
            console.log(`✅ Created ${reminderType} reminder for:`, reminderTime.toISOString());
          }
        }
      }

      return { success: true, reminders };
    } catch (error) {
      console.error('❌ Error creating appointment reminders:', error);
      return { success: false, error: 'Failed to create appointment reminders' };
    }
  },

  /**
   * Process scheduled reminders (to be called by cron job)
   */
  async processScheduledReminders(): Promise<{
    success: boolean;
    processed?: number;
    error?: string;
  }> {
    try {
      console.log('🔄 Processing scheduled reminders...');

      // Get reminders that should be sent now (within the last 5 minutes)
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const { data: reminders, error } = await supabase
        .from('appointment_reminders')
        .select(`
          *,
          appointment:appointments(
            appointment_date,
            appointment_time,
            patient:patients(first_name, last_name, email, phone),
            clinic:clinics(name, address)
          )
        `)
        .eq('status', 'scheduled')
        .gte('reminder_time', fiveMinutesAgo.toISOString())
        .lte('reminder_time', now.toISOString());

      if (error) {
        console.error('❌ Error fetching scheduled reminders:', error);
        return { success: false, error: error.message };
      }

      let processedCount = 0;

      for (const reminder of reminders || []) {
        try {
          // Create notification
          await this.createNotification({
            userId: reminder.patient_id,
            userType: 'patient',
            title: reminder.subject,
            message: reminder.message,
            type: 'appointment_reminder',
            notificationType: 'appointment_reminder',
            appointmentId: reminder.appointment_id,
            sendEmail: reminder.send_email,
            sendSms: reminder.send_sms
          });

          // Mark reminder as sent
          await supabase
            .from('appointment_reminders')
            .update({ 
              status: 'sent',
              sent_at: now.toISOString()
            })
            .eq('id', reminder.id);

          processedCount++;
          console.log(`✅ Processed reminder ${reminder.id} for appointment ${reminder.appointment_id}`);
        } catch (reminderError) {
          console.error(`❌ Error processing reminder ${reminder.id}:`, reminderError);
          
          // Mark as failed
          await supabase
            .from('appointment_reminders')
            .update({ status: 'failed' })
            .eq('id', reminder.id);
        }
      }

      console.log(`✅ Processed ${processedCount} reminders`);
      return { success: true, processed: processedCount };
    } catch (error) {
      console.error('❌ Error processing scheduled reminders:', error);
      return { success: false, error: 'Failed to process scheduled reminders' };
    }
  },

  /**
   * Send email notification (placeholder - integrate with your email service)
   */
  async sendEmailNotification(
    notificationId: string,
    userId: string,
    subject: string,
    message: string
  ): Promise<void> {
    try {
      // Get user email
      const { data: user, error } = await supabase
        .from('patients')
        .select('email, first_name, last_name')
        .eq('user_id', userId)
        .single();

      if (error || !user?.email) {
        console.error('❌ Error getting user email:', error);
        return;
      }

      // TODO: Integrate with email service (NodeMailer, SendGrid, etc.)
      console.log(`📧 Email would be sent to ${user.email}:`, subject);
      
      // For now, just mark as sent
      await supabase
        .from('notifications')
        .update({ email_sent: true })
        .eq('id', notificationId);

    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
  },

  /**
   * Send SMS notification (placeholder - integrate with SMS service)
   */
  async sendSmsNotification(
    notificationId: string,
    userId: string,
    message: string
  ): Promise<void> {
    try {
      // Get user phone
      const { data: user, error } = await supabase
        .from('patients')
        .select('phone')
        .eq('user_id', userId)
        .single();

      if (error || !user?.phone) {
        console.error('❌ Error getting user phone:', error);
        return;
      }

      // TODO: Integrate with SMS service (Twilio, etc.)
      console.log(`📱 SMS would be sent to ${user.phone}:`, message);
      
      // For now, just mark as sent
      await supabase
        .from('notifications')
        .update({ sms_sent: true })
        .eq('id', notificationId);

    } catch (error) {
      console.error('❌ Error sending SMS:', error);
    }
  },

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    userType: 'patient' | 'clinic' | 'doctor',
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    success: boolean;
    notifications?: any[];
    total?: number;
    error?: string;
  }> {
    try {
      const { data: notifications, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('user_type', userType)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Error fetching notifications:', error);
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        notifications: notifications || [], 
        total: count || 0 
      };
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return { success: false, error: 'Failed to fetch notifications' };
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('❌ Error marking notification as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string, userType: 'patient' | 'clinic' | 'doctor'): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('user_type', userType)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error marking all notifications as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return { success: false, error: 'Failed to mark all notifications as read' };
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string, userType: 'patient' | 'clinic' | 'doctor'): Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('user_type', userType)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error getting unread count:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return { success: false, error: 'Failed to get unread count' };
    }
  }
};
