import { supabase } from '../../../supabaseClient';
import type { ClinicService, CreateClinicServiceData } from '../../../types/clinicServices';

export const clinicServicePricingService = {
  // Get all services for a specific clinic
  async getClinicServices(clinicId: string): Promise<{ success: boolean; error?: string; services?: ClinicService[] }> {
    try {
      const { data: services, error } = await supabase
        .from('clinic_services')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_available', true)
        .order('service_name');

      if (error) {
        console.error('Error fetching clinic services:', error);
        return { success: false, error: error.message };
      }

      return { success: true, services: services || [] };
    } catch (error) {
      console.error('Unexpected error fetching clinic services:', error);
      return { success: false, error: 'Failed to fetch clinic services' };
    }
  },

  // Get services with pricing for multiple clinics
  async getServicesForClinics(clinicIds: string[]): Promise<{ success: boolean; error?: string; clinicServices?: Record<string, ClinicService[]> }> {
    try {
      const { data: services, error } = await supabase
        .from('clinic_services')
        .select('*')
        .in('clinic_id', clinicIds)
        .eq('is_available', true)
        .order('clinic_id, service_name');

      if (error) {
        console.error('Error fetching services for clinics:', error);
        return { success: false, error: error.message };
      }

      // Group services by clinic_id
      const clinicServices: Record<string, ClinicService[]> = {};
      services?.forEach(service => {
        if (!clinicServices[service.clinic_id]) {
          clinicServices[service.clinic_id] = [];
        }
        clinicServices[service.clinic_id].push(service);
      });

      return { success: true, clinicServices };
    } catch (error) {
      console.error('Unexpected error fetching clinic services:', error);
      return { success: false, error: 'Failed to fetch clinic services' };
    }
  },

  // Get price range for a specific service across all clinics
  async getServicePriceRange(serviceName: string): Promise<{ success: boolean; error?: string; priceRange?: { min: number; max: number; average: number } }> {
    try {
      const { data: services, error } = await supabase
        .from('clinic_services')
        .select('base_price')
        .ilike('service_name', `%${serviceName}%`)
        .eq('is_available', true);

      if (error) {
        console.error('Error fetching service price range:', error);
        return { success: false, error: error.message };
      }

      if (!services || services.length === 0) {
        return { success: true, priceRange: { min: 0, max: 0, average: 0 } };
      }

      const prices = services.map(s => s.base_price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;

      return { success: true, priceRange: { min, max, average } };
    } catch (error) {
      console.error('Unexpected error fetching service price range:', error);
      return { success: false, error: 'Failed to fetch service price range' };
    }
  },

  // Create a new service for a clinic
  async createClinicService(serviceData: CreateClinicServiceData): Promise<{ success: boolean; error?: string; service?: ClinicService }> {
    try {
      const { data: service, error } = await supabase
        .from('clinic_services')
        .insert([serviceData])
        .select()
        .single();

      if (error) {
        console.error('Error creating clinic service:', error);
        return { success: false, error: error.message };
      }

      return { success: true, service };
    } catch (error) {
      console.error('Unexpected error creating clinic service:', error);
      return { success: false, error: 'Failed to create clinic service' };
    }
  },

  // Update a clinic service
  async updateClinicService(serviceId: string, updates: Partial<ClinicService>): Promise<{ success: boolean; error?: string; service?: ClinicService }> {
    try {
      const { data: service, error } = await supabase
        .from('clinic_services')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', serviceId)
        .select()
        .single();

      if (error) {
        console.error('Error updating clinic service:', error);
        return { success: false, error: error.message };
      }

      return { success: true, service };
    } catch (error) {
      console.error('Unexpected error updating clinic service:', error);
      return { success: false, error: 'Failed to update clinic service' };
    }
  },

  // Delete a clinic service
  async deleteClinicService(serviceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('clinic_services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        console.error('Error deleting clinic service:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error deleting clinic service:', error);
      return { success: false, error: 'Failed to delete clinic service' };
    }
  },

  // Get all unique service names across all clinics
  async getAllServiceNames(): Promise<{ success: boolean; error?: string; serviceNames?: string[] }> {
    try {
      const { data: services, error } = await supabase
        .from('clinic_services')
        .select('service_name')
        .eq('is_available', true);

      if (error) {
        console.error('Error fetching service names:', error);
        return { success: false, error: error.message };
      }

      const uniqueServiceNames = [...new Set(services?.map(s => s.service_name) || [])].sort();
      return { success: true, serviceNames: uniqueServiceNames };
    } catch (error) {
      console.error('Unexpected error fetching service names:', error);
      return { success: false, error: 'Failed to fetch service names' };
    }
  },

  // Get cheapest and most expensive services for filtering
  async getGlobalPriceRange(): Promise<{ success: boolean; error?: string; priceRange?: { min: number; max: number } }> {
    try {
      const { data: priceStats, error } = await supabase
        .from('clinic_services')
        .select('base_price')
        .eq('is_available', true);

      if (error) {
        console.error('Error fetching global price range:', error);
        return { success: false, error: error.message };
      }

      if (!priceStats || priceStats.length === 0) {
        return { success: true, priceRange: { min: 0, max: 5000 } };
      }

      const prices = priceStats.map(s => s.base_price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      return { success: true, priceRange: { min, max } };
    } catch (error) {
      console.error('Unexpected error fetching global price range:', error);
      return { success: false, error: 'Failed to fetch price range' };
    }
  }
};
