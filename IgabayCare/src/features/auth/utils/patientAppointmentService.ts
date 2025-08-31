import { supabase } from '../../../supabaseClient';
import { AppointmentWithDetails, CreateAppointmentData } from '../../../types/appointments';

export const patientAppointmentService = {
  /**
   * Get patient's appointment history with clinic details
   */
  async getPatientAppointmentHistory(patientId: string): Promise<{ success: boolean; appointments?: AppointmentWithDetails[]; error?: string }> {
    try {
      console.log('🔍 Fetching appointment history for patient:', patientId);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics(
            id,
            clinic_name,
            address,
            city,
            state,
            phone,
            email
          )
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) {
        console.error('❌ Error fetching patient appointments:', error);
        
        // Handle case where appointments table doesn't exist
        if (error.code === '42P01') {
          console.warn('⚠️ Appointments table does not exist. Please run the SQL script to create it.');
          return { success: false, error: 'Appointments table not found. Please contact administrator.' };
        }
        
        return { success: false, error: error.message };
      }

      console.log(`✅ Found ${appointments?.length || 0} appointments for patient`);
      return { success: true, appointments: appointments || [] };
    } catch (error) {
      console.error('❌ Unexpected error fetching patient appointments:', error);
      return { success: false, error: 'Failed to fetch appointment history' };
    }
  },

  /**
   * Create sample appointment data for testing
   */
  async createSampleAppointments(patientId: string, clinicId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sampleAppointments = [
        {
          patient_id: patientId,
          clinic_id: clinicId,
          doctor_name: 'Dr. Sarah Johnson',
          doctor_specialty: 'General Medicine',
          appointment_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days ago
          appointment_time: '10:30:00',
          appointment_type: 'consultation' as const,
          status: 'completed' as const,
          priority: 'normal' as const,
          duration_minutes: 30,
          patient_notes: 'Regular checkup and health screening',
          total_cost: 500.00
        },
        {
          patient_id: patientId,
          clinic_id: clinicId,
          doctor_name: 'Dr. Michael Lee',
          doctor_specialty: 'Cardiology',
          appointment_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
          appointment_time: '14:00:00',
          appointment_type: 'specialist_visit' as const,
          status: 'completed' as const,
          priority: 'high' as const,
          duration_minutes: 60,
          patient_notes: 'Cardiology consultation for chest pain',
          total_cost: 800.00
        },
        {
          patient_id: patientId,
          clinic_id: clinicId,
          doctor_name: 'Dr. Alice Reyes',
          doctor_specialty: 'Dermatology',
          appointment_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days ago
          appointment_time: '09:15:00',
          appointment_type: 'specialist_visit' as const,
          status: 'cancelled' as const,
          priority: 'low' as const,
          duration_minutes: 45,
          patient_notes: 'Skin condition examination',
          cancellation_reason: 'Patient requested cancellation',
          total_cost: 600.00
        }
      ];

      for (const appointmentData of sampleAppointments) {
        const { error } = await supabase
          .from('appointments')
          .insert(appointmentData);

        if (error) {
          console.error('Error creating sample appointment:', error);
          return { success: false, error: error.message };
        }
      }

      console.log('✅ Created sample appointment data successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error creating sample appointments:', error);
      return { success: false, error: 'Failed to create sample appointments' };
    }
  },

  /**
   * Get appointment statistics for patient
   */
  async getPatientAppointmentStats(patientId: string): Promise<{ 
    total: number; 
    completed: number; 
    upcoming: number; 
    cancelled: number; 
  }> {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('status, appointment_date')
        .eq('patient_id', patientId);

      if (error || !appointments) {
        return { total: 0, completed: 0, upcoming: 0, cancelled: 0 };
      }

      const today = new Date().toISOString().split('T')[0];
      
      return {
        total: appointments.length,
        completed: appointments.filter(a => a.status === 'completed').length,
        upcoming: appointments.filter(a => 
          a.appointment_date >= today && 
          ['scheduled', 'confirmed'].includes(a.status)
        ).length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length
      };
    } catch (error) {
      console.error('Error fetching patient appointment stats:', error);
      return { total: 0, completed: 0, upcoming: 0, cancelled: 0 };
    }
  }
};
