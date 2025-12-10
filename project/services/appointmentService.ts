import { supabase } from '../lib/supabase';
import {
  Appointment,
  AppointmentWithDetails,
  AppointmentStatus,
  PaymentMethod,
  PaymentStatus,
} from '../lib/supabase';

export interface CreateAppointmentData {
  patient_id: string;
  clinic_id: string;
  doctor_id?: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  duration_minutes?: number;
  symptoms?: string;
  patient_notes?: string;
  consultation_fee?: number;
  booking_fee?: number;
}

export interface AppointmentFilters {
  patient_id?: string;
  clinic_id?: string;
  doctor_id?: string;
  status?: AppointmentStatus[];
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  doctor_id?: string;
  doctor_name?: string;
  consultation_fee: number;
}

export interface PaymentRequest {
  appointment_id: string;
  payment_method: PaymentMethod;
  amount: number;
}

class AppointmentService {
  /**
   * Create a new appointment
   */
  async createAppointment(data: CreateAppointmentData): Promise<{
    success: boolean;
    appointment?: Appointment;
    error?: string;
  }> {
    try {
      // Check if time slot is available
      const isAvailable = await this.checkTimeSlotAvailability(
        data.clinic_id,
        data.appointment_date,
        data.appointment_time,
        data.duration_minutes || 30
      );

      if (!isAvailable) {
        return {
          success: false,
          error: 'The selected time slot is no longer available',
        };
      }

      // Fetch patient and doctor details for denormalized fields
      let patientName: string | null = null;
      let patientEmail: string | null = null;
      let patientPhone: string | null = null;
      let doctorName: string | null = null;
      let doctorSpecialty: string | null = null;

      try {
        const { data: patient } = await supabase
          .from('patients')
          .select('first_name, last_name, email, phone')
          .eq('id', data.patient_id)
          .single();

        if (patient) {
          patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || null;
          patientEmail = patient.email || null;
          patientPhone = patient.phone || null;
        }
      } catch (error) {
        console.warn('Could not fetch patient details:', error);
      }

      if (data.doctor_id) {
        try {
          const { data: doctor } = await supabase
            .from('doctors')
            .select('full_name, specialization')
            .eq('id', data.doctor_id)
            .single();

          if (doctor) {
            doctorName = doctor.full_name || null;
            doctorSpecialty = doctor.specialization || null;
          }
        } catch (error) {
          console.warn('Could not fetch doctor details:', error);
        }
      }

      // Create appointment with denormalized fields
      const appointmentData = {
        ...data,
        status: 'scheduled' as AppointmentStatus,
        payment_status: 'pending' as PaymentStatus,
        priority: 'normal',
        duration_minutes: data.duration_minutes || 30,
        consultation_fee: data.consultation_fee || 500,
        booking_fee: data.booking_fee || 50,
        total_amount: (data.consultation_fee || 500) + (data.booking_fee || 50),
        // Denormalized fields for better querying
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        doctor_name: doctorName,
        doctor_specialty: doctorSpecialty,
      };

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        return {
          success: false,
          error: 'Failed to create appointment',
        };
      }

      return {
        success: true,
        appointment,
      };
    } catch (error) {
      console.error('Error in createAppointment:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get appointment with full details
   */
  async getAppointmentWithDetails(id: string): Promise<{
    success: boolean;
    appointment?: AppointmentWithDetails;
    error?: string;
  }> {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (
            id, first_name, last_name, email, phone, 
            date_of_birth, profile_pic_url
          ),
          clinics:clinic_id (
            id, clinic_name, address, phone, email,
            operating_hours, profile_pic_url, latitude, longitude
          ),
          doctors:doctor_id (
            id, full_name, specialization, email, phone,
            profile_picture_url
          ),
          transactions!appointment_id (
            id, amount, payment_method, status,
            transaction_id, created_at
          ),
          reviews!appointment_id (
            id, rating, review_text, created_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching appointment:', error);
        return {
          success: false,
          error: 'Appointment not found',
        };
      }

      return {
        success: true,
        appointment: {
          ...appointment,
          patient: appointment.patients,
          clinic: appointment.clinics,
          doctor: appointment.doctors,
          payment: appointment.transactions?.[0],
          review: appointment.reviews?.[0],
        },
      };
    } catch (error) {
      console.error('Error in getAppointmentWithDetails:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get appointments with filters and pagination
   */
  async getAppointments(filters: AppointmentFilters): Promise<{
    success: boolean;
    appointments?: AppointmentWithDetails[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (
            id, first_name, last_name, email, phone, profile_pic_url
          ),
          clinics:clinic_id (
            id, clinic_name, address, phone, profile_pic_url
          ),
          doctors:doctor_id (
            id, full_name, specialization, profile_picture_url
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.patient_id) {
        query = query.eq('patient_id', filters.patient_id);
      }
      if (filters.clinic_id) {
        query = query.eq('clinic_id', filters.clinic_id);
      }
      if (filters.doctor_id) {
        query = query.eq('doctor_id', filters.doctor_id);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.date_from) {
        query = query.gte('appointment_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('appointment_date', filters.date_to);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query
        .range(from, to)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      const { data: appointments, error, count } = await query;

      if (error) {
        console.error('Error fetching appointments:', error);
        return {
          success: false,
          error: 'Failed to fetch appointments',
        };
      }

      // Transform the data to match AppointmentWithDetails interface
      const enhancedAppointments: AppointmentWithDetails[] = (appointments || []).map(apt => ({
        ...apt,
        patient: apt.patients,
        clinic: apt.clinics,
        doctor: apt.doctors,
      }));

      return {
        success: true,
        appointments: enhancedAppointments,
        total: count || 0,
      };
    } catch (error) {
      console.error('Error in getAppointments:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get available time slots for a clinic on a specific date
   */
  async getAvailableTimeSlots(
    clinicId: string,
    date: string
  ): Promise<{
    success: boolean;
    timeSlots?: TimeSlot[];
    error?: string;
  }> {
    try {
      // Get clinic operating hours
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('operating_hours')
        .eq('id', clinicId)
        .single();

      if (clinicError || !clinic) {
        return {
          success: false,
          error: 'Clinic not found',
        };
      }

      // Get existing appointments for the date
      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, duration_minutes, doctor_id')
        .eq('clinic_id', clinicId)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed', 'payment_confirmed', 'in_progress']);

      if (appointmentsError) {
        console.error('Error fetching existing appointments:', appointmentsError);
        return {
          success: false,
          error: 'Failed to check availability',
        };
      }

      // Get clinic doctors
      const { data: doctors, error: doctorsError } = await supabase
        .from('doctors')
        .select('id, full_name')
        .eq('clinic_id', clinicId)
        .eq('status', 'active');

      if (doctorsError) {
        console.error('Error fetching doctors:', doctorsError);
      }

      // Generate time slots based on operating hours
      const timeSlots = this.generateTimeSlots(
        clinic.operating_hours,
        date,
        existingAppointments || [],
        doctors || []
      );

      return {
        success: true,
        timeSlots,
      };
    } catch (error) {
      console.error('Error in getAvailableTimeSlots:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    notes?: string
  ): Promise<{
    success: boolean;
    appointment?: Appointment;
    error?: string;
  }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.doctor_notes = notes;
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data: appointment, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        return {
          success: false,
          error: 'Failed to update appointment',
        };
      }

      return {
        success: true,
        appointment,
      };
    } catch (error) {
      console.error('Error in updateAppointmentStatus:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    id: string,
    reason: string,
    cancelledBy: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Check if appointment can be cancelled (24 hours before)
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time, payment_status')
        .eq('id', id)
        .single();

      if (fetchError || !appointment) {
        return {
          success: false,
          error: 'Appointment not found',
        };
      }

      const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
      const now = new Date();
      const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilAppointment < 24) {
        return {
          success: false,
          error: 'Appointments can only be cancelled 24 hours in advance',
        };
      }

      // Update appointment
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: cancelledBy,
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error cancelling appointment:', updateError);
        return {
          success: false,
          error: 'Failed to cancel appointment',
        };
      }

      // TODO: Process refund if payment was made
      if (appointment.payment_status === 'paid') {
        // Implement refund logic here
        console.log('Processing refund for cancelled appointment');
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error in cancelAppointment:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Process payment for appointment
   */
  async processPayment(paymentRequest: PaymentRequest): Promise<{
    success: boolean;
    transactionNumber?: string;
    error?: string;
  }> {
    try {
      // Generate mock transaction number for now
      const transactionNumber = `TXN${Date.now()}${Math.random().toString(36).substr(2, 5)}`;

      // Update appointment with payment details directly
      const { data: appointment, error: updateError } = await supabase
        .from('appointments')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_amount: paymentRequest.amount,
          payment_method: paymentRequest.payment_method,
          payment_intent_id: transactionNumber, // Using transaction number as payment_intent_id
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentRequest.appointment_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating appointment payment status:', updateError);
        return {
          success: false,
          error: 'Failed to process payment',
        };
      }

      // Create notification for successful payment
      if (appointment) {
        // Get patient's user_id from the patients table
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .select('user_id')
          .eq('id', appointment.patient_id)
          .single();

        if (patientError || !patient?.user_id) {
          console.error('Error fetching patient user_id:', patientError);
          // Continue with payment processing even if notification fails
        } else {
          const appointmentDate = new Date(appointment.appointment_date);
          const appointmentTime = appointment.appointment_time;
          const formattedDate = appointmentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          // Format time (assuming it's in HH:MM format)
          const [hours, minutes] = appointmentTime.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const formattedHour = hour % 12 || 12;
          const formattedTime = `${formattedHour}:${minutes} ${ampm}`;

          // Check if notification already exists before creating
          const { data: existingNotification } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', patient.user_id)
            .eq('appointment_id', paymentRequest.appointment_id)
            .eq('type', 'system')
            .maybeSingle();

          if (!existingNotification) {
            const { error: insertError } = await supabase
              .from('notifications')
              .insert([{
                user_id: patient.user_id, // Use patient's user_id, not patient_id
                user_type: 'patient',
                title: 'Appointment Confirmed & Payment Successful',
                message: `Your appointment on ${formattedDate} at ${formattedTime} has been confirmed. Payment of ₱${paymentRequest.amount.toFixed(2)} was successful.`,
                type: 'system',
                is_read: false,
                appointment_id: paymentRequest.appointment_id,
              }]);

            if (insertError) {
              // Ignore conflict errors (409) - notification already exists
              if (insertError.code !== '23505' && insertError.code !== '409') {
                console.error('Error creating notification:', insertError);
              }
              // Log error but don't fail payment processing
            }
          } else {
            // Notification already exists, which is fine
            console.log('Notification already exists for this appointment payment');
          }
        }
      }

      return {
        success: true,
        transactionNumber,
      };
    } catch (error) {
      console.error('Error in processPayment:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during payment processing',
      };
    }
  }

  /**
   * Private helper methods
   */
  private async checkTimeSlotAvailability(
    clinicId: string,
    date: string,
    time: string,
    duration: number
  ): Promise<boolean> {
    try {
      const startTime = new Date(`${date}T${time}`);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const { data: conflictingAppointments, error } = await supabase
        .from('appointments')
        .select('appointment_time, duration_minutes')
        .eq('clinic_id', clinicId)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed', 'payment_confirmed', 'in_progress']);

      if (error) {
        console.error('Error checking availability:', error);
        return false;
      }

      // Check for time conflicts
      for (const apt of conflictingAppointments || []) {
        const existingStart = new Date(`${date}T${apt.appointment_time}`);
        const existingEnd = new Date(existingStart.getTime() + (apt.duration_minutes || 30) * 60000);

        if (
          (startTime >= existingStart && startTime < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)
        ) {
          return false; // Conflict found
        }
      }

      return true;
    } catch (error) {
      console.error('Error in checkTimeSlotAvailability:', error);
      return false;
    }
  }

  private generateTimeSlots(
    operatingHours: any,
    date: string,
    existingAppointments: any[],
    doctors: any[]
  ): TimeSlot[] {
    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    const dayHours = operatingHours?.[dayName];
    if (!dayHours || !dayHours.open || !dayHours.close) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const slotDuration = 30; // 30-minute slots
    const defaultFee = 500;

    // Generate time slots
    const startTime = this.timeStringToMinutes(dayHours.open);
    const endTime = this.timeStringToMinutes(dayHours.close);

    for (let time = startTime; time < endTime; time += slotDuration) {
      const timeStr = this.minutesToTimeString(time);
      
      // Check if this slot conflicts with existing appointments
      const isConflict = existingAppointments.some(apt => {
        const aptStart = this.timeStringToMinutes(apt.appointment_time);
        const aptEnd = aptStart + (apt.duration_minutes || 30);
        
        return time < aptEnd && (time + slotDuration) > aptStart;
      });

      // Get available doctor (simplified - just use first available)
      const availableDoctor = doctors.length > 0 ? doctors[0] : null;

      slots.push({
        time: timeStr,
        available: !isConflict,
        doctor_id: availableDoctor?.id,
        doctor_name: availableDoctor?.full_name,
        consultation_fee: defaultFee,
      });
    }

    return slots;
  }

  private timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

export const appointmentService = new AppointmentService();
