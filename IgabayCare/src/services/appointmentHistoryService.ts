import { supabase } from '../supabaseClient';

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
  follow_up_notes?: string;
  doctor_name: string;
  clinic_name: string;
  payment_amount?: number;
  payment_status?: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentHistoryData {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  consultation_notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  prescription_given?: boolean;
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  doctor_name: string;
  clinic_name: string;
  payment_amount?: number;
  payment_status?: string;
}

export class AppointmentHistoryService {
  /**
   * Create a new appointment history entry when an appointment is completed
   */
  static async createAppointmentHistory(data: CreateAppointmentHistoryData): Promise<{
    success: boolean;
    history?: AppointmentHistoryEntry;
    error?: string;
  }> {
    try {
      console.log('📝 Creating appointment history entry:', data);

      const historyData = {
        ...data,
        status: 'completed',
        prescription_given: data.prescription_given || false,
        follow_up_required: data.follow_up_required || false,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: historyEntry, error } = await supabase
        .from('appointment_history')
        .insert([historyData])
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error creating appointment history:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Appointment history created successfully:', historyEntry.id);
      return {
        success: true,
        history: historyEntry
      };

    } catch (error) {
      console.error('❌ Unexpected error creating appointment history:', error);
      return {
        success: false,
        error: 'Failed to create appointment history'
      };
    }
  }

  /**
   * Get appointment history for a specific patient
   */
  static async getPatientAppointmentHistory(patientId: string, limit?: number): Promise<{
    success: boolean;
    history?: AppointmentHistoryEntry[];
    error?: string;
  }> {
    try {
      console.log('🔍 Fetching appointment history for patient:', patientId);

      let query = supabase
        .from('appointment_history')
        .select('*')
        .eq('patient_id', patientId)
        .order('completed_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: history, error } = await query;

      if (error) {
        console.error('❌ Error fetching appointment history:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Successfully fetched appointment history:', history?.length || 0);
      return {
        success: true,
        history: history || []
      };

    } catch (error) {
      console.error('❌ Unexpected error fetching appointment history:', error);
      return {
        success: false,
        error: 'Failed to fetch appointment history'
      };
    }
  }

  /**
   * Get appointment history for a specific doctor
   */
  static async getDoctorAppointmentHistory(doctorId: string, limit?: number): Promise<{
    success: boolean;
    history?: AppointmentHistoryEntry[];
    error?: string;
  }> {
    try {
      console.log('🔍 Fetching appointment history for doctor:', doctorId);

      let query = supabase
        .from('appointment_history')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('completed_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: history, error } = await query;

      if (error) {
        console.error('❌ Error fetching appointment history:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Successfully fetched doctor appointment history:', history?.length || 0);
      return {
        success: true,
        history: history || []
      };

    } catch (error) {
      console.error('❌ Unexpected error fetching doctor appointment history:', error);
      return {
        success: false,
        error: 'Failed to fetch doctor appointment history'
      };
    }
  }

  /**
   * Get appointment history for a specific clinic
   */
  static async getClinicAppointmentHistory(clinicId: string, limit?: number): Promise<{
    success: boolean;
    history?: AppointmentHistoryEntry[];
    error?: string;
  }> {
    try {
      console.log('🔍 Fetching appointment history for clinic:', clinicId);

      let query = supabase
        .from('appointment_history')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('completed_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: history, error } = await query;

      if (error) {
        console.error('❌ Error fetching appointment history:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Successfully fetched clinic appointment history:', history?.length || 0);
      return {
        success: true,
        history: history || []
      };

    } catch (error) {
      console.error('❌ Unexpected error fetching clinic appointment history:', error);
      return {
        success: false,
        error: 'Failed to fetch clinic appointment history'
      };
    }
  }

  /**
   * Update appointment history entry
   */
  static async updateAppointmentHistory(historyId: string, updates: Partial<CreateAppointmentHistoryData>): Promise<{
    success: boolean;
    history?: AppointmentHistoryEntry;
    error?: string;
  }> {
    try {
      console.log('📝 Updating appointment history:', historyId, updates);

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data: historyEntry, error } = await supabase
        .from('appointment_history')
        .update(updateData)
        .eq('id', historyId)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error updating appointment history:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Appointment history updated successfully');
      return {
        success: true,
        history: historyEntry
      };

    } catch (error) {
      console.error('❌ Unexpected error updating appointment history:', error);
      return {
        success: false,
        error: 'Failed to update appointment history'
      };
    }
  }

  /**
   * Check if appointment history already exists for an appointment
   */
  static async appointmentHistoryExists(appointmentId: string): Promise<{
    exists: boolean;
    history?: AppointmentHistoryEntry;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('appointment_history')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found
          return { exists: false };
        }
        console.error('❌ Error checking appointment history:', error);
        return {
          exists: false,
          error: error.message
        };
      }

      return {
        exists: true,
        history: data
      };

    } catch (error) {
      console.error('❌ Unexpected error checking appointment history:', error);
      return {
        exists: false,
        error: 'Failed to check appointment history'
      };
    }
  }
}

export default AppointmentHistoryService;
