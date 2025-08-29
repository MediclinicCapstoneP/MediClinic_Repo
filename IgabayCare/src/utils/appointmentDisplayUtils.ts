// Utility to fetch and display patient information for appointments
import { AppointmentService } from '../features/auth/utils/appointmentService';

export interface AppointmentDisplay {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: string;
  status: string;
  doctorName?: string;
  clinicName?: string;
}

/**
 * Get appointment with patient name for display
 */
export async function getAppointmentWithPatientName(appointmentId: string): Promise<AppointmentDisplay | null> {
  try {
    const appointment = await AppointmentService.getAppointmentWithDetails(appointmentId);
    
    if (!appointment) {
      console.error('Appointment not found:', appointmentId);
      return null;
    }

    // Extract patient information
    const patientName = appointment.patient 
      ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
      : 'Unknown Patient';

    const patientEmail = appointment.patient?.email || 'No email';
    const patientPhone = appointment.patient?.phone || undefined;
    const clinicName = appointment.clinic?.clinic_name || 'Unknown Clinic';

    return {
      appointmentId: appointment.id,
      patientName,
      patientEmail,
      patientPhone,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      appointmentType: appointment.appointment_type,
      status: appointment.status,
      doctorName: appointment.doctor_name || undefined,
      clinicName
    };
  } catch (error) {
    console.error('Error fetching appointment with patient name:', error);
    return null;
  }
}

/**
 * Format patient name for display
 */
export function formatPatientName(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return 'Unknown Patient';
  if (!firstName) return lastName || 'Unknown Patient';
  if (!lastName) return firstName;
  return `${firstName} ${lastName}`;
}

/**
 * Get all appointments with patient names for a clinic
 */
export async function getClinicAppointmentsWithPatientNames(clinicId: string): Promise<AppointmentDisplay[]> {
  try {
    const appointments = await AppointmentService.getAppointmentsWithDetails({ clinic_id: clinicId });
    
    return appointments.map(appointment => ({
      appointmentId: appointment.id,
      patientName: formatPatientName(appointment.patient?.first_name, appointment.patient?.last_name),
      patientEmail: appointment.patient?.email || 'No email',
      patientPhone: appointment.patient?.phone || undefined,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      appointmentType: appointment.appointment_type,
      status: appointment.status,
      doctorName: appointment.doctor_name || undefined,
      clinicName: appointment.clinic?.clinic_name || 'Unknown Clinic'
    }));
  } catch (error) {
    console.error('Error fetching clinic appointments with patient names:', error);
    return [];
  }
}

/**
 * Get patient appointments with names for a specific patient
 */
export async function getPatientAppointmentsWithNames(patientId: string): Promise<AppointmentDisplay[]> {
  try {
    const appointments = await AppointmentService.getAppointmentsWithDetails({ patient_id: patientId });
    
    return appointments.map(appointment => ({
      appointmentId: appointment.id,
      patientName: formatPatientName(appointment.patient?.first_name, appointment.patient?.last_name),
      patientEmail: appointment.patient?.email || 'No email',
      patientPhone: appointment.patient?.phone || undefined,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      appointmentType: appointment.appointment_type,
      status: appointment.status,
      doctorName: appointment.doctor_name || undefined,
      clinicName: appointment.clinic?.clinic_name || 'Unknown Clinic'
    }));
  } catch (error) {
    console.error('Error fetching patient appointments with names:', error);
    return [];
  }
}

/**
 * Example usage for the specific appointment ID
 */
export async function displaySpecificAppointment() {
  const appointmentId = 'c97d7adb-3b0d-4c13-ae5e-0c820a56550a';
  
  console.log('🔍 Fetching appointment details...');
  
  const appointmentDisplay = await getAppointmentWithPatientName(appointmentId);
  
  if (appointmentDisplay) {
    console.log('✅ Appointment found:');
    console.log('📋 Patient Name:', appointmentDisplay.patientName);
    console.log('📧 Patient Email:', appointmentDisplay.patientEmail);
    console.log('📞 Patient Phone:', appointmentDisplay.patientPhone || 'Not provided');
    console.log('📅 Date:', appointmentDisplay.appointmentDate);
    console.log('⏰ Time:', appointmentDisplay.appointmentTime);
    console.log('🩺 Type:', appointmentDisplay.appointmentType);
    console.log('📊 Status:', appointmentDisplay.status);
    console.log('👨‍⚕️ Doctor:', appointmentDisplay.doctorName || 'Not assigned');
    console.log('🏥 Clinic:', appointmentDisplay.clinicName);
  } else {
    console.log('❌ Appointment not found or error occurred');
  }
  
  return appointmentDisplay;
}