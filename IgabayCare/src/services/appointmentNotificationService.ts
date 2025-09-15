import { supabase } from '../supabaseClient';
import { NotificationService } from './notificationService';

export interface AppointmentNotificationData {
  appointmentId: string;
  patientId: string;
  clinicId: string;
  doctorId?: string;
  appointmentDate: string;
  appointmentTime: string;
  patientName: string;
  clinicName: string;
  doctorName?: string;
}

export class AppointmentNotificationService {
  /**
   * Send notification to clinic when patient books an appointment
   */
  static async notifyClinicOfNewAppointment(data: AppointmentNotificationData): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get clinic user_id
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('user_id, clinic_name')
        .eq('id', data.clinicId)
        .single();

      if (clinicError || !clinic) {
        return { success: false, error: 'Clinic not found' };
      }

      // Create notification for clinic
      const { success, error } = await NotificationService.createNotification({
        user_id: clinic.user_id,
        appointment_id: data.appointmentId,
        title: 'New Appointment Booking',
        message: `${data.patientName} has booked an appointment for ${data.appointmentDate} at ${data.appointmentTime}. Please assign a doctor to this appointment.`,
        type: 'appointment_confirmed',
        priority: 'normal',
        action_url: `/clinic/appointments/${data.appointmentId}`,
        action_text: 'Assign Doctor',
        metadata: {
          appointment_id: data.appointmentId,
          patient_id: data.patientId,
          patient_name: data.patientName,
          appointment_date: data.appointmentDate,
          appointment_time: data.appointmentTime,
          requires_doctor_assignment: true
        }
      });

      return { success, error };
    } catch (error) {
      console.error('Error notifying clinic of new appointment:', error);
      return { success: false, error: 'Failed to notify clinic' };
    }
  }

  /**
   * Send notifications when clinic assigns doctor to appointment
   */
  static async notifyDoctorAssignment(data: AppointmentNotificationData): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!data.doctorId || !data.doctorName) {
        return { success: false, error: 'Doctor information required' };
      }

      // Get patient user_id
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('user_id, first_name, last_name')
        .eq('id', data.patientId)
        .single();

      if (patientError || !patient) {
        return { success: false, error: 'Patient not found' };
      }

      // Get doctor user_id (if doctors have user accounts)
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('user_id, doctor_name, email')
        .eq('id', data.doctorId)
        .single();

      const notifications = [];

      // 1. Notify Patient about doctor assignment
      const patientNotification = NotificationService.createNotification({
        user_id: patient.user_id,
        appointment_id: data.appointmentId,
        title: 'Doctor Assigned to Your Appointment',
        message: `Dr. ${data.doctorName} has been assigned to your appointment on ${data.appointmentDate} at ${data.appointmentTime} at ${data.clinicName}.`,
        type: 'appointment_confirmed',
        priority: 'normal',
        action_url: `/patient/appointments/${data.appointmentId}`,
        action_text: 'View Appointment',
        metadata: {
          appointment_id: data.appointmentId,
          doctor_id: data.doctorId,
          doctor_name: data.doctorName,
          clinic_name: data.clinicName,
          appointment_date: data.appointmentDate,
          appointment_time: data.appointmentTime
        }
      });

      notifications.push(patientNotification);

      // 2. Notify Doctor about new appointment (if doctor has user account)
      if (doctor && doctor.user_id) {
        const doctorNotification = NotificationService.createNotification({
          user_id: doctor.user_id,
          appointment_id: data.appointmentId,
          title: 'New Appointment Assigned',
          message: `You have been assigned to an appointment with ${patient.first_name} ${patient.last_name} on ${data.appointmentDate} at ${data.appointmentTime}.`,
          type: 'appointment_confirmed',
          priority: 'normal',
          action_url: `/doctor/appointments/${data.appointmentId}`,
          action_text: 'View Appointment',
          metadata: {
            appointment_id: data.appointmentId,
            patient_id: data.patientId,
            patient_name: `${patient.first_name} ${patient.last_name}`,
            clinic_name: data.clinicName,
            appointment_date: data.appointmentDate,
            appointment_time: data.appointmentTime
          }
        });

        notifications.push(doctorNotification);
      }

      // Execute all notifications
      const results = await Promise.all(notifications);
      
      // Check if all notifications were successful
      const allSuccessful = results.every(result => result.success);
      const errors = results.filter(result => !result.success).map(result => result.error);

      return {
        success: allSuccessful,
        error: errors.length > 0 ? errors.join(', ') : undefined
      };

    } catch (error) {
      console.error('Error notifying doctor assignment:', error);
      return { success: false, error: 'Failed to send notifications' };
    }
  }

  /**
   * Update appointment with doctor assignment and trigger notifications
   */
  static async assignDoctorToAppointment(
    appointmentId: string,
    doctorId: string,
    assignedBy: string // clinic user_id
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get appointment details
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (id, user_id, first_name, last_name),
          clinics (id, user_id, clinic_name),
          doctors (id, user_id, doctor_name)
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError || !appointment) {
        return { success: false, error: 'Appointment not found' };
      }

      // Get doctor details
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id, user_id, doctor_name, email')
        .eq('id', doctorId)
        .single();

      if (doctorError || !doctor) {
        return { success: false, error: 'Doctor not found' };
      }

      // Update appointment with doctor assignment
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          doctor_id: doctorId,
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (updateError) {
        return { success: false, error: 'Failed to assign doctor to appointment' };
      }

      // Send notifications
      const notificationData: AppointmentNotificationData = {
        appointmentId,
        patientId: appointment.patients.id,
        clinicId: appointment.clinics.id,
        doctorId,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        patientName: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
        clinicName: appointment.clinics.clinic_name,
        doctorName: doctor.doctor_name
      };

      const { success: notificationSuccess, error: notificationError } = 
        await this.notifyDoctorAssignment(notificationData);

      return {
        success: notificationSuccess,
        error: notificationError
      };

    } catch (error) {
      console.error('Error assigning doctor to appointment:', error);
      return { success: false, error: 'Failed to assign doctor' };
    }
  }

  /**
   * Get pending appointments that need doctor assignment for a clinic
   */
  static async getPendingDoctorAssignments(clinicId: string): Promise<{
    success: boolean;
    appointments?: any[];
    error?: string;
  }> {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (first_name, last_name, phone, email),
          clinics (clinic_name)
        `)
        .eq('clinic_id', clinicId)
        .is('doctor_id', null)
        .in('status', ['pending', 'confirmed'])
        .order('appointment_date', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, appointments: appointments || [] };
    } catch (error) {
      console.error('Error getting pending doctor assignments:', error);
      return { success: false, error: 'Failed to fetch pending assignments' };
    }
  }

  /**
   * Get available doctors for a clinic
   */
  static async getAvailableDoctors(clinicId: string): Promise<{
    success: boolean;
    doctors?: any[];
    error?: string;
  }> {
    try {
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select('id, doctor_name, specialty, email, phone')
        .eq('clinic_id', clinicId)
        .eq('status', 'active')
        .order('doctor_name');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, doctors: doctors || [] };
    } catch (error) {
      console.error('Error getting available doctors:', error);
      return { success: false, error: 'Failed to fetch doctors' };
    }
  }
}

export default AppointmentNotificationService;
