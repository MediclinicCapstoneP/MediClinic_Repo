import { supabase } from '../supabaseClient';
import { NotificationService, Notification, CreateNotificationParams } from './notificationService';

export interface DoctorNotification extends Notification {
  clinic_id?: string;
  patient_name?: string;
  appointment_time?: string;
}

export interface DoctorNotificationParams extends CreateNotificationParams {
  clinic_id?: string;
  patient_name?: string;
  appointment_time?: string;
}

export class DoctorNotificationService extends NotificationService {
  /**
   * Get notifications specifically for doctors
   */
  static async getDoctorNotifications(
    doctorUserId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
      type?: Notification['type'];
    }
  ): Promise<{ notifications: DoctorNotification[]; error?: string }> {
    try {
      // First, get the doctor profile to find the doctor's name
      console.log('Fetching doctor profile for user ID:', doctorUserId);
      
      const { data: doctorProfile, error: doctorError } = await supabase
        .from('doctors')
        .select('full_name')
        .eq('user_id', doctorUserId)
        .single();

      if (doctorError) {
        console.error('Error fetching doctor profile:', doctorError);
        return { notifications: [], error: doctorError.message };
      }

      if (!doctorProfile) {
        console.log('No doctor profile found for user ID:', doctorUserId);
        return { notifications: [] };
      }

      // Use the full_name directly instead of constructing it
      const doctorName = doctorProfile.full_name;

      console.log('Doctor name found:', doctorName);

      // Now get appointments using the doctor's name
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_name,
          appointment_date,
          appointment_time,
          clinic_id,
          status,
          created_at,
          doctor_name
        `)
        .eq('doctor_name', doctorName)
        .order('created_at', { ascending: false });

      console.log('Appointments query result:', { appointments, appointmentsError });

      if (appointmentsError) {
        console.error('Error fetching doctor appointments:', appointmentsError);
        return { notifications: [], error: appointmentsError.message };
      }

      if (!appointments || appointments.length === 0) {
        console.log('No appointments found for doctor ID:', doctorUserId);
        return { notifications: [] };
      }

      // Create notifications from appointments
      const notifications: DoctorNotification[] = (appointments || []).map(appointment => ({
        id: `appointment_${appointment.id}`,
        user_id: doctorUserId,
        type: 'appointment_confirmed' as const,
        title: 'New Appointment',
        message: `You have an appointment with ${appointment.patient_name}`,
        data: {
          appointment_id: appointment.id,
          patient_name: appointment.patient_name,
          appointment_time: appointment.appointment_time
        },
        priority: 'normal' as const,
        is_read: false,
        created_at: appointment.created_at,
        updated_at: appointment.created_at,
        expires_at: undefined,
        patient_name: appointment.patient_name,
        appointment_time: appointment.appointment_time,
        clinic_id: appointment.clinic_id
      }));

      // Apply filters
      let filteredNotifications = notifications;

      if (options?.unreadOnly) {
        filteredNotifications = filteredNotifications.filter(n => !n.is_read);
      }

      if (options?.type) {
        filteredNotifications = filteredNotifications.filter(n => n.type === options.type);
      }

      if (options?.limit) {
        filteredNotifications = filteredNotifications.slice(0, options.limit);
      }

      if (options?.offset) {
        const start = options.offset;
        const end = start + (options.limit || 10);
        filteredNotifications = filteredNotifications.slice(start, end);
      }

      return { notifications };
    } catch (error) {
      console.error('Error in getDoctorNotifications:', error);
      return { notifications: [], error: 'Failed to fetch doctor notifications' };
    }
  }

  /**
   * Create appointment-related notification for doctor
   */
  static async createAppointmentNotificationForDoctor(
    params: {
      doctorUserId: string;
      appointmentId: string;
      type: 'appointment_confirmed' | 'appointment_cancelled' | 'appointment_reminder';
      patientName: string;
      appointmentTime: string;
      clinicId: string;
    }
  ): Promise<{ notification?: DoctorNotification; error?: string }> {
    try {
      const { doctorUserId, appointmentId, type, patientName, appointmentTime, clinicId } = params;

      let title = '';
      let message = '';
      let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

      switch (type) {
        case 'appointment_confirmed':
          title = 'New Appointment Confirmed';
          message = `New appointment with ${patientName} scheduled for ${new Date(appointmentTime).toLocaleString()}`;
          priority = 'normal';
          break;
        case 'appointment_cancelled':
          title = 'Appointment Cancelled';
          message = `Appointment with ${patientName} scheduled for ${new Date(appointmentTime).toLocaleString()} has been cancelled`;
          priority = 'high';
          break;
        case 'appointment_reminder':
          title = 'Upcoming Appointment';
          message = `Reminder: You have an appointment with ${patientName} in 30 minutes`;
          priority = 'high';
          break;
      }

      const notificationParams: CreateNotificationParams = {
        user_id: doctorUserId,
        appointment_id: appointmentId,
        title,
        message,
        type,
        priority,
        action_url: `/doctor/appointments/${appointmentId}`,
        action_text: 'View Appointment',
        metadata: {
          patient_name: patientName,
          appointment_time: appointmentTime,
          clinic_id: clinicId
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
          appointment_time: appointmentTime,
          clinic_id: clinicId
        }
      };
    } catch (error) {
      console.error('Error creating doctor appointment notification:', error);
      return { error: 'Failed to create doctor notification' };
    }
  }

  /**
   * Create patient message notification for doctor
   */
  static async createPatientMessageNotification(
    doctorUserId: string,
    patientName: string,
    message: string,
    appointmentId?: string
  ): Promise<{ notification?: DoctorNotification; error?: string }> {
    try {
      const notificationParams: CreateNotificationParams = {
        user_id: doctorUserId,
        appointment_id: appointmentId,
        title: 'New Patient Message',
        message: `${patientName}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        type: 'system',
        priority: 'normal',
        action_url: appointmentId ? `/doctor/appointments/${appointmentId}` : '/doctor/messages',
        action_text: 'View Message'
      };

      const { notification, error } = await this.createNotification(notificationParams);

      if (error) {
        return { error };
      }

      return { 
        notification: {
          ...notification!,
          patient_name: patientName
        }
      };
    } catch (error) {
      console.error('Error creating patient message notification:', error);
      return { error: 'Failed to create patient message notification' };
    }
  }

  /**
   * Create schedule change notification for doctor
   */
  static async createScheduleChangeNotification(
    doctorUserId: string,
    changeType: 'added' | 'modified' | 'cancelled',
    scheduleDetails: string
  ): Promise<{ notification?: DoctorNotification; error?: string }> {
    try {
      let title = '';
      let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

      switch (changeType) {
        case 'added':
          title = 'Schedule Added';
          priority = 'normal';
          break;
        case 'modified':
          title = 'Schedule Modified';
          priority = 'normal';
          break;
        case 'cancelled':
          title = 'Schedule Cancelled';
          priority = 'high';
          break;
      }

      const notificationParams: CreateNotificationParams = {
        user_id: doctorUserId,
        title,
        message: scheduleDetails,
        type: 'system',
        priority,
        action_url: '/doctor/schedule',
        action_text: 'View Schedule'
      };

      const { notification, error } = await this.createNotification(notificationParams);

      if (error) {
        return { error };
      }

      return { notification: notification! };
    } catch (error) {
      console.error('Error creating schedule change notification:', error);
      return { error: 'Failed to create schedule change notification' };
    }
  }

  /**
   * Subscribe to real-time doctor notifications
   */
  static subscribeToDoctorNotifications(
    doctorUserId: string,
    callback: (notification: DoctorNotification) => void
  ): { unsubscribe: () => void } {
    const subscription = supabase
      .channel('doctor_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${doctorUserId}`
        },
        async (payload) => {
          const notification = payload.new as Notification;
          
          // Fetch additional appointment details if available
          if (notification.appointment_id) {
            const { data: appointment } = await supabase
              .from('appointments')
              .select('patient_name, appointment_time, clinic_id')
              .eq('id', notification.appointment_id)
              .single();

            callback({
              ...notification,
              patient_name: appointment?.patient_name,
              appointment_time: appointment?.appointment_time,
              clinic_id: appointment?.clinic_id
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
