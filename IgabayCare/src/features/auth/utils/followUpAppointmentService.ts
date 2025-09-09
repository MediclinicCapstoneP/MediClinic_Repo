import { supabase } from '../../../supabaseClient';

interface FollowUpAppointmentData {
  originalAppointmentId: string;
  patientId: string;
  clinicId: string;
  doctorId?: string;
  followUpType: 'routine' | 'urgent' | 'check_results' | 'medication_review' | 'progress_check';
  recommendedDate: string;
  reason?: string;
  doctorNotes?: string;
}

interface ScheduleFollowUpData {
  followUpId: string;
  scheduledDate: string;
  appointmentTime: string;
  appointmentType?: string;
  patientNotes?: string;
}

export const followUpAppointmentService = {
  /**
   * Create a follow-up appointment recommendation
   */
  async createFollowUpRecommendation(data: FollowUpAppointmentData): Promise<{
    success: boolean;
    followUp?: any;
    error?: string;
  }> {
    try {
      console.log('📋 Creating follow-up recommendation:', data);

      // Get original appointment details for pricing calculation
      const { data: originalAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('appointment_date, payment_amount')
        .eq('id', data.originalAppointmentId)
        .single();

      if (appointmentError) {
        console.error('❌ Error fetching original appointment:', appointmentError);
        return { success: false, error: 'Failed to fetch original appointment details' };
      }

      // Calculate follow-up fee based on timing
      const originalDate = new Date(originalAppointment.appointment_date);
      const recommendedDate = new Date(data.recommendedDate);
      const daysDifference = Math.ceil((recommendedDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let isFree = false;
      let discountPercentage = 0;
      let originalFee = originalAppointment.payment_amount || 500; // Default consultation fee
      let discountedFee = originalFee;

      if (daysDifference <= 7) {
        // Free within 7 days
        isFree = true;
        discountedFee = 0;
      } else if (daysDifference <= 30) {
        // 50% discount within 30 days
        discountPercentage = 50;
        discountedFee = originalFee * 0.5;
      }

      const { data: followUp, error } = await supabase
        .from('follow_up_appointments')
        .insert([{
          original_appointment_id: data.originalAppointmentId,
          patient_id: data.patientId,
          clinic_id: data.clinicId,
          doctor_id: data.doctorId,
          follow_up_type: data.followUpType,
          recommended_date: data.recommendedDate,
          is_free: isFree,
          discount_percentage: discountPercentage,
          original_fee: originalFee,
          discounted_fee: discountedFee,
          doctor_notes: data.doctorNotes,
          reason: data.reason,
          status: 'recommended'
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating follow-up recommendation:', error);
        return { success: false, error: error.message };
      }

      // Create notification for patient
      await this.createFollowUpNotification(
        data.patientId,
        data.followUpType,
        data.recommendedDate,
        isFree,
        discountedFee
      );

      console.log('✅ Follow-up recommendation created:', followUp.id);
      return { success: true, followUp };
    } catch (error) {
      console.error('❌ Unexpected error creating follow-up:', error);
      return { success: false, error: 'Failed to create follow-up recommendation' };
    }
  },

  /**
   * Schedule a follow-up appointment
   */
  async scheduleFollowUpAppointment(data: ScheduleFollowUpData): Promise<{
    success: boolean;
    appointment?: any;
    transaction?: any;
    error?: string;
  }> {
    try {
      console.log('📅 Scheduling follow-up appointment:', data);

      // Get follow-up details
      const { data: followUp, error: followUpError } = await supabase
        .from('follow_up_appointments')
        .select('*')
        .eq('id', data.followUpId)
        .single();

      if (followUpError) {
        console.error('❌ Error fetching follow-up details:', followUpError);
        return { success: false, error: 'Follow-up recommendation not found' };
      }

      // Create the appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert([{
          patient_id: followUp.patient_id,
          clinic_id: followUp.clinic_id,
          doctor_id: followUp.doctor_id,
          appointment_date: data.scheduledDate,
          appointment_time: data.appointmentTime,
          appointment_type: data.appointmentType || 'follow_up',
          status: followUp.is_free ? 'confirmed' : 'scheduled', // Auto-confirm if free
          patient_notes: data.patientNotes,
          parent_appointment_id: followUp.original_appointment_id,
          is_follow_up: true,
          payment_amount: followUp.discounted_fee,
          payment_status: followUp.is_free ? 'paid' : 'pending'
        }])
        .select()
        .single();

      if (appointmentError) {
        console.error('❌ Error creating follow-up appointment:', appointmentError);
        return { success: false, error: appointmentError.message };
      }

      let transaction = null;

      // Create transaction if payment is required
      if (!followUp.is_free && followUp.discounted_fee > 0) {
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .insert([{
            appointment_id: appointment.id,
            patient_id: followUp.patient_id,
            clinic_id: followUp.clinic_id,
            consultation_fee: followUp.discounted_fee,
            total_amount: followUp.discounted_fee,
            status: 'pending',
            payment_method: null // To be set when payment is made
          }])
          .select()
          .single();

        if (transactionError) {
          console.error('❌ Error creating transaction:', transactionError);
          // Don't fail the appointment creation, just log the error
        } else {
          transaction = transactionData;
        }
      }

      // Update follow-up status
      await supabase
        .from('follow_up_appointments')
        .update({ 
          status: 'scheduled',
          follow_up_appointment_id: appointment.id,
          scheduled_date: data.scheduledDate
        })
        .eq('id', data.followUpId);

      // Create appointment confirmation notification
      await this.createAppointmentScheduledNotification(
        followUp.patient_id,
        appointment.id,
        data.scheduledDate,
        data.appointmentTime,
        followUp.is_free,
        followUp.discounted_fee
      );

      console.log('✅ Follow-up appointment scheduled:', appointment.id);
      return { success: true, appointment, transaction };
    } catch (error) {
      console.error('❌ Unexpected error scheduling follow-up:', error);
      return { success: false, error: 'Failed to schedule follow-up appointment' };
    }
  },

  /**
   * Get follow-up recommendations for a patient
   */
  async getPatientFollowUps(patientId: string): Promise<{
    success: boolean;
    followUps?: any[];
    error?: string;
  }> {
    try {
      const { data: followUps, error } = await supabase
        .from('follow_up_appointments')
        .select(`
          *,
          original_appointment:appointments!original_appointment_id(
            appointment_date,
            appointment_time,
            appointment_type
          ),
          follow_up_appointment:appointments!follow_up_appointment_id(
            id,
            appointment_date,
            appointment_time,
            status
          ),
          clinic:clinics(name, address)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching follow-ups:', error);
        return { success: false, error: error.message };
      }

      return { success: true, followUps: followUps || [] };
    } catch (error) {
      console.error('❌ Error fetching follow-ups:', error);
      return { success: false, error: 'Failed to fetch follow-up appointments' };
    }
  },

  /**
   * Get follow-up recommendations for a clinic
   */
  async getClinicFollowUps(clinicId: string): Promise<{
    success: boolean;
    followUps?: any[];
    error?: string;
  }> {
    try {
      const { data: followUps, error } = await supabase
        .from('follow_up_appointments')
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone),
          original_appointment:appointments!original_appointment_id(
            appointment_date,
            appointment_time,
            appointment_type
          ),
          follow_up_appointment:appointments!follow_up_appointment_id(
            id,
            appointment_date,
            appointment_time,
            status
          )
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching clinic follow-ups:', error);
        return { success: false, error: error.message };
      }

      return { success: true, followUps: followUps || [] };
    } catch (error) {
      console.error('❌ Error fetching clinic follow-ups:', error);
      return { success: false, error: 'Failed to fetch clinic follow-up appointments' };
    }
  },

  /**
   * Cancel a follow-up recommendation
   */
  async cancelFollowUp(followUpId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('follow_up_appointments')
        .update({ status: 'cancelled' })
        .eq('id', followUpId);

      if (error) {
        console.error('❌ Error cancelling follow-up:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelling follow-up:', error);
      return { success: false, error: 'Failed to cancel follow-up' };
    }
  },

  /**
   * Create follow-up recommendation notification
   */
  async createFollowUpNotification(
    patientId: string,
    followUpType: string,
    recommendedDate: string,
    isFree: boolean,
    fee: number
  ): Promise<void> {
    try {
      const feeText = isFree ? 'FREE' : `₱${fee.toFixed(2)}`;
      const message = `Your doctor recommends a ${followUpType} follow-up appointment on ${new Date(recommendedDate).toLocaleDateString()}. Fee: ${feeText}`;

      await supabase
        .from('notifications')
        .insert([{
          user_id: patientId,
          user_type: 'patient',
          title: 'Follow-up Appointment Recommended',
          message,
          type: 'follow_up_recommended',
          notification_type: 'follow_up_scheduled',
          is_read: false
        }]);
    } catch (error) {
      console.error('❌ Error creating follow-up notification:', error);
    }
  },

  /**
   * Create appointment scheduled notification
   */
  async createAppointmentScheduledNotification(
    patientId: string,
    appointmentId: string,
    scheduledDate: string,
    appointmentTime: string,
    isFree: boolean,
    fee: number
  ): Promise<void> {
    try {
      const feeText = isFree ? 'No payment required' : `Payment required: ₱${fee.toFixed(2)}`;
      const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
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

      const message = `Your follow-up appointment has been scheduled for ${formattedDate} at ${formattedTime}. ${feeText}`;

      await supabase
        .from('notifications')
        .insert([{
          user_id: patientId,
          user_type: 'patient',
          title: 'Follow-up Appointment Scheduled',
          message,
          type: 'appointment_scheduled',
          notification_type: 'appointment_confirmed',
          appointment_id: appointmentId,
          is_read: false
        }]);
    } catch (error) {
      console.error('❌ Error creating appointment notification:', error);
    }
  }
};
