import { supabase } from '../../../supabaseClient';

interface TimeSlot {
  time: string;
  available: boolean;
  formatted: string;
}

interface CreateAppointmentData {
  patient_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  patient_notes?: string;
  status: string;
}

export const appointmentBookingService = {
  /**
   * Get available time slots for a clinic on a specific date
   */
  async getAvailableTimeSlots(clinicId: string, date: string): Promise<TimeSlot[]> {
    try {
      // Get clinic operating hours
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('operating_hours')
        .eq('id', clinicId)
        .single();

      if (clinicError) {
        console.error('Error fetching clinic hours:', clinicError);
        return this.getDefaultTimeSlots();
      }

      // Get existing appointments for this date
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('clinic_id', clinicId)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed']);

      if (appointmentsError) {
        console.error('Error fetching existing appointments:', appointmentsError);
      }

      const bookedTimes = new Set(
        existingAppointments?.map(apt => apt.appointment_time) || []
      );

      // Generate time slots based on operating hours
      const dayOfWeek = new Date(date).getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      
      const operatingHours = clinic?.operating_hours?.[dayName];
      
      if (!operatingHours || !operatingHours.open || !operatingHours.close) {
        return []; // Clinic is closed on this day
      }

      return this.generateTimeSlots(
        operatingHours.open,
        operatingHours.close,
        bookedTimes,
        30 // 30-minute slots
      );
    } catch (error) {
      console.error('Error getting available time slots:', error);
      return this.getDefaultTimeSlots();
    }
  },

  /**
   * Generate time slots between open and close times
   */
  generateTimeSlots(
    openTime: string,
    closeTime: string,
    bookedTimes: Set<string>,
    intervalMinutes: number = 30
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);
    
    const startTime = openHour * 60 + openMinute;
    const endTime = closeHour * 60 + closeMinute;
    
    for (let time = startTime; time < endTime; time += intervalMinutes) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Skip lunch break (12:00-13:00)
      if (hour === 12) continue;
      
      slots.push({
        time: timeString,
        available: !bookedTimes.has(timeString),
        formatted: new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      });
    }
    
    return slots;
  },

  /**
   * Get default time slots when clinic hours are not available
   */
  getDefaultTimeSlots(): TimeSlot[] {
    const defaultSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    return defaultSlots.map(time => ({
      time,
      available: true,
      formatted: new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }));
  },

  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData: CreateAppointmentData): Promise<{
    success: boolean;
    appointment?: any;
    error?: string;
  }> {
    try {
      console.log('📅 Creating appointment:', appointmentData);

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([{
          ...appointmentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating appointment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Appointment created successfully:', appointment.id);
      return { success: true, appointment };
    } catch (error) {
      console.error('❌ Unexpected error creating appointment:', error);
      return { success: false, error: 'Failed to create appointment' };
    }
  },

  /**
   * Create appointment notification
   */
  async createAppointmentNotification(
    patientId: string,
    clinicName: string,
    appointmentDate: string,
    appointmentTime: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
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

      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: patientId,
          user_type: 'patient',
          title: 'Appointment Confirmed',
          message: `Your appointment at ${clinicName} has been scheduled for ${formattedDate} at ${formattedTime}`,
          type: 'appointment_confirmation',
          is_read: false,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('❌ Error creating notification:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Appointment notification created');
      return { success: true };
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      return { success: false, error: 'Failed to create notification' };
    }
  },

  /**
   * Get patient notifications
   */
  async getPatientNotifications(patientId: string): Promise<{
    success: boolean;
    notifications?: any[];
    error?: string;
  }> {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', patientId)
        .eq('user_type', 'patient')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Error fetching notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true, notifications: notifications || [] };
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return { success: false, error: 'Failed to fetch notifications' };
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{
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
   * Get unread notification count
   */
  async getUnreadNotificationCount(patientId: string): Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', patientId)
        .eq('user_type', 'patient')
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
