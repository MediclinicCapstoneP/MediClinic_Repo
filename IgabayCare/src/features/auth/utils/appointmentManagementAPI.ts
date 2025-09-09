import { supabase } from '../../../supabaseClient';
import { appointmentBookingService } from './appointmentBookingService';
import { followUpAppointmentService } from './followUpAppointmentService';
import { enhancedNotificationService } from './enhancedNotificationService';
import { paymentConfirmationService } from './paymentConfirmationService';
import { emailService } from './emailService';

interface CompleteAppointmentBookingData {
  patientId: string;
  clinicId: string;
  doctorId?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  patientNotes?: string;
  paymentMethod: string;
  paymentProvider: string;
  externalPaymentId: string;
  totalAmount: number;
  consultationFee: number;
  bookingFee?: number;
  processingFee?: number;
}

interface AppointmentStatusUpdate {
  appointmentId: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  completionNotes?: string;
  followUpRecommended?: boolean;
  followUpType?: 'routine' | 'urgent' | 'check_results' | 'medication_review' | 'progress_check';
  followUpDate?: string;
  followUpReason?: string;
}

export const appointmentManagementAPI = {
  /**
   * Complete appointment booking flow with payment
   */
  async completeAppointmentBooking(data: CompleteAppointmentBookingData): Promise<{
    success: boolean;
    appointment?: any;
    transaction?: any;
    error?: string;
  }> {
    try {
      console.log('🏥 Starting complete appointment booking flow...');

      // 1. Create the appointment
      const appointmentResult = await appointmentBookingService.createAppointment({
        patient_id: data.patientId,
        clinic_id: data.clinicId,
        doctor_id: data.doctorId,
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        appointment_type: data.appointmentType,
        patient_notes: data.patientNotes,
        status: 'confirmed' // Confirmed since payment is already made
      });

      if (!appointmentResult.success) {
        return { success: false, error: appointmentResult.error };
      }

      const appointment = appointmentResult.appointment;

      // 2. Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          appointment_id: appointment.id,
          patient_id: data.patientId,
          clinic_id: data.clinicId,
          consultation_fee: data.consultationFee,
          booking_fee: data.bookingFee || 0,
          processing_fee: data.processingFee || 0,
          total_amount: data.totalAmount,
          payment_method: data.paymentMethod,
          payment_provider: data.paymentProvider,
          external_payment_id: data.externalPaymentId,
          status: 'completed',
          payment_date: new Date().toISOString(),
          confirmation_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (transactionError) {
        console.error('❌ Error creating transaction:', transactionError);
        // Don't fail the entire process, but log the error
      }

      // 3. Update appointment with payment info
      await supabase
        .from('appointments')
        .update({
          payment_amount: data.totalAmount,
          payment_status: 'paid',
          payment_id: data.externalPaymentId
        })
        .eq('id', appointment.id);

      // 4. Get clinic details for notifications
      const { data: clinic } = await supabase
        .from('clinics')
        .select('name, address')
        .eq('id', data.clinicId)
        .single();

      // 5. Get patient details for notifications
      const { data: patient } = await supabase
        .from('patients')
        .select('first_name, last_name, email')
        .eq('id', data.patientId)
        .single();

      // 6. Create booking confirmation notification
      await enhancedNotificationService.createAppointmentBookingNotification(
        data.patientId,
        appointment.id,
        clinic?.name || 'Clinic',
        data.appointmentDate,
        data.appointmentTime,
        data.totalAmount,
        true // Send email
      );

      // 7. Create appointment reminders
      const appointmentDateTime = `${data.appointmentDate}T${data.appointmentTime}`;
      await enhancedNotificationService.createAppointmentReminders({
        appointmentId: appointment.id,
        patientId: data.patientId,
        appointmentDateTime,
        clinicName: clinic?.name || 'Clinic'
      });

      // 8. Send confirmation email
      if (patient?.email) {
        await emailService.sendTemplatedEmail({
          type: 'appointment_confirmation',
          data: {
            patientName: `${patient.first_name} ${patient.last_name}`,
            clinicName: clinic?.name || 'Clinic',
            appointmentDate: new Date(data.appointmentDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            appointmentTime: new Date(`2000-01-01T${data.appointmentTime}`).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            appointmentType: data.appointmentType,
            amount: data.totalAmount.toFixed(2)
          }
        }, patient.email);
      }

      console.log('✅ Complete appointment booking flow completed successfully');
      return { 
        success: true, 
        appointment: {
          ...appointment,
          payment_amount: data.totalAmount,
          payment_status: 'paid',
          payment_id: data.externalPaymentId
        }, 
        transaction 
      };

    } catch (error) {
      console.error('❌ Error in complete appointment booking flow:', error);
      return { success: false, error: 'Failed to complete appointment booking' };
    }
  },

  /**
   * Update appointment status (complete, cancel, etc.)
   */
  async updateAppointmentStatus(data: AppointmentStatusUpdate): Promise<{
    success: boolean;
    appointment?: any;
    followUp?: any;
    error?: string;
  }> {
    try {
      console.log('📝 Updating appointment status:', data.appointmentId, 'to', data.status);

      // Get appointment details
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(first_name, last_name, email),
          clinic:clinics(name, address)
        `)
        .eq('id', data.appointmentId)
        .single();

      if (appointmentError) {
        console.error('❌ Error fetching appointment:', appointmentError);
        return { success: false, error: 'Appointment not found' };
      }

      // Update appointment status
      const { data: updatedAppointment, error: updateError } = await supabase
        .from('appointments')
        .update({
          status: data.status,
          notes: data.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.appointmentId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating appointment:', updateError);
        return { success: false, error: updateError.message };
      }

      let followUpResult = null;

      // Handle different status updates
      switch (data.status) {
        case 'completed':
          // Create completion notification
          await enhancedNotificationService.createNotification({
            userId: appointment.patient_id,
            userType: 'patient',
            title: 'Appointment Completed',
            message: `Your appointment at ${appointment.clinic.name} has been completed. Thank you for visiting us!`,
            type: 'appointment_completion',
            notificationType: 'appointment_completed',
            appointmentId: data.appointmentId,
            sendEmail: true
          });

          // Create follow-up recommendation if requested
          if (data.followUpRecommended && data.followUpType && data.followUpDate) {
            followUpResult = await followUpAppointmentService.createFollowUpRecommendation({
              originalAppointmentId: data.appointmentId,
              patientId: appointment.patient_id,
              clinicId: appointment.clinic_id,
              doctorId: appointment.doctor_id,
              followUpType: data.followUpType,
              recommendedDate: data.followUpDate,
              reason: data.followUpReason,
              doctorNotes: data.completionNotes
            });
          }
          break;

        case 'cancelled':
          // Process refund if payment was made
          if (appointment.payment_status === 'paid') {
            await paymentConfirmationService.processRefund(
              data.appointmentId,
              data.notes || 'Appointment cancelled'
            );
          }

          // Create cancellation notification
          await enhancedNotificationService.createNotification({
            userId: appointment.patient_id,
            userType: 'patient',
            title: 'Appointment Cancelled',
            message: `Your appointment at ${appointment.clinic.name} scheduled for ${new Date(appointment.appointment_date).toLocaleDateString()} has been cancelled.`,
            type: 'appointment_cancellation',
            notificationType: 'appointment_cancelled',
            appointmentId: data.appointmentId,
            sendEmail: true
          });

          // Send cancellation email
          if (appointment.patient.email) {
            await emailService.sendTemplatedEmail({
              type: 'appointment_cancelled',
              data: {
                patientName: `${appointment.patient.first_name} ${appointment.patient.last_name}`,
                appointmentDate: new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                appointmentTime: new Date(`2000-01-01T${appointment.appointment_time}`).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }),
                reason: data.notes,
                refundAmount: appointment.payment_status === 'paid' ? appointment.payment_amount : null
              }
            }, appointment.patient.email);
          }
          break;

        case 'no_show':
          // Create no-show notification
          await enhancedNotificationService.createNotification({
            userId: appointment.patient_id,
            userType: 'patient',
            title: 'Missed Appointment',
            message: `You missed your appointment at ${appointment.clinic.name}. Please contact us to reschedule.`,
            type: 'appointment_no_show',
            notificationType: 'appointment_cancelled',
            appointmentId: data.appointmentId,
            sendEmail: true
          });
          break;
      }

      console.log('✅ Appointment status updated successfully');
      return { 
        success: true, 
        appointment: updatedAppointment,
        followUp: followUpResult?.followUp
      };

    } catch (error) {
      console.error('❌ Error updating appointment status:', error);
      return { success: false, error: 'Failed to update appointment status' };
    }
  },

  /**
   * Get comprehensive appointment details
   */
  async getAppointmentDetails(appointmentId: string): Promise<{
    success: boolean;
    appointment?: any;
    error?: string;
  }> {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            id, first_name, last_name, email, phone, date_of_birth
          ),
          clinic:clinics(
            id, name, address, phone, email
          ),
          transactions(*),
          follow_up_appointments!original_appointment_id(*),
          parent_appointment:appointments!parent_appointment_id(
            id, appointment_date, appointment_time, appointment_type
          )
        `)
        .eq('id', appointmentId)
        .single();

      if (error) {
        console.error('❌ Error fetching appointment details:', error);
        return { success: false, error: error.message };
      }

      return { success: true, appointment };
    } catch (error) {
      console.error('❌ Error fetching appointment details:', error);
      return { success: false, error: 'Failed to fetch appointment details' };
    }
  },

  /**
   * Get patient appointments with filtering
   */
  async getPatientAppointments(
    patientId: string,
    filters?: {
      status?: string[];
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    success: boolean;
    appointments?: any[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics(name, address, phone),
          transactions(total_amount, status, payment_method)
        `, { count: 'exact' })
        .eq('patient_id', patientId);

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('appointment_date', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('appointment_date', filters.dateTo);
      }

      query = query.order('appointment_date', { ascending: false });

      if (filters?.limit) {
        const offset = filters.offset || 0;
        query = query.range(offset, offset + filters.limit - 1);
      }

      const { data: appointments, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching patient appointments:', error);
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        appointments: appointments || [], 
        total: count || 0 
      };
    } catch (error) {
      console.error('❌ Error fetching patient appointments:', error);
      return { success: false, error: 'Failed to fetch patient appointments' };
    }
  },

  /**
   * Get clinic appointments with filtering
   */
  async getClinicAppointments(
    clinicId: string,
    filters?: {
      status?: string[];
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    success: boolean;
    appointments?: any[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone),
          transactions(total_amount, status, payment_method)
        `, { count: 'exact' })
        .eq('clinic_id', clinicId);

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('appointment_date', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('appointment_date', filters.dateTo);
      }

      query = query.order('appointment_date', { ascending: true });

      if (filters?.limit) {
        const offset = filters.offset || 0;
        query = query.range(offset, offset + filters.limit - 1);
      }

      const { data: appointments, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching clinic appointments:', error);
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        appointments: appointments || [], 
        total: count || 0 
      };
    } catch (error) {
      console.error('❌ Error fetching clinic appointments:', error);
      return { success: false, error: 'Failed to fetch clinic appointments' };
    }
  },

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
    reason?: string
  ): Promise<{
    success: boolean;
    appointment?: any;
    error?: string;
  }> {
    try {
      console.log('📅 Rescheduling appointment:', appointmentId);

      // Get appointment details
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(first_name, last_name, email),
          clinic:clinics(name)
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError) {
        return { success: false, error: 'Appointment not found' };
      }

      // Check if new time slot is available
      const availabilityResult = await appointmentBookingService.getAvailableTimeSlots(
        appointment.clinic_id,
        newDate
      );

      const requestedSlot = availabilityResult.find(slot => slot.time === newTime);
      if (!requestedSlot || !requestedSlot.available) {
        return { success: false, error: 'Requested time slot is not available' };
      }

      // Update appointment
      const { data: updatedAppointment, error: updateError } = await supabase
        .from('appointments')
        .update({
          appointment_date: newDate,
          appointment_time: newTime,
          notes: reason ? `Rescheduled: ${reason}` : 'Rescheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Create reschedule notification
      await enhancedNotificationService.createNotification({
        userId: appointment.patient_id,
        userType: 'patient',
        title: 'Appointment Rescheduled',
        message: `Your appointment at ${appointment.clinic.name} has been rescheduled to ${new Date(newDate).toLocaleDateString()} at ${new Date(`2000-01-01T${newTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}.`,
        type: 'appointment_reschedule',
        notificationType: 'appointment_confirmed',
        appointmentId,
        sendEmail: true
      });

      // Update appointment reminders
      const appointmentDateTime = `${newDate}T${newTime}`;
      await enhancedNotificationService.createAppointmentReminders({
        appointmentId,
        patientId: appointment.patient_id,
        appointmentDateTime,
        clinicName: appointment.clinic.name
      });

      console.log('✅ Appointment rescheduled successfully');
      return { success: true, appointment: updatedAppointment };

    } catch (error) {
      console.error('❌ Error rescheduling appointment:', error);
      return { success: false, error: 'Failed to reschedule appointment' };
    }
  }
};
