import { supabase } from '../supabaseClient';
import { NotificationService } from './notificationService';

export interface AppointmentCompletionData {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  clinicId: string;
  consultationNotes?: string;
  prescriptionGiven?: boolean;
  followUpRequired?: boolean;
  followUpDate?: string;
  diagnosis?: string;
  treatmentPlan?: string;
}

export interface AppointmentHistoryEntry {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  consultation_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  prescription_given: boolean;
  follow_up_required: boolean;
  follow_up_date?: string;
  doctor_name: string;
  clinic_name: string;
  payment_amount?: number;
  completed_at: string;
  created_at: string;
}

export class AppointmentCompletionService {
  /**
   * Complete an appointment with full notification and history tracking
   */
  static async completeAppointment(data: AppointmentCompletionData): Promise<{
    success: boolean;
    error?: string;
    historyEntry?: AppointmentHistoryEntry;
  }> {
    try {
      // Start a transaction-like operation
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients(first_name, last_name, email, phone),
          clinics(clinic_name, address),
          doctors(first_name, last_name, specialization)
        `)
        .eq('id', data.appointmentId)
        .single();

      if (appointmentError || !appointment) {
        return { success: false, error: 'Appointment not found' };
      }

      // 1. Update appointment status to completed
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'completed',
          doctor_notes: data.consultationNotes,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.appointmentId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // 2. Create appointment history entry
      const historyEntry = {
        appointment_id: data.appointmentId,
        patient_id: data.patientId,
        doctor_id: data.doctorId,
        clinic_id: data.clinicId,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        appointment_type: appointment.appointment_type,
        status: 'completed',
        consultation_notes: data.consultationNotes,
        diagnosis: data.diagnosis,
        treatment_plan: data.treatmentPlan,
        prescription_given: data.prescriptionGiven || false,
        follow_up_required: data.followUpRequired || false,
        follow_up_date: data.followUpDate,
        doctor_name: appointment.doctors 
          ? `Dr. ${appointment.doctors.first_name} ${appointment.doctors.last_name}`
          : 'Unknown Doctor',
        clinic_name: appointment.clinics?.clinic_name || 'Unknown Clinic',
        payment_amount: appointment.payment_amount,
        completed_at: new Date().toISOString()
      };

      const { data: createdHistory, error: historyError } = await supabase
        .from('appointment_history')
        .insert(historyEntry)
        .select()
        .single();

      if (historyError) {
        console.error('Failed to create appointment history:', historyError);
        // Don't fail the entire operation if history creation fails
      }

      // 3. Send completion notification to patient
      const patientResult = await supabase
        .from('patients')
        .select('first_name, last_name')
        .eq('id', data.patientId)
        .single();

      // Get patient name for notifications (used in follow-up notifications)
      const patientName = patientResult.data?.first_name + ' ' + patientResult.data?.last_name;

      const doctorName = appointment.doctors 
        ? `Dr. ${appointment.doctors.first_name} ${appointment.doctors.last_name}`
        : 'Your doctor';

      const clinicName = appointment.clinics?.clinic_name || 'the clinic';

      await NotificationService.createNotification({
        user_id: data.patientId,
        appointment_id: data.appointmentId,
        type: 'appointment_completed',
        title: 'Appointment Completed',
        message: `Your appointment with ${doctorName} at ${clinicName} has been completed. You can now view your consultation notes and any prescriptions in your medical history.`,
        priority: 'normal',
        action_url: `/patient/history?appointment=${data.appointmentId}`,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      });

      // 4. If follow-up is required, create a reminder notification
      if (data.followUpRequired && data.followUpDate) {
        const followUpDate = new Date(data.followUpDate);

        await NotificationService.createNotification({
          user_id: data.patientId,
          appointment_id: data.appointmentId,
          title: 'Follow-up Appointment Reminder',
          message: `You have a follow-up appointment scheduled for ${followUpDate.toLocaleDateString()} with ${doctorName} (${patientName}). Please contact ${clinicName} to confirm your appointment.`,
          type: 'appointment_reminder',
          priority: 'normal',
          action_url: `/patient/appointments`,
          expires_at: followUpDate.toISOString()
        });
      }

      // 5. Create a review request notification (delayed by 2 hours)
      
      await NotificationService.createNotification({
        user_id: data.patientId,
        appointment_id: data.appointmentId,
        title: 'Share Your Experience',
        message: `How was your appointment with ${doctorName}? Your feedback helps other patients and improves our service.`,
        type: 'review_request',
        priority: 'low',
        action_url: `/patient/reviews/create?appointment=${data.appointmentId}`,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });

      return {
        success: true,
        historyEntry: createdHistory as AppointmentHistoryEntry
      };

    } catch (error) {
      console.error('Error completing appointment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get appointment history for a patient
   */
  static async getPatientAppointmentHistory(patientId: string, options?: {
    limit?: number;
    offset?: number;
    clinicId?: string;
    doctorId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    success: boolean;
    data?: AppointmentHistoryEntry[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('appointment_history')
        .select('*', { count: 'exact' })
        .eq('patient_id', patientId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      // Apply filters
      if (options?.clinicId) {
        query = query.eq('clinic_id', options.clinicId);
      }

      if (options?.doctorId) {
        query = query.eq('doctor_id', options.doctorId);
      }

      if (options?.dateFrom) {
        query = query.gte('appointment_date', options.dateFrom);
      }

      if (options?.dateTo) {
        query = query.lte('appointment_date', options.dateTo);
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data as AppointmentHistoryEntry[],
        total: count || 0
      };

    } catch (error) {
      console.error('Error fetching appointment history:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get detailed appointment history entry
   */
  static async getAppointmentHistoryDetails(appointmentId: string): Promise<{
    success: boolean;
    data?: AppointmentHistoryEntry;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('appointment_history')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data as AppointmentHistoryEntry
      };

    } catch (error) {
      console.error('Error fetching appointment history details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
