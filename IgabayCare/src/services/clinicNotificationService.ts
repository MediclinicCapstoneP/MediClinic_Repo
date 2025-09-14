import { supabase } from '../lib/supabase';
import { NotificationService, Notification, CreateNotificationParams } from './notificationService';

export interface ClinicNotification extends Notification {
  doctor_name?: string;
  patient_name?: string;
  appointment_time?: string;
  revenue_amount?: number;
}

export interface ClinicNotificationParams extends CreateNotificationParams {
  doctor_name?: string;
  patient_name?: string;
  appointment_time?: string;
  revenue_amount?: number;
}

export class ClinicNotificationService extends NotificationService {
  /**
   * Get notifications specifically for clinics
   */
  static async getClinicNotifications(
    clinicUserId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
      type?: Notification['type'];
    }
  ): Promise<{ notifications: ClinicNotification[]; error?: string }> {
    try {
      let query = supabase
        .from('notifications')
        .select(`
          *,
          appointments(
            id,
            patient_name,
            appointment_date,
            appointment_time,
            total_amount,
            doctors(full_name)
          )
        `)
        .eq('user_id', clinicUserId)
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
        console.error('Error fetching clinic notifications:', error);
        return { notifications: [], error: error.message };
      }

      // Transform data to include appointment details
      const notifications = (data || []).map(item => ({
        ...item,
        patient_name: item.appointments?.patient_name,
        appointment_time: item.appointments?.appointment_time,
        revenue_amount: item.appointments?.total_amount,
        doctor_name: item.appointments?.doctors?.full_name
      }));

      return { notifications };
    } catch (error) {
      console.error('Error in getClinicNotifications:', error);
      return { notifications: [], error: 'Failed to fetch clinic notifications' };
    }
  }

  /**
   * Create new appointment notification for clinic
   */
  static async createNewAppointmentNotification(
    params: {
      clinicUserId: string;
      appointmentId: string;
      patientName: string;
      doctorName: string;
      appointmentTime: string;
      amount: number;
    }
  ): Promise<{ notification?: ClinicNotification; error?: string }> {
    try {
      const { clinicUserId, appointmentId, patientName, doctorName, appointmentTime, amount } = params;

      const notificationParams: CreateNotificationParams = {
        user_id: clinicUserId,
        appointment_id: appointmentId,
        title: 'New Appointment Booked',
        message: `${patientName} booked an appointment with Dr. ${doctorName} for ${new Date(appointmentTime).toLocaleString()}. Revenue: ₱${amount}`,
        type: 'appointment_confirmed',
        priority: 'normal',
        action_url: `/clinic/appointments/${appointmentId}`,
        action_text: 'View Appointment',
        metadata: {
          patient_name: patientName,
          doctor_name: doctorName,
          appointment_time: appointmentTime,
          revenue_amount: amount
        }
      };

      const { notification, error } = await this.createNotification(notificationParams);

      if (error) {
        return { error };
      }

      return { 
        notification: {
          ...notification!,
          patient_name: patientName,
          doctor_name: doctorName,
          appointment_time: appointmentTime,
          revenue_amount: amount
        }
      };
    } catch (error) {
      console.error('Error creating new appointment notification:', error);
      return { error: 'Failed to create appointment notification' };
    }
  }

  /**
   * Create doctor registration notification for clinic
   */
  static async createDoctorRegistrationNotification(
    clinicUserId: string,
    doctorName: string,
    doctorEmail: string,
    specialization: string
  ): Promise<{ notification?: ClinicNotification; error?: string }> {
    try {
      const notificationParams: CreateNotificationParams = {
        user_id: clinicUserId,
        title: 'New Doctor Registered',
        message: `Dr. ${doctorName} (${specialization}) has been successfully registered with email: ${doctorEmail}`,
        type: 'system',
        priority: 'normal',
        action_url: '/clinic/doctors',
        action_text: 'View Doctors',
        metadata: {
          doctor_name: doctorName,
          doctor_email: doctorEmail,
          specialization: specialization
        }
      };

      const { notification, error } = await this.createNotification(notificationParams);

      if (error) {
        return { error };
      }

      return { 
        notification: {
          ...notification!,
          doctor_name: doctorName
        }
      };
    } catch (error) {
      console.error('Error creating doctor registration notification:', error);
      return { error: 'Failed to create doctor registration notification' };
    }
  }

  /**
   * Create revenue milestone notification for clinic
   */
  static async createRevenueMilestoneNotification(
    clinicUserId: string,
    milestone: number,
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<{ notification?: ClinicNotification; error?: string }> {
    try {
      const notificationParams: CreateNotificationParams = {
        user_id: clinicUserId,
        title: 'Revenue Milestone Reached!',
        message: `Congratulations! Your clinic has reached ₱${milestone.toLocaleString()} in ${period} revenue.`,
        type: 'system',
        priority: 'normal',
        action_url: '/clinic/analytics',
        action_text: 'View Analytics',
        metadata: {
          milestone_amount: milestone,
          period: period
        }
      };

      const { notification, error } = await this.createNotification(notificationParams);

      if (error) {
        return { error };
      }

      return { 
        notification: {
          ...notification!,
          revenue_amount: milestone
        }
      };
    } catch (error) {
      console.error('Error creating revenue milestone notification:', error);
      return { error: 'Failed to create revenue milestone notification' };
    }
  }

  /**
   * Create appointment cancellation notification for clinic
   */
  static async createAppointmentCancellationNotification(
    params: {
      clinicUserId: string;
      appointmentId: string;
      patientName: string;
      doctorName: string;
      appointmentTime: string;
      refundAmount?: number;
    }
  ): Promise<{ notification?: ClinicNotification; error?: string }> {
    try {
      const { clinicUserId, appointmentId, patientName, doctorName, appointmentTime, refundAmount } = params;

      const message = refundAmount 
        ? `${patientName}'s appointment with Dr. ${doctorName} for ${new Date(appointmentTime).toLocaleString()} was cancelled. Refund: ₱${refundAmount}`
        : `${patientName}'s appointment with Dr. ${doctorName} for ${new Date(appointmentTime).toLocaleString()} was cancelled.`;

      const notificationParams: CreateNotificationParams = {
        user_id: clinicUserId,
        appointment_id: appointmentId,
        title: 'Appointment Cancelled',
        message,
        type: 'appointment_cancelled',
        priority: 'high',
        action_url: `/clinic/appointments/${appointmentId}`,
        action_text: 'View Details',
        metadata: {
          patient_name: patientName,
          doctor_name: doctorName,
          appointment_time: appointmentTime,
          refund_amount: refundAmount
        }
      };

      const { notification, error } = await this.createNotification(notificationParams);

      if (error) {
        return { error };
      }

      return { 
        notification: {
          ...notification!,
          patient_name: patientName,
          doctor_name: doctorName,
          appointment_time: appointmentTime,
          revenue_amount: refundAmount ? -refundAmount : 0
        }
      };
    } catch (error) {
      console.error('Error creating appointment cancellation notification:', error);
      return { error: 'Failed to create cancellation notification' };
    }
  }

  /**
   * Create system maintenance notification for clinic
   */
  static async createSystemMaintenanceNotification(
    clinicUserId: string,
    maintenanceType: 'scheduled' | 'emergency' | 'completed',
    details: string,
    scheduledTime?: string
  ): Promise<{ notification?: ClinicNotification; error?: string }> {
    try {
      let title = '';
      let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

      switch (maintenanceType) {
        case 'scheduled':
          title = 'Scheduled Maintenance';
          priority = 'normal';
          break;
        case 'emergency':
          title = 'Emergency Maintenance';
          priority = 'urgent';
          break;
        case 'completed':
          title = 'Maintenance Completed';
          priority = 'low';
          break;
      }

      const message = scheduledTime 
        ? `${details} Scheduled for: ${new Date(scheduledTime).toLocaleString()}`
        : details;

      const notificationParams: CreateNotificationParams = {
        user_id: clinicUserId,
        title,
        message,
        type: 'system',
        priority,
        metadata: {
          maintenance_type: maintenanceType,
          scheduled_time: scheduledTime
        }
      };

      const { notification, error } = await this.createNotification(notificationParams);

      if (error) {
        return { error };
      }

      return { notification: notification! };
    } catch (error) {
      console.error('Error creating system maintenance notification:', error);
      return { error: 'Failed to create maintenance notification' };
    }
  }

  /**
   * Subscribe to real-time clinic notifications
   */
  static subscribeToClinicNotifications(
    clinicUserId: string,
    callback: (notification: ClinicNotification) => void
  ): { unsubscribe: () => void } {
    const subscription = supabase
      .channel('clinic_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${clinicUserId}`
        },
        async (payload) => {
          const notification = payload.new as Notification;
          
          // Fetch additional appointment details if available
          if (notification.appointment_id) {
            const { data: appointment } = await supabase
              .from('appointments')
              .select(`
                patient_name,
                appointment_time,
                total_amount,
                doctors(full_name)
              `)
              .eq('id', notification.appointment_id)
              .single();

            callback({
              ...notification,
              patient_name: appointment?.patient_name,
              appointment_time: appointment?.appointment_time,
              revenue_amount: appointment?.total_amount,
              doctor_name: appointment?.doctors?.full_name
            });
          } else {
            callback(notification);
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(subscription);
      }
    };
  }
}
