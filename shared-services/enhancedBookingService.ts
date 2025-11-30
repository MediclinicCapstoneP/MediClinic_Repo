/**
 * Enhanced Booking Service - Unified booking workflow for both IgabayCare (web) and Project App (mobile)
 * Handles complete end-to-end booking: Patient → Clinic → Doctor → Completion → Rating
 */

import { supabase } from '../supabaseClient';

// Type definitions for the enhanced booking system
export interface TimeSlot {
  time: string;
  available: boolean;
  formatted: string;
}

export interface PatientBookingData {
  patient_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  patient_notes?: string;
  requested_services: string[];
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
}

export interface ClinicAssignmentData {
  appointment_id: string;
  doctor_id: string;
  clinic_id: string;
  assigned_by: string;
  notes?: string;
}

export interface DoctorActionData {
  appointment_id: string;
  doctor_id: string;
  action: 'confirm' | 'decline' | 'start' | 'complete';
  notes?: string;
  decline_reason?: string;
}

export interface PrescriptionData {
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  diagnosis: string;
  medications: Medication[];
  instructions: string;
  follow_up_date?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions?: string;
}

export interface RatingData {
  appointment_id: string;
  patient_id: string;
  clinic_rating?: number;
  doctor_rating?: number;
  feedback?: string;
}

export interface WorkflowNotificationData {
  user_id: string;
  user_type: 'patient' | 'clinic' | 'doctor';
  title: string;
  message: string;
  type: string;
  appointment_id?: string;
  prescription_id?: string;
}

export interface BookingWorkflowResult {
  success: boolean;
  data?: any;
  error?: string;
  notifications?: WorkflowNotificationData[];
}

/**
 * Enhanced Booking Service - Complete workflow management
 */
export const enhancedBookingService = {
  // ==================== PATIENT BOOKING ====================

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
        .in('status', ['pending', 'assigned', 'confirmed', 'in_progress']);

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
   * Create a new appointment (Patient booking)
   */
  async createAppointment(bookingData: PatientBookingData): Promise<BookingWorkflowResult> {
    try {
      console.log('📅 Creating enhanced appointment:', bookingData);

      // Fetch patient details if not provided
      let patientName = bookingData.patient_name;
      let patientEmail = bookingData.patient_email;
      let patientPhone = bookingData.patient_phone;

      if (!patientName || !patientEmail || !patientPhone) {
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .select('first_name, last_name, email, phone')
          .eq('id', bookingData.patient_id)
          .single();
        
        if (!patientError && patient) {
          patientName = patientName || `${patient.first_name} ${patient.last_name}`;
          patientEmail = patientEmail || patient.email;
          patientPhone = patientPhone || patient.phone;
        }
      }

      // Prepare appointment data
      const appointmentToInsert = {
        patient_id: bookingData.patient_id,
        clinic_id: bookingData.clinic_id,
        appointment_date: bookingData.appointment_date,
        appointment_time: bookingData.appointment_time,
        appointment_type: bookingData.appointment_type,
        status: 'pending', // Waiting for clinic assignment
        patient_name: patientName,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        patient_notes: bookingData.patient_notes,
        requested_services: bookingData.requested_services,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([appointmentToInsert])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating appointment:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Appointment created successfully:', appointment);

      // Create notifications
      const notifications: WorkflowNotificationData[] = [
        {
          user_id: bookingData.patient_id,
          user_type: 'patient',
          title: 'Appointment Booked',
          message: `Your appointment has been booked and is pending confirmation from the clinic.`,
          type: 'appointment_booked',
          appointment_id: appointment.id
        },
        {
          user_id: bookingData.clinic_id,
          user_type: 'clinic',
          title: 'New Appointment Booking',
          message: `New appointment booking from ${patientName} for ${bookingData.appointment_date} at ${bookingData.appointment_time}`,
          type: 'new_booking',
          appointment_id: appointment.id
        }
      ];

      // Send notifications
      await this.sendWorkflowNotifications(notifications);

      return { 
        success: true, 
        data: appointment,
        notifications 
      };
    } catch (error) {
      console.error('❌ Unexpected error creating appointment:', error);
      return { success: false, error: 'Failed to create appointment' };
    }
  },

  // ==================== CLINIC MANAGEMENT ====================

  /**
   * Get pending appointments for a clinic
   */
  async getClinicPendingAppointments(clinicId: string): Promise<BookingWorkflowResult> {
    try {
      const { data: appointments, error } = await supabase
        .from('clinic_workflow_view')
        .select('*')
        .eq('clinic_id', clinicId)
        .in('status', ['pending', 'assigned'])
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        console.error('Error fetching clinic appointments:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: appointments };
    } catch (error) {
      console.error('Error fetching clinic appointments:', error);
      return { success: false, error: 'Failed to fetch appointments' };
    }
  },

  /**
   * Get available doctors for assignment
   */
  async getAvailableDoctors(clinicId: string): Promise<BookingWorkflowResult> {
    try {
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching doctors:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: doctors };
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return { success: false, error: 'Failed to fetch doctors' };
    }
  },

  /**
   * Assign appointment to doctor
   */
  async assignAppointmentToDoctor(assignmentData: ClinicAssignmentData): Promise<BookingWorkflowResult> {
    try {
      // Create assignment record
      const { data: assignment, error: assignmentError } = await supabase
        .from('clinic_doctor_assignments')
        .insert([{
          appointment_id: assignmentData.appointment_id,
          clinic_id: assignmentData.clinic_id,
          doctor_id: assignmentData.doctor_id,
          assigned_by: assignmentData.assigned_by,
          notes: assignmentData.notes
        }])
        .select()
        .single();

      if (assignmentError) {
        console.error('Error creating assignment:', assignmentError);
        return { success: false, error: assignmentError.message };
      }

      // Update appointment status and doctor
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .update({
          doctor_id: assignmentData.doctor_id,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          assigned_by: assignmentData.assigned_by,
          clinic_notes: assignmentData.notes
        })
        .eq('id', assignmentData.appointment_id)
        .select()
        .single();

      if (appointmentError) {
        console.error('Error updating appointment:', appointmentError);
        return { success: false, error: appointmentError.message };
      }

      // Get doctor details for notifications
      const { data: doctor } = await supabase
        .from('doctors')
        .select('first_name, last_name')
        .eq('id', assignmentData.doctor_id)
        .single();

      // Create notifications
      const notifications: WorkflowNotificationData[] = [
        {
          user_id: assignmentData.doctor_id,
          user_type: 'doctor',
          title: 'New Appointment Assigned',
          message: `You have been assigned a new appointment. Please review and confirm or decline.`,
          type: 'appointment_assigned',
          appointment_id: assignmentData.appointment_id
        },
        {
          user_id: appointment.patient_id,
          user_type: 'patient',
          title: 'Appointment Assigned to Doctor',
          message: `Your appointment has been assigned to Dr. ${doctor?.first_name} ${doctor?.last_name}`,
          type: 'appointment_assigned',
          appointment_id: assignmentData.appointment_id
        }
      ];

      await this.sendWorkflowNotifications(notifications);

      return { 
        success: true, 
        data: { appointment, assignment },
        notifications 
      };
    } catch (error) {
      console.error('Error assigning appointment:', error);
      return { success: false, error: 'Failed to assign appointment' };
    }
  },

  // ==================== DOCTOR ACTIONS ====================

  /**
   * Get doctor's assigned appointments
   */
  async getDoctorAppointments(doctorId: string): Promise<BookingWorkflowResult> {
    try {
      const { data: appointments, error } = await supabase
        .from('doctor_workflow_view')
        .select('*')
        .eq('doctor_id', doctorId)
        .in('status', ['assigned', 'confirmed', 'in_progress'])
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        console.error('Error fetching doctor appointments:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: appointments };
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
      return { success: false, error: 'Failed to fetch appointments' };
    }
  },

  /**
   * Handle doctor actions (confirm/decline/start/complete)
   */
  async handleDoctorAction(actionData: DoctorActionData): Promise<BookingWorkflowResult> {
    try {
      const updates: any = {};
      const now = new Date().toISOString();

      switch (actionData.action) {
        case 'confirm':
          updates.status = 'confirmed';
          updates.confirmed_at = now;
          updates.doctor_notes = actionData.notes;
          break;
        case 'decline':
          updates.status = 'declined';
          updates.declined_at = now;
          updates.decline_reason = actionData.decline_reason;
          updates.doctor_notes = actionData.notes;
          updates.doctor_id = null; // Remove doctor assignment
          break;
        case 'start':
          updates.status = 'in_progress';
          updates.started_at = now;
          updates.doctor_notes = actionData.notes;
          break;
        case 'complete':
          updates.status = 'completed';
          updates.completed_at = now;
          updates.doctor_notes = actionData.notes;
          break;
      }

      const { data: appointment, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', actionData.appointment_id)
        .eq('doctor_id', actionData.doctor_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        return { success: false, error: error.message };
      }

      // Update assignment response if confirming or declining
      if (actionData.action === 'confirm' || actionData.action === 'decline') {
        await supabase
          .from('clinic_doctor_assignments')
          .update({
            response_status: actionData.action === 'confirm' ? 'accepted' : 'declined',
            responded_at: now,
            response_notes: actionData.notes
          })
          .eq('appointment_id', actionData.appointment_id)
          .eq('doctor_id', actionData.doctor_id);
      }

      // Create notifications based on action
      const notifications: WorkflowNotificationData[] = [];

      if (actionData.action === 'confirm') {
        notifications.push({
          user_id: appointment.clinic_id,
          user_type: 'clinic',
          title: 'Appointment Confirmed',
          message: `Doctor has confirmed the appointment for ${appointment.appointment_date}`,
          type: 'appointment_confirmed',
          appointment_id: appointment.id
        });
      } else if (actionData.action === 'decline') {
        notifications.push({
          user_id: appointment.clinic_id,
          user_type: 'clinic',
          title: 'Appointment Declined',
          message: `Doctor has declined the appointment. Reason: ${actionData.decline_reason}`,
          type: 'appointment_declined',
          appointment_id: appointment.id
        });
      }

      if (actionData.action === 'complete') {
        notifications.push({
          user_id: appointment.patient_id,
          user_type: 'patient',
          title: 'Appointment Completed',
          message: `Your appointment has been completed. You will receive your prescription shortly.`,
          type: 'appointment_completed',
          appointment_id: appointment.id
        });
      }

      if (notifications.length > 0) {
        await this.sendWorkflowNotifications(notifications);
      }

      return { 
        success: true, 
        data: appointment,
        notifications: notifications.length > 0 ? notifications : undefined
      };
    } catch (error) {
      console.error('Error handling doctor action:', error);
      return { success: false, error: 'Failed to process action' };
    }
  },

  // ==================== PRESCRIPTION MANAGEMENT ====================

  /**
   * Create and submit prescription
   */
  async createPrescription(prescriptionData: PrescriptionData): Promise<BookingWorkflowResult> {
    try {
      const { data: prescription, error } = await supabase
        .from('prescriptions')
        .insert([{
          appointment_id: prescriptionData.appointment_id,
          doctor_id: prescriptionData.doctor_id,
          patient_id: prescriptionData.patient_id,
          diagnosis: prescriptionData.diagnosis,
          medications: prescriptionData.medications,
          instructions: prescriptionData.instructions,
          follow_up_date: prescriptionData.follow_up_date
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating prescription:', error);
        return { success: false, error: error.message };
      }

      // Update appointment status
      await supabase
        .from('appointments')
        .update({
          status: 'prescribed',
          prescription_id: prescription.id
        })
        .eq('id', prescriptionData.appointment_id);

      // Create notifications
      const notifications: WorkflowNotificationData[] = [
        {
          user_id: prescriptionData.patient_id,
          user_type: 'patient',
          title: 'Prescription Available',
          message: `Your prescription (${prescription.prescription_number}) is now available for viewing.`,
          type: 'prescription_available',
          prescription_id: prescription.id
        },
        {
          user_id: prescriptionData.clinic_id,
          user_type: 'clinic',
          title: 'Prescription Submitted',
          message: `Doctor has submitted a prescription for the appointment.`,
          type: 'prescription_submitted',
          prescription_id: prescription.id
        }
      ];

      await this.sendWorkflowNotifications(notifications);

      return { 
        success: true, 
        data: prescription,
        notifications 
      };
    } catch (error) {
      console.error('Error creating prescription:', error);
      return { success: false, error: 'Failed to create prescription' };
    }
  },

  /**
   * Get patient prescriptions
   */
  async getPatientPrescriptions(patientId: string): Promise<BookingWorkflowResult> {
    try {
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          appointments!inner(
            appointment_date,
            appointment_time,
            clinics!inner(clinic_name),
            doctors!inner(first_name, last_name)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching prescriptions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: prescriptions };
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      return { success: false, error: 'Failed to fetch prescriptions' };
    }
  },

  /**
   * Mark prescription as viewed/downloaded by patient
   */
  async markPrescriptionAccess(prescriptionId: string, action: 'viewed' | 'downloaded'): Promise<BookingWorkflowResult> {
    try {
      const updates: any = {};
      if (action === 'viewed') {
        updates.patient_viewed_at = new Date().toISOString();
      } else if (action === 'downloaded') {
        updates.downloaded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('prescriptions')
        .update(updates)
        .eq('id', prescriptionId);

      if (error) {
        console.error('Error updating prescription access:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking prescription access:', error);
      return { success: false, error: 'Failed to update prescription' };
    }
  },

  // ==================== RATING AND FEEDBACK ====================

  /**
   * Submit rating and feedback
   */
  async submitRating(ratingData: RatingData): Promise<BookingWorkflowResult> {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .update({
          clinic_rating: ratingData.clinic_rating,
          doctor_rating: ratingData.doctor_rating,
          feedback: ratingData.feedback,
          rated_at: new Date().toISOString()
        })
        .eq('id', ratingData.appointment_id)
        .eq('patient_id', ratingData.patient_id)
        .select()
        .single();

      if (error) {
        console.error('Error submitting rating:', error);
        return { success: false, error: error.message };
      }

      // Create notifications for clinic and doctor
      const notifications: WorkflowNotificationData[] = [
        {
          user_id: appointment.clinic_id,
          user_type: 'clinic',
          title: 'New Rating Received',
          message: `A patient has rated their experience. Clinic: ${ratingData.clinic_rating}/5`,
          type: 'rating_received',
          appointment_id: appointment.id
        }
      ];

      if (appointment.doctor_id) {
        notifications.push({
          user_id: appointment.doctor_id,
          user_type: 'doctor',
          title: 'New Rating Received',
          message: `A patient has rated your service. Doctor: ${ratingData.doctor_rating}/5`,
          type: 'rating_received',
          appointment_id: appointment.id
        });
      }

      await this.sendWorkflowNotifications(notifications);

      return { 
        success: true, 
        data: appointment,
        notifications 
      };
    } catch (error) {
      console.error('Error submitting rating:', error);
      return { success: false, error: 'Failed to submit rating' };
    }
  },

  // ==================== NOTIFICATIONS ====================

  /**
   * Send workflow notifications
   */
  async sendWorkflowNotifications(notifications: WorkflowNotificationData[]): Promise<BookingWorkflowResult> {
    try {
      const { error } = await supabase
        .from('workflow_notifications')
        .insert(notifications.map(notification => ({
          ...notification,
          created_at: new Date().toISOString()
        })));

      if (error) {
        console.error('Error sending notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending notifications:', error);
      return { success: false, error: 'Failed to send notifications' };
    }
  },

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, userType: 'patient' | 'clinic' | 'doctor'): Promise<BookingWorkflowResult> {
    try {
      const { data: notifications, error } = await supabase
        .from('workflow_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: notifications };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: 'Failed to fetch notifications' };
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<BookingWorkflowResult> {
    try {
      const { error } = await supabase
        .from('workflow_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(userId: string, userType: 'patient' | 'clinic' | 'doctor'): Promise<BookingWorkflowResult> {
    try {
      const { count, error } = await supabase
        .from('workflow_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('user_type', userType)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: { count: count || 0 } };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { success: false, error: 'Failed to get unread count' };
    }
  },

  // ==================== WORKFLOW VIEWS ====================

  /**
   * Get patient workflow view
   */
  async getPatientWorkflowView(patientId: string): Promise<BookingWorkflowResult> {
    try {
      const { data: appointments, error } = await supabase
        .from('patient_workflow_view')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) {
        console.error('Error fetching patient workflow:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: appointments };
    } catch (error) {
      console.error('Error fetching patient workflow:', error);
      return { success: false, error: 'Failed to fetch workflow data' };
    }
  },

  /**
   * Get appointment status history
   */
  async getAppointmentStatusHistory(appointmentId: string): Promise<BookingWorkflowResult> {
    try {
      const { data: history, error } = await supabase
        .from('appointment_status_history')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching status history:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: history };
    } catch (error) {
      console.error('Error fetching status history:', error);
      return { success: false, error: 'Failed to fetch status history' };
    }
  }
};

export default enhancedBookingService;
