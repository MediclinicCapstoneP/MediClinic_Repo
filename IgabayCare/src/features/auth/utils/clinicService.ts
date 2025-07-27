import { supabase } from '../../../supabaseClient';

export interface ClinicProfile {
  id: string;
  user_id: string;
  clinic_name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  license_number?: string;
  accreditation?: string;
  tax_id?: string;
  year_established?: number;
  specialties?: string[];
  custom_specialties?: string[];
  services?: string[];
  custom_services?: string[];
  operating_hours?: any;
  number_of_doctors?: number;
  number_of_staff?: number;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateClinicData {
  user_id: string;
  clinic_name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  license_number?: string;
  accreditation?: string;
  tax_id?: string;
  year_established?: number;
  specialties?: string[];
  custom_specialties?: string[];
  services?: string[];
  custom_services?: string[];
  operating_hours?: any;
  number_of_doctors?: number;
  number_of_staff?: number;
  description?: string;
}

export const clinicService = {
  // Create a new clinic profile
  async createClinic(data: CreateClinicData): Promise<{ success: boolean; error?: string; clinic?: ClinicProfile }> {
    try {
      const { data: clinic, error } = await supabase
        .from('clinics')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating clinic:', error);
        return { success: false, error: error.message };
      }

      return { success: true, clinic };
    } catch (error) {
      console.error('Unexpected error creating clinic:', error);
      return { success: false, error: 'Failed to create clinic profile' };
    }
  },

  // Get clinic profile by user ID
  async getClinicByUserId(userId: string): Promise<{ success: boolean; error?: string; clinic?: ClinicProfile }> {
    try {
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No clinic found for this user
          return { success: true, clinic: undefined };
        }
        console.error('Error fetching clinic:', error);
        return { success: false, error: error.message };
      }

      return { success: true, clinic };
    } catch (error) {
      console.error('Unexpected error fetching clinic:', error);
      return { success: false, error: 'Failed to fetch clinic profile' };
    }
  },

  // Update clinic profile
  async updateClinic(clinicId: string, updates: Partial<ClinicProfile>): Promise<{ success: boolean; error?: string; clinic?: ClinicProfile }> {
    try {
      const { data: clinic, error } = await supabase
        .from('clinics')
        .update(updates)
        .eq('id', clinicId)
        .select()
        .single();

      if (error) {
        console.error('Error updating clinic:', error);
        return { success: false, error: error.message };
      }

      return { success: true, clinic };
    } catch (error) {
      console.error('Unexpected error updating clinic:', error);
      return { success: false, error: 'Failed to update clinic profile' };
    }
  },

  // Delete clinic profile
  async deleteClinic(clinicId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('clinics')
        .delete()
        .eq('id', clinicId);

      if (error) {
        console.error('Error deleting clinic:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error deleting clinic:', error);
      return { success: false, error: 'Failed to delete clinic profile' };
    }
  },

  // Get all clinics (for admin purposes)
  async getAllClinics(): Promise<{ success: boolean; error?: string; clinics?: ClinicProfile[] }> {
    try {
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clinics:', error);
        return { success: false, error: error.message };
      }

      return { success: true, clinics };
    } catch (error) {
      console.error('Unexpected error fetching clinics:', error);
      return { success: false, error: 'Failed to fetch clinics' };
    }
  }
}; 