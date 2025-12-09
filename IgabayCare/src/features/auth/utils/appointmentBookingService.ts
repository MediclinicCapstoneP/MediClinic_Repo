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
  notes?: string;
  status: string;
  patient_name?: string;
  // Payment fields
  payment_method?: string;
  payment_status?: string;
  payment_intent_id?: string;
  total_amount?: number;
  consultation_fee?: number;
  booking_fee?: number;
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

      // Fetch patient name if not provided
      let patientName = appointmentData.patient_name;
      if (!patientName && appointmentData.patient_id) {
        try {
          const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('first_name, last_name, email')
            .eq('id', appointmentData.patient_id)
            .single();
          
          if (!patientError && patient) {
            if (patient.first_name && patient.last_name) {
              patientName = `${patient.first_name} ${patient.last_name}`;
            } else if (patient.first_name) {
              patientName = patient.first_name;
            } else if (patient.email) {
              patientName = patient.email.split('@')[0];
            }
            console.log('📋 Resolved patient name:', patientName);
          } else {
            console.warn('⚠️ Could not fetch patient name:', patientError?.message);
          }
        } catch (patientFetchError) {
          console.warn('⚠️ Error fetching patient:', patientFetchError);
        }
      }

      // Prepare appointment data with proper field mapping
      const appointmentToInsert = {
        patient_id: appointmentData.patient_id,
        clinic_id: appointmentData.clinic_id,
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        appointment_type: appointmentData.appointment_type,
        status: appointmentData.status,
        // Map patient_notes to the correct field
        notes: appointmentData.patient_notes || appointmentData.notes,
        patient_notes: appointmentData.patient_notes,
        // Add patient name
        patient_name: patientName,
        // Add payment fields if provided
        ...(appointmentData.payment_method && { payment_method: appointmentData.payment_method }),
        ...(appointmentData.payment_status && { payment_status: appointmentData.payment_status }),
        ...(appointmentData.payment_intent_id && { payment_intent_id: appointmentData.payment_intent_id }),
        ...(appointmentData.total_amount && { 
          total_amount: appointmentData.total_amount,
          payment_amount: appointmentData.total_amount // Also set payment_amount from total_amount
        }),
        ...(appointmentData.consultation_fee && { consultation_fee: appointmentData.consultation_fee }),
        ...(appointmentData.booking_fee && { booking_fee: appointmentData.booking_fee }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📋 Final appointment data:', appointmentToInsert);

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([appointmentToInsert])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating appointment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Appointment created successfully:', {
        id: appointment.id,
        patient_name: appointment.patient_name,
        notes: appointment.notes,
        patient_notes: appointment.patient_notes
      });
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
    appointmentTime: string,
    appointmentId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get patient's user_id from the patients table
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('user_id')
        .eq('id', patientId)
        .single();

      if (patientError || !patient?.user_id) {
        console.error('❌ Error getting patient user_id:', patientError);
        return { success: false, error: 'Patient user account not found' };
      }

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
          user_id: patient.user_id, // Use the patient's user_id, not patient record ID
          appointment_id: appointmentId || null, // Use appointment ID if provided
          title: 'Appointment Confirmed',
          message: `Your appointment at ${clinicName} has been scheduled for ${formattedDate} at ${formattedTime}`,
          type: 'appointment_confirmed',
          is_read: false
        }]);

      if (error) {
        console.error('❌ Error creating notification:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Appointment notification created for user:', patient.user_id);
      return { success: true };
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      return { success: false, error: 'Failed to create notification' };
    }
  },

  /**
   * Create payment success notification
   */
  async createPaymentSuccessNotification(
    patientId: string,
    clinicName: string,
    appointmentDate: string,
    appointmentTime: string,
    amount: number,
    appointmentId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get patient's user_id from the patients table
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('user_id')
        .eq('id', patientId)
        .single();

      if (patientError || !patient?.user_id) {
        console.error('❌ Error getting patient user_id for payment notification:', patientError);
        return { success: false, error: 'Patient user account not found' };
      }

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
          user_id: patient.user_id, // Use the patient's user_id, not patient record ID
          appointment_id: appointmentId || null, // Use appointment ID if provided
          title: 'Payment Successful',
          message: `Payment of ₱${amount.toFixed(2)} for your appointment at ${clinicName} on ${formattedDate} at ${formattedTime} has been successfully processed.`,
          type: 'system', // Use 'system' type for payment notifications since 'payment_successful' is not in the allowed list
          is_read: false
        }]);

      if (error) {
        console.error('❌ Error creating payment notification:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Payment success notification created for user:', patient.user_id);
      return { success: true };
    } catch (error) {
      console.error('❌ Error creating payment notification:', error);
      return { success: false, error: 'Failed to create payment notification' };
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
