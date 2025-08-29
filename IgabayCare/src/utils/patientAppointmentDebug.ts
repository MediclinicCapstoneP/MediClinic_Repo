// Utility functions for troubleshooting patient appointments
import { authService } from '../features/auth/utils/authService';
import { patientService } from '../features/auth/utils/patientService';
import { AppointmentService } from '../features/auth/utils/appointmentService';

export interface PatientAppointmentDebugInfo {
  authUser: any;
  patientProfile: any;
  appointmentCount: number;
  appointments: any[];
  errors: string[];
  recommendations: string[];
}

/**
 * Debug function to help troubleshoot patient appointment display issues
 */
export async function debugPatientAppointments(): Promise<PatientAppointmentDebugInfo> {
  const debugInfo: PatientAppointmentDebugInfo = {
    authUser: null,
    patientProfile: null,
    appointmentCount: 0,
    appointments: [],
    errors: [],
    recommendations: []
  };

  try {
    // Step 1: Check authentication
    console.log('🔍 Step 1: Checking authentication...');
    const authUser = await authService.getCurrentUser();
    
    if (!authUser) {
      debugInfo.errors.push('No authenticated user found');
      debugInfo.recommendations.push('User needs to sign in first');
      return debugInfo;
    }
    
    debugInfo.authUser = {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role,
      firstName: authUser.firstName,
      lastName: authUser.lastName
    };
    
    console.log('✅ Auth user found:', debugInfo.authUser);

    // Step 2: Check patient profile
    console.log('🔍 Step 2: Checking patient profile...');
    const patientResult = await patientService.getPatientByUserId(authUser.id);
    
    if (!patientResult.success || !patientResult.patient) {
      debugInfo.errors.push(`Patient profile not found: ${patientResult.error}`);
      debugInfo.recommendations.push('Patient profile needs to be created in the patients table');
      debugInfo.recommendations.push('Run patient signup process or create profile manually');
      return debugInfo;
    }
    
    debugInfo.patientProfile = {
      id: patientResult.patient.id,
      user_id: patientResult.patient.user_id,
      first_name: patientResult.patient.first_name,
      last_name: patientResult.patient.last_name,
      email: patientResult.patient.email
    };
    
    console.log('✅ Patient profile found:', debugInfo.patientProfile);

    // Step 3: Check appointments
    console.log('🔍 Step 3: Checking appointments...');
    const appointments = await AppointmentService.getAppointmentsWithDetails({
      patient_id: patientResult.patient.id
    });
    
    debugInfo.appointmentCount = appointments.length;
    debugInfo.appointments = appointments.map(apt => ({
      id: apt.id,
      patient_id: apt.patient_id,
      clinic_id: apt.clinic_id,
      appointment_date: apt.appointment_date,
      appointment_time: apt.appointment_time,
      appointment_type: apt.appointment_type,
      status: apt.status,
      clinic_name: apt.clinic?.clinic_name,
      doctor_name: apt.doctor_name
    }));
    
    console.log(`✅ Found ${debugInfo.appointmentCount} appointments:`, debugInfo.appointments);

    // Step 4: Provide recommendations
    if (debugInfo.appointmentCount === 0) {
      debugInfo.recommendations.push('No appointments found - this is normal for new patients');
      debugInfo.recommendations.push('Patient can book appointments through the "Find Nearby Clinics" feature');
    } else {
      debugInfo.recommendations.push(`Found ${debugInfo.appointmentCount} appointments - display should work correctly`);
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
    debugInfo.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    debugInfo.recommendations.push('Check browser console for detailed error information');
    debugInfo.recommendations.push('Verify Supabase connection and RLS policies');
  }

  return debugInfo;
}

/**
 * Display debug information in console
 */
export async function logPatientAppointmentDebug(): Promise<void> {
  console.log('🚀 Starting Patient Appointment Debug...');
  console.log('==========================================');
  
  const debugInfo = await debugPatientAppointments();
  
  console.log('📊 DEBUG RESULTS:');
  console.log('==========================================');
  
  console.log('👤 Auth User:', debugInfo.authUser);
  console.log('🏥 Patient Profile:', debugInfo.patientProfile);
  console.log('📅 Appointment Count:', debugInfo.appointmentCount);
  console.log('📋 Appointments:', debugInfo.appointments);
  
  if (debugInfo.errors.length > 0) {
    console.log('❌ ERRORS:');
    debugInfo.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  if (debugInfo.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    debugInfo.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
  
  console.log('==========================================');
  console.log('🏁 Debug completed');
  
  return;
}

/**
 * Create a test appointment for debugging (development only)
 */
export async function createTestAppointment(): Promise<{ success: boolean; error?: string; appointment?: any }> {
  try {
    console.log('🧪 Creating test appointment...');
    
    const authUser = await authService.getCurrentUser();
    if (!authUser) {
      return { success: false, error: 'No authenticated user' };
    }
    
    const patientResult = await patientService.getPatientByUserId(authUser.id);
    if (!patientResult.success || !patientResult.patient) {
      return { success: false, error: 'Patient profile not found' };
    }
    
    // Create a test appointment
    const testAppointment = {
      patient_id: patientResult.patient.id,
      clinic_id: '19631e43-5e2c-466d-84bc-9199123260d2', // Use a known clinic ID
      appointment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      appointment_time: '14:00:00',
      appointment_type: 'consultation' as const,
      priority: 'normal' as const,
      patient_notes: 'Test appointment created for debugging',
      duration_minutes: 30
    };
    
    const result = await AppointmentService.createAppointment(testAppointment);
    
    if (result) {
      console.log('✅ Test appointment created:', result);
      return { success: true, appointment: result };
    } else {
      return { success: false, error: 'Failed to create test appointment' };
    }
    
  } catch (error) {
    console.error('❌ Error creating test appointment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Export for console use
if (typeof window !== 'undefined') {
  (window as any).debugPatientAppointments = logPatientAppointmentDebug;
  (window as any).createTestAppointment = createTestAppointment;
}