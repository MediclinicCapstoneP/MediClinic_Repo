import { supabase } from '../../../supabaseClient';

export interface DoctorProfile {
  id: string;
  user_id: string;
  clinic_id: string;
  full_name: string;
  specialization: string;
  email: string;
  phone: string | null;
  license_number: string;
  years_experience: number | null;
  availability: string | null;
  status: 'active' | 'on-leave' | 'inactive';
  rating: number;
  total_patients: number;
  profile_picture_url: string | null;
  profile_picture_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDoctorData {
  user_id: string;
  clinic_id: string;
  full_name: string;
  specialization: string;
  email: string;
  phone?: string;
  license_number: string;
  years_experience?: number;
  availability?: string;
  status?: 'active' | 'on-leave' | 'inactive';
}

export interface UpdateDoctorData {
  full_name?: string;
  specialization?: string;
  email?: string;
  phone?: string;
  license_number?: string;
  years_experience?: number;
  availability?: string;
  status?: 'active' | 'on-leave' | 'inactive';
  profile_picture_url?: string;
  profile_picture_path?: string;
}

class DoctorService {
  async createDoctor(data: CreateDoctorData): Promise<{ success: boolean; error?: string; doctor?: DoctorProfile }> {
    try {
      console.log('Creating doctor with data:', data);
      
      const { data: doctor, error } = await supabase
        .from('doctors')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating doctor:', error);
        return { success: false, error: error.message };
      }

      console.log('Doctor created successfully:', doctor);
      return { success: true, doctor };
    } catch (error) {
      console.error('Error creating doctor:', error);
      return { success: false, error: 'Failed to create doctor' };
    }
  }

  async getDoctorsByClinicId(clinicId: string): Promise<{ success: boolean; error?: string; doctors?: DoctorProfile[] }> {
    try {
      console.log('Fetching doctors for clinic:', clinicId);
      
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching doctors:', error);
        return { success: false, error: error.message };
      }

      console.log('Doctors fetched successfully:', doctors);
      return { success: true, doctors };
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return { success: false, error: 'Failed to fetch doctors' };
    }
  }

  async getDoctorById(id: string): Promise<{ success: boolean; error?: string; doctor?: DoctorProfile }> {
    try {
      const { data: doctor, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error fetching doctor:', error);
        return { success: false, error: error.message };
      }

      return { success: true, doctor };
    } catch (error) {
      console.error('Error fetching doctor:', error);
      return { success: false, error: 'Failed to fetch doctor' };
    }
  }

  async updateDoctor(id: string, data: UpdateDoctorData): Promise<{ success: boolean; error?: string; doctor?: DoctorProfile }> {
    try {
      const { data: doctor, error } = await supabase
        .from('doctors')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating doctor:', error);
        return { success: false, error: error.message };
      }

      return { success: true, doctor };
    } catch (error) {
      console.error('Error updating doctor:', error);
      return { success: false, error: 'Failed to update doctor' };
    }
  }

  async deleteDoctor(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting doctor:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting doctor:', error);
      return { success: false, error: 'Failed to delete doctor' };
    }
  }

  async getAllActiveDoctors(): Promise<{ success: boolean; error?: string; doctors?: DoctorProfile[] }> {
    try {
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('status', 'active')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Supabase error fetching active doctors:', error);
        return { success: false, error: error.message };
      }

      return { success: true, doctors };
    } catch (error) {
      console.error('Error fetching active doctors:', error);
      return { success: false, error: 'Failed to fetch active doctors' };
    }
  }
}

export const doctorService = new DoctorService(); 