import { supabase } from '../../../supabaseClient';

export interface ClinicSpecialty {
  id: string;
  clinic_id: string;
  specialty_name: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClinicSpecialtyData {
  clinic_id: string;
  specialty_name: string;
  is_custom?: boolean;
}

export interface UpdateClinicSpecialtyData {
  specialty_name?: string;
  is_custom?: boolean;
}

export const clinicSpecialtyService = {
  // Get all specialties for a specific clinic
  async getSpecialtiesByClinicId(clinicId: string): Promise<{ success: boolean; specialties?: ClinicSpecialty[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('clinic_specialties')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('specialty_name', { ascending: true });

      if (error) {
        console.error('Error fetching clinic specialties:', error);
        return { success: false, error: error.message };
      }

      return { success: true, specialties: data || [] };
    } catch (error) {
      console.error('Error in getSpecialtiesByClinicId:', error);
      return { success: false, error: 'Failed to fetch clinic specialties' };
    }
  },

  // Get all available specialty names (for dropdowns/selection)
  async getAllSpecialtyNames(): Promise<{ success: boolean; specialties?: string[]; error?: string }> {
    try {
      // Use the standard_specialties table instead of template clinic
      const { data, error } = await supabase
        .from('standard_specialties')
        .select('specialty_name')
        .order('specialty_name', { ascending: true });

      if (error) {
        console.error('Error fetching specialty names:', error);
        return { success: false, error: error.message };
      }

      const specialtyNames = data?.map(item => item.specialty_name) || [];
      return { success: true, specialties: specialtyNames };
    } catch (error) {
      console.error('Error in getAllSpecialtyNames:', error);
      return { success: false, error: 'Failed to fetch specialty names' };
    }
  },

  // Add a specialty to a clinic
  async addSpecialtyToClinic(data: CreateClinicSpecialtyData): Promise<{ success: boolean; specialty?: ClinicSpecialty; error?: string }> {
    try {
      const { data: specialty, error } = await supabase
        .from('clinic_specialties')
        .insert([{
          clinic_id: data.clinic_id,
          specialty_name: data.specialty_name,
          is_custom: data.is_custom || false
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding specialty to clinic:', error);
        return { success: false, error: error.message };
      }

      return { success: true, specialty };
    } catch (error) {
      console.error('Error in addSpecialtyToClinic:', error);
      return { success: false, error: 'Failed to add specialty to clinic' };
    }
  },

  // Add multiple specialties to a clinic
  async addSpecialtiesToClinic(clinicId: string, specialtyNames: string[], isCustom: boolean = false): Promise<{ success: boolean; specialties?: ClinicSpecialty[]; error?: string }> {
    try {
      const specialtiesData = specialtyNames.map(name => ({
        clinic_id: clinicId,
        specialty_name: name.trim(),
        is_custom: isCustom
      }));

      const { data, error } = await supabase
        .from('clinic_specialties')
        .insert(specialtiesData)
        .select();

      if (error) {
        console.error('Error adding specialties to clinic:', error);
        return { success: false, error: error.message };
      }

      return { success: true, specialties: data || [] };
    } catch (error) {
      console.error('Error in addSpecialtiesToClinic:', error);
      return { success: false, error: 'Failed to add specialties to clinic' };
    }
  },

  // Update a specialty
  async updateSpecialty(specialtyId: string, data: UpdateClinicSpecialtyData): Promise<{ success: boolean; specialty?: ClinicSpecialty; error?: string }> {
    try {
      const { data: specialty, error } = await supabase
        .from('clinic_specialties')
        .update(data)
        .eq('id', specialtyId)
        .select()
        .single();

      if (error) {
        console.error('Error updating specialty:', error);
        return { success: false, error: error.message };
      }

      return { success: true, specialty };
    } catch (error) {
      console.error('Error in updateSpecialty:', error);
      return { success: false, error: 'Failed to update specialty' };
    }
  },

  // Remove a specialty from a clinic
  async removeSpecialtyFromClinic(specialtyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('clinic_specialties')
        .delete()
        .eq('id', specialtyId);

      if (error) {
        console.error('Error removing specialty from clinic:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in removeSpecialtyFromClinic:', error);
      return { success: false, error: 'Failed to remove specialty from clinic' };
    }
  },

  // Remove multiple specialties from a clinic
  async removeSpecialtiesFromClinic(clinicId: string, specialtyNames: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('clinic_specialties')
        .delete()
        .eq('clinic_id', clinicId)
        .in('specialty_name', specialtyNames);

      if (error) {
        console.error('Error removing specialties from clinic:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in removeSpecialtiesFromClinic:', error);
      return { success: false, error: 'Failed to remove specialties from clinic' };
    }
  },

  // Replace all specialties for a clinic (delete existing and add new ones)
  async replaceClinicSpecialties(clinicId: string, specialtyNames: string[], customSpecialtyNames: string[] = []): Promise<{ success: boolean; error?: string }> {
    try {
      // First, remove all existing specialties for this clinic
      const { error: deleteError } = await supabase
        .from('clinic_specialties')
        .delete()
        .eq('clinic_id', clinicId);

      if (deleteError) {
        console.error('Error removing existing specialties:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Prepare all specialties to add
      const allSpecialties = [
        ...specialtyNames.map(name => ({ name: name.trim(), isCustom: false })),
        ...customSpecialtyNames.map(name => ({ name: name.trim(), isCustom: true }))
      ].filter(item => item.name.length > 0);

      if (allSpecialties.length === 0) {
        return { success: true }; // No specialties to add
      }

      // Add all new specialties
      const specialtiesData = allSpecialties.map(item => ({
        clinic_id: clinicId,
        specialty_name: item.name,
        is_custom: item.isCustom
      }));

      const { error: insertError } = await supabase
        .from('clinic_specialties')
        .insert(specialtiesData);

      if (insertError) {
        console.error('Error adding new specialties:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in replaceClinicSpecialties:', error);
      return { success: false, error: 'Failed to replace clinic specialties' };
    }
  },

  // Get specialties for public display (approved clinics only)
  async getPublicSpecialtiesByClinicId(clinicId: string): Promise<{ success: boolean; specialties?: string[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('clinic_specialties')
        .select('specialty_name')
        .eq('clinic_id', clinicId)
        .order('specialty_name', { ascending: true });

      if (error) {
        console.error('Error fetching public clinic specialties:', error);
        return { success: false, error: error.message };
      }

      const specialtyNames = data?.map(item => item.specialty_name) || [];
      return { success: true, specialties: specialtyNames };
    } catch (error) {
      console.error('Error in getPublicSpecialtiesByClinicId:', error);
      return { success: false, error: 'Failed to fetch public clinic specialties' };
    }
  }
}; 