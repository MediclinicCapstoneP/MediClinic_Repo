import { supabase } from '../supabaseClient';
import { AppointmentService } from '../features/auth/utils/appointmentService';

export interface BookingData {
  patient_id: string;
  clinic_id: string;
  doctor_id?: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  duration_minutes?: number;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  payment_amount?: number;
  services?: string[];
}

export interface BookingResult {
  success: boolean;
  appointment?: any;
  error?: string;
  warnings?: string[];
}

class EnhancedAppointmentBookingService {
  /**
   * Book an appointment with comprehensive validation and data consistency
   */
  async bookAppointment(bookingData: BookingData): Promise<BookingResult> {
    try {
      const warnings: string[] = [];
      
      // Step 1: Validate booking data
      const validation = await this.validateBookingData(bookingData);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }
      
      // Step 2: Check time slot availability
      const availabilityCheck = await this.checkTimeSlotAvailability(bookingData);
      if (!availabilityCheck.available) {
        return {
          success: false,
          error: availabilityCheck.reason || 'Time slot not available'
        };
      }
      
      // Step 3: Get patient details for proper name population
      const patientDetails = await this.getPatientDetails(bookingData.patient_id);
      if (!patientDetails) {
        warnings.push('Patient details could not be retrieved, appointment will show generic patient info');
      }
      
      // Step 4: Prepare appointment data with proper patient name
      const appointmentData = {
        ...bookingData,
        patient_name: patientDetails ? 
          `${patientDetails.first_name || ''} ${patientDetails.last_name || ''}`.trim() || 
          patientDetails.full_name || 
          'Patient' :
          'Unknown Patient',
        status: 'scheduled',
        confirmation_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Step 5: Create the appointment using the enhanced AppointmentService
      const appointment = await AppointmentService.createAppointment(appointmentData);
      
      if (!appointment) {
        return {
          success: false,
          error: 'Failed to create appointment'
        };
      }
      
      // Step 6: Post-booking tasks
      await this.handlePostBookingTasks(appointment, bookingData);
      
      return {
        success: true,
        appointment,
        warnings: warnings.length > 0 ? warnings : undefined
      };
      
    } catch (error) {
      console.error('Error in enhanced appointment booking:', error);
      return {
        success: false,
        error: 'Failed to book appointment: ' + (error as Error).message
      };
    }
  }
  
  /**
   * Validate booking data comprehensively
   */
  private async validateBookingData(bookingData: BookingData): Promise<{
    valid: boolean;
    error?: string;
  }> {
    // Required fields validation
    if (!bookingData.patient_id || !bookingData.clinic_id || 
        !bookingData.appointment_date || !bookingData.appointment_time || 
        !bookingData.appointment_type) {
      return {
        valid: false,
        error: 'Missing required booking information'
      };
    }
    
    // Date validation - cannot book in the past
    const appointmentDateTime = new Date(`${bookingData.appointment_date}T${bookingData.appointment_time}`);
    const now = new Date();
    
    if (appointmentDateTime < now) {
      return {
        valid: false,
        error: 'Cannot book appointments in the past'
      };
    }
    
    // Validate that patient exists
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select('id')
        .eq('id', bookingData.patient_id)
        .single();
      
      if (error || !patient) {
        return {
          valid: false,
          error: 'Patient not found'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Error validating patient'
      };
    }
    
    // Validate that clinic exists
    try {
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('id')
        .eq('id', bookingData.clinic_id)
        .single();
      
      if (error || !clinic) {
        return {
          valid: false,
          error: 'Clinic not found'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Error validating clinic'
      };
    }
    
    // Validate doctor if specified
    if (bookingData.doctor_id) {
      try {
        const { data: doctor, error } = await supabase
          .from('doctors')
          .select('id, status')
          .eq('id', bookingData.doctor_id)
          .single();
        
        if (error || !doctor) {
          return {
            valid: false,
            error: 'Doctor not found'
          };
        }
        
        if (doctor.status !== 'active') {
          return {
            valid: false,
            error: 'Doctor is not available for appointments'
          };
        }
      } catch (error) {
        return {
          valid: false,
          error: 'Error validating doctor'
        };
      }
    }
    
    return { valid: true };
  }
  
  /**
   * Check if the requested time slot is available
   */
  private async checkTimeSlotAvailability(bookingData: BookingData): Promise<{
    available: boolean;
    reason?: string;
  }> {
    try {
      const duration = bookingData.duration_minutes || 30;
      
      // Check if time slot is available using AppointmentService
      const isAvailable = await AppointmentService.isTimeSlotAvailable(
        bookingData.clinic_id,
        bookingData.appointment_date,
        bookingData.appointment_time,
        duration
      );
      
      if (!isAvailable) {
        return {
          available: false,
          reason: 'Time slot is already booked'
        };
      }
      
      // Additional checks for doctor availability if specified
      if (bookingData.doctor_id) {
        const { data: doctorAppointments, error } = await supabase
          .from('appointments')
          .select('appointment_time, duration_minutes')
          .eq('doctor_id', bookingData.doctor_id)
          .eq('appointment_date', bookingData.appointment_date)
          .neq('status', 'cancelled');
        
        if (error) {
          return {
            available: false,
            reason: 'Error checking doctor availability'
          };
        }
        
        // Check for conflicts with doctor's existing appointments
        const requestedStart = new Date(`2000-01-01T${bookingData.appointment_time}`);
        const requestedEnd = new Date(requestedStart.getTime() + duration * 60000);
        
        for (const appointment of doctorAppointments || []) {
          const existingStart = new Date(`2000-01-01T${appointment.appointment_time}`);
          const existingEnd = new Date(existingStart.getTime() + (appointment.duration_minutes || 30) * 60000);
          
          if (requestedStart < existingEnd && requestedEnd > existingStart) {
            return {
              available: false,
              reason: 'Doctor has a conflicting appointment'
            };
          }
        }
      }
      
      return { available: true };
      
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return {
        available: false,
        reason: 'Error checking availability'
      };
    }
  }
  
  /**
   * Get patient details for proper name population
   */
  private async getPatientDetails(patientId: string): Promise<any> {
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, full_name, email, phone')
        .eq('id', patientId)
        .single();
      
      if (error || !patient) {
        console.warn('Could not retrieve patient details for:', patientId);
        return null;
      }
      
      return patient;
    } catch (error) {
      console.error('Error getting patient details:', error);
      return null;
    }
  }
  
  /**
   * Handle post-booking tasks like notifications, confirmations, etc.
   */
  private async handlePostBookingTasks(appointment: any, bookingData: BookingData): Promise<void> {
    try {
      // Task 1: Send confirmation email if patient has email
      try {
        const patient = await this.getPatientDetails(bookingData.patient_id);
        if (patient?.email) {
          // Note: Implement actual email sending here
          console.log('TODO: Send confirmation email to:', patient.email);
        }
      } catch (error) {
        console.warn('Failed to send confirmation email:', error);
      }
      
      // Task 2: Create appointment services if specified
      if (bookingData.services && bookingData.services.length > 0) {
        try {
          const serviceRecords = bookingData.services.map(service => ({
            appointment_id: appointment.id,
            service_name: service,
            status: 'scheduled'
          }));
          
          await supabase
            .from('appointment_services')
            .insert(serviceRecords);
        } catch (error) {
          console.warn('Failed to create appointment services:', error);
        }
      }
      
      // Task 3: Update clinic stats
      try {
        await supabase.rpc('increment_clinic_appointment_count', {
          clinic_id_param: bookingData.clinic_id
        });
      } catch (error) {
        console.warn('Failed to update clinic stats:', error);
      }
      
    } catch (error) {
      console.error('Error in post-booking tasks:', error);
      // Don't fail the booking if post-tasks fail
    }
  }
  
  /**
   * Reschedule an existing appointment
   */
  async rescheduleAppointment(appointmentId: string, newDate: string, newTime: string): Promise<BookingResult> {
    try {
      // Get existing appointment
      const existingAppointment = await AppointmentService.getAppointmentById(appointmentId);
      if (!existingAppointment) {
        return {
          success: false,
          error: 'Appointment not found'
        };
      }
      
      // Check new time slot availability
      const availabilityCheck = await this.checkTimeSlotAvailability({
        ...existingAppointment,
        appointment_date: newDate,
        appointment_time: newTime
      });
      
      if (!availabilityCheck.available) {
        return {
          success: false,
          error: availabilityCheck.reason || 'New time slot not available'
        };
      }
      
      // Update the appointment
      const updatedAppointment = await AppointmentService.updateAppointment(appointmentId, {
        appointment_date: newDate,
        appointment_time: newTime,
        status: 'rescheduled',
        updated_at: new Date().toISOString()
      });
      
      if (!updatedAppointment) {
        return {
          success: false,
          error: 'Failed to reschedule appointment'
        };
      }
      
      return {
        success: true,
        appointment: updatedAppointment
      };
      
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return {
        success: false,
        error: 'Failed to reschedule appointment'
      };
    }
  }
  
  /**
   * Cancel an appointment with proper cleanup
   */
  async cancelAppointment(appointmentId: string, reason?: string): Promise<BookingResult> {
    try {
      const cancelledAppointment = await AppointmentService.cancelAppointment(appointmentId, reason);
      
      if (!cancelledAppointment) {
        return {
          success: false,
          error: 'Failed to cancel appointment'
        };
      }
      
      return {
        success: true,
        appointment: cancelledAppointment
      };
      
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return {
        success: false,
        error: 'Failed to cancel appointment'
      };
    }
  }
  
  /**
   * Get available time slots for a clinic and date
   */
  async getAvailableTimeSlots(clinicId: string, date: string, durationMinutes: number = 30): Promise<{
    success: boolean;
    timeSlots?: string[];
    error?: string;
  }> {
    try {
      const timeSlots = await AppointmentService.getAvailableTimeSlots(clinicId, date, durationMinutes);
      
      return {
        success: true,
        timeSlots
      };
    } catch (error) {
      console.error('Error getting available time slots:', error);
      return {
        success: false,
        error: 'Failed to get available time slots'
      };
    }
  }
}

export const enhancedAppointmentBookingService = new EnhancedAppointmentBookingService();
export default enhancedAppointmentBookingService;