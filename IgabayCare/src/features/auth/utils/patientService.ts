import { supabase } from '../../../supabaseClient';

export interface PatientProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  blood_type?: string;
  allergies?: string;
  medications?: string;
  medical_conditions?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientData {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  blood_type?: string;
  allergies?: string;
  medications?: string;
  medical_conditions?: string;
}

export const patientService = {
  // Create a new patient profile
  async createPatient(data: CreatePatientData): Promise<{ success: boolean; error?: string; patient?: PatientProfile }> {
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .insert([data])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, patient };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create patient profile';
      return { success: false, error: errorMessage };
    }
  },

  // Get patient profile by user ID
  async getPatientByUserId(userId: string): Promise<{ success: boolean; error?: string; patient?: PatientProfile }> {
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, patient };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get patient profile';
      return { success: false, error: errorMessage };
    }
  },

  // Update patient profile
  async updatePatient(userId: string, updates: Partial<PatientProfile>): Promise<{ success: boolean; error?: string; patient?: PatientProfile }> {
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, patient };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update patient profile';
      return { success: false, error: errorMessage };
    }
  },

  // Delete patient profile
  async deletePatient(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete patient profile';
      return { success: false, error: errorMessage };
    }
  },
}; 