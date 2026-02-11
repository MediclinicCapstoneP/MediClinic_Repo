import { supabase } from '../../../supabaseClient';
import type { ClinicProfile, CreateClinicData } from '../../../types/auth';
import type { ClinicService } from '../../../types/clinicServices';
import { ClinicRiskAssessmentService } from '../../../services/clinicRiskAssessmentService';

// Interface for clinics with services and pricing
interface ClinicWithServices extends ClinicProfile {
  services_with_pricing?: ClinicService[];
}

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
  profile_pic_url?: string;
  latitude?: number;
  longitude?: number;
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
  profile_pic_url?: string;
  latitude?: number;
  longitude?: number;
}

export const clinicService = {
  // Create a new clinic profile
  async createClinic(data: CreateClinicData): Promise<{ success: boolean; error?: string; clinic?: ClinicProfile }> {
    try {
      console.log('Creating clinic with data:', data);
      
      // First check if clinic already exists
      const existingClinic = await this.getClinicByUserId(data.user_id);
      if (existingClinic.success && existingClinic.clinic) {
        console.log('Clinic already exists, returning existing clinic');
        return { success: true, clinic: existingClinic.clinic };
      }
      
      // Extract specialties and services from data
      const { specialties, custom_specialties, services, custom_services, ...clinicData } = data;
      
      const { data: clinic, error } = await supabase
        .from('clinics')
        .insert([clinicData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating clinic:', error);
        return { success: false, error: error.message };
      }

      console.log('Clinic created successfully:', clinic);

      // Add specialties to the clinic_specialties table
      if (clinic && ((specialties && specialties.length > 0) || (custom_specialties && custom_specialties.length > 0))) {
        const specialtyResult = await clinicSpecialtyService.replaceClinicSpecialties(
          clinic.id,
          specialties || [],
          custom_specialties || []
        );
        
        if (!specialtyResult.success) {
          console.error('Error adding specialties to clinic:', specialtyResult.error);
          // Don't fail the clinic creation, just log the error
        }
      }

      // Return clinic with specialties loaded
      const clinicWithSpecialties = await this.loadClinicSpecialties(clinic);
      return { success: true, clinic: clinicWithSpecialties };
    } catch (error) {
      console.error('Exception creating clinic:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create clinic profile';
      return { success: false, error: errorMessage };
    }
  },

  // Get clinic profile by user ID
  async getClinicByUserId(userId: string): Promise<{ success: boolean; error?: string; clinic?: ClinicProfile }> {
    try {
      console.log('Fetching clinic for user ID:', userId);
      
      // Validate userId parameter
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.error('Invalid user ID provided:', userId);
        return { success: false, error: 'Invalid user ID provided' };
      }
      
      // First check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error:', authError);
        return { success: false, error: 'Authentication error' };
      }
      
      if (!user) {
        console.error('No authenticated user found');
        return { success: false, error: 'No authenticated user found' };
      }
      
      // Verify this is a clinic user
      if (user.user_metadata?.role !== 'clinic') {
        console.error('User is not a clinic user:', user.user_metadata);
        return { success: false, error: 'User is not registered as a clinic' };
      }
      
      console.log('Authenticated clinic user:', user.id);

      // Try to fetch the clinic profile
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Database error:', error);
        
        if (error.code === 'PGRST116') {
          // No clinic found for this user
          console.log('No clinic found for user:', userId);
          return { success: true, clinic: undefined };
        }
        
        if (error.code === '406') {
          // Not Acceptable - likely RLS policy issue
          console.error('RLS policy prevented access. Error details:', error);
          return { 
            success: false, 
            error: 'Access denied. Please ensure your clinic profile exists and you have proper permissions. If this is a new clinic, please complete your registration first.' 
          };
        }
        
        console.error('Error fetching clinic:', error);
        return { success: false, error: error.message };
      }

      console.log('Clinic found:', clinic);
      return { success: true, clinic };
    } catch (error) {
      console.error('Unexpected error fetching clinic:', error);
      return { success: false, error: 'Failed to fetch clinic profile' };
    }
  },

  // Update clinic profile picture
  async updateClinicProfilePicture(clinicId: string, profilePicUrl: string): Promise<{ success: boolean; error?: string; clinic?: ClinicProfile }> {
    try {
      console.log('🖼️ Updating clinic profile picture:', { clinicId, profilePicUrl });
      
      const { data: clinic, error } = await supabase
        .from('clinics')
        .update({ 
          profile_pic_url: profilePicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', clinicId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating clinic profile picture:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Clinic profile picture updated successfully:', clinic);
      return { success: true, clinic };
    } catch (error) {
      console.error('💥 Unexpected error updating clinic profile picture:', error);
      return { success: false, error: 'Failed to update clinic profile picture' };
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

  // Get all public clinics (for patients to browse)
  async getPublicClinics(): Promise<{ success: boolean; error?: string; clinics?: ClinicProfile[] }> {
    try {
      console.log(' Fetching all public clinics...');
      
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('status', 'approved')
        .order('clinic_name');

      if (error) {
        console.error(' Error fetching public clinics:', error);
        return { success: false, error: error.message };
      }

      console.log(` Found ${clinics?.length || 0} approved clinics`);
      
      // Load specialties for each clinic
      const clinicsWithSpecialties = await Promise.all(
        (clinics || []).map(clinic => this.loadClinicSpecialties(clinic))
      );

      return { success: true, clinics: clinicsWithSpecialties };
    } catch (error) {
      console.error(' Unexpected error fetching public clinics:', error);
      return { success: false, error: 'Failed to fetch public clinics' };
    }
  },

  // Get clinics with their services and pricing
  async getClinicsWithServices(): Promise<{ success: boolean; error?: string; clinics?: ClinicWithServices[] }> {
    try {
      // First get all approved clinics
      const { data: clinics, error: clinicsError } = await supabase
        .from('clinics')
        .select('*')
        .eq('status', 'approved');

      if (clinicsError) {
        console.error('Error fetching clinics:', clinicsError);
        return { success: false, error: clinicsError.message };
      }

      if (!clinics || clinics.length === 0) {
        return { success: true, clinics: [] };
      }

      // Get clinic IDs for service lookup
      const clinicIds = clinics.map(clinic => clinic.id);

      // Try to fetch services for all clinics, but handle table not existing
      let services: any[] = [];
      try {
        const { data: servicesData, error: servicesError } = await supabase
          .from('clinic_services')
          .select('*')
          .in('clinic_id', clinicIds)
          .eq('is_available', true)
          .order('clinic_id, base_price');

        if (servicesError) {
          // If table doesn't exist, log warning but continue without services
          if (servicesError.code === '42P01') {
            console.warn('clinic_services table does not exist. Please run the SQL script to create it.');
            services = [];
          } else {
            console.error('Error fetching clinic services:', servicesError);
            return { success: false, error: servicesError.message };
          }
        } else {
          services = servicesData || [];
        }
      } catch (servicesFetchError) {
        console.warn('Could not fetch clinic services, continuing without pricing data:', servicesFetchError);
        services = [];
      }

      // Group services by clinic_id
      const servicesByClinic = services.reduce((acc, service) => {
        if (!acc[service.clinic_id]) {
          acc[service.clinic_id] = [];
        }
        acc[service.clinic_id].push(service);
        return acc;
      }, {} as Record<string, any[]>);

      // Combine clinics with their services
      const clinicsWithServices: ClinicWithServices[] = clinics.map(clinic => ({
        ...clinic,
        services_with_pricing: servicesByClinic[clinic.id] || []
      }));

      return { success: true, clinics: clinicsWithServices };
    } catch (error) {
      console.error('Unexpected error in getClinicsWithServices:', error);
      return { success: false, error: 'Failed to fetch clinics with services' };
    }
  },


// ... (rest of the code remains the same)
  async upsertClinic(data: CreateClinicData): Promise<{ success: boolean; error?: string; clinic?: ClinicProfile }> {
    try {
      console.log('Upserting clinic with data:', data);
      
      // Ensure status is set to approved for new clinics
      const clinicData = {
        ...data,
        status: 'approved' // Default to approved status
      };
      
      const { data: clinic, error } = await supabase
        .from('clinics')
        .upsert([clinicData], { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error upserting clinic:', error);
        return { success: false, error: error.message };
      }

      console.log('Clinic upserted successfully:', clinic);
      return { success: true, clinic };
    } catch (error) {
      console.error('Exception upserting clinic:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upsert clinic profile';
      return { success: false, error: errorMessage };
    }
  },

  // Helper method to load specialties for a clinic
  async loadClinicSpecialties(clinic: ClinicProfile): Promise<ClinicProfile> {
    try {
      const specialtyResult = await clinicSpecialtyService.getSpecialtiesByClinicId(clinic.id);
      if (specialtyResult.success && specialtyResult.specialties) {
        const standardSpecialties: string[] = [];
        const customSpecialties: string[] = [];
        
        specialtyResult.specialties.forEach(specialty => {
          if (specialty.is_custom) {
            customSpecialties.push(specialty.specialty_name);
          } else {
            standardSpecialties.push(specialty.specialty_name);
          }
        });
        
        return {
          ...clinic,
          specialties: standardSpecialties,
          custom_specialties: customSpecialties
        };
      }
    } catch (error) {
      console.error('Error loading clinic specialties:', error);
    }
    
    return {
      ...clinic,
      specialties: [],
      custom_specialties: []
    };
  },
}; 