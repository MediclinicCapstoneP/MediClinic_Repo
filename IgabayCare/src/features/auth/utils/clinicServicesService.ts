import { supabase } from '../../../supabaseClient';

/**
 * Clinic Services Service
 * 
 * Handles fetching and managing clinic services for appointment booking
 */

export interface ClinicService {
  id: string;
  clinic_id: string;
  service_name: string;
  service_category: string;
  description?: string;
  base_price: number;
  currency: string;
  is_available: boolean;
  duration_minutes?: number;
  has_insurance_coverage: boolean;
  insurance_discount_percentage: number;
  senior_discount_percentage: number;
  student_discount_percentage: number;
  requires_appointment: boolean;
  requires_referral: boolean;
  min_age?: number;
  max_age?: number;
  created_at: string;
  updated_at: string;
}

export interface ServicePackage {
  id: string;
  clinic_id: string;
  package_name: string;
  description?: string;
  package_price: number;
  individual_total_price?: number;
  savings_amount?: number;
  is_available: boolean;
  validity_days: number;
  services?: ClinicService[];
}

class ClinicServicesService {
  /**
   * Get all available services for a specific clinic
   */
  async getClinicServices(clinicId: string): Promise<{
    success: boolean;
    services?: ClinicService[];
    error?: string;
  }> {
    try {
      const { data: services, error } = await supabase
        .from('clinic_services')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_available', true)
        .order('service_category', { ascending: true })
        .order('base_price', { ascending: true });

      if (error) {
        console.error('Error fetching clinic services:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        services: services || []
      };
    } catch (error) {
      console.error('Error in getClinicServices:', error);
      return {
        success: false,
        error: `Failed to fetch services: ${error}`
      };
    }
  }

  /**
   * Get services by category for a clinic
   */
  async getServicesByCategory(clinicId: string, category: string): Promise<{
    success: boolean;
    services?: ClinicService[];
    error?: string;
  }> {
    try {
      const { data: services, error } = await supabase
        .from('clinic_services')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('service_category', category)
        .eq('is_available', true)
        .order('base_price', { ascending: true });

      if (error) {
        console.error('Error fetching services by category:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        services: services || []
      };
    } catch (error) {
      console.error('Error in getServicesByCategory:', error);
      return {
        success: false,
        error: `Failed to fetch services: ${error}`
      };
    }
  }

  /**
   * Get a specific service by ID
   */
  async getServiceById(serviceId: string): Promise<{
    success: boolean;
    service?: ClinicService;
    error?: string;
  }> {
    try {
      const { data: service, error } = await supabase
        .from('clinic_services')
        .select('*')
        .eq('id', serviceId)
        .eq('is_available', true)
        .single();

      if (error) {
        console.error('Error fetching service by ID:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        service: service || undefined
      };
    } catch (error) {
      console.error('Error in getServiceById:', error);
      return {
        success: false,
        error: `Failed to fetch service: ${error}`
      };
    }
  }

  /**
   * Get available service packages for a clinic
   */
  async getClinicPackages(clinicId: string): Promise<{
    success: boolean;
    packages?: ServicePackage[];
    error?: string;
  }> {
    try {
      const { data: packages, error } = await supabase
        .from('clinic_service_packages')
        .select(`
          *,
          package_services (
            quantity,
            clinic_services (*)
          )
        `)
        .eq('clinic_id', clinicId)
        .eq('is_available', true)
        .order('package_price', { ascending: true });

      if (error) {
        console.error('Error fetching clinic packages:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Transform the data to include services in packages
      const transformedPackages = packages?.map(pkg => ({
        ...pkg,
        services: pkg.package_services?.map((ps: any) => ps.clinic_services) || []
      })) || [];

      return {
        success: true,
        packages: transformedPackages
      };
    } catch (error) {
      console.error('Error in getClinicPackages:', error);
      return {
        success: false,
        error: `Failed to fetch packages: ${error}`
      };
    }
  }

  /**
   * Search services by name or description
   */
  async searchServices(clinicId: string, searchTerm: string): Promise<{
    success: boolean;
    services?: ClinicService[];
    error?: string;
  }> {
    try {
      const { data: services, error } = await supabase
        .from('clinic_services')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_available', true)
        .or(`service_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('base_price', { ascending: true });

      if (error) {
        console.error('Error searching services:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        services: services || []
      };
    } catch (error) {
      console.error('Error in searchServices:', error);
      return {
        success: false,
        error: `Failed to search services: ${error}`
      };
    }
  }

  /**
   * Get services within a price range
   */
  async getServicesByPriceRange(
    clinicId: string, 
    minPrice: number, 
    maxPrice: number
  ): Promise<{
    success: boolean;
    services?: ClinicService[];
    error?: string;
  }> {
    try {
      const { data: services, error } = await supabase
        .from('clinic_services')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_available', true)
        .gte('base_price', minPrice)
        .lte('base_price', maxPrice)
        .order('base_price', { ascending: true });

      if (error) {
        console.error('Error fetching services by price range:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        services: services || []
      };
    } catch (error) {
      console.error('Error in getServicesByPriceRange:', error);
      return {
        success: false,
        error: `Failed to fetch services: ${error}`
      };
    }
  }

  /**
   * Calculate total cost including discounts
   */
  calculateServiceCost(
    service: ClinicService, 
    patientAge?: number, 
    isStudent?: boolean, 
    hasInsurance?: boolean
  ): {
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
    discountType?: string;
  } {
    let discountPercentage = 0;
    let discountType = '';

    // Apply the highest applicable discount
    if (hasInsurance && service.has_insurance_coverage) {
      discountPercentage = Math.max(discountPercentage, service.insurance_discount_percentage);
      discountType = 'Insurance Coverage';
    }

    if (patientAge && patientAge >= 60) {
      discountPercentage = Math.max(discountPercentage, service.senior_discount_percentage);
      discountType = 'Senior Citizen Discount';
    }

    if (isStudent) {
      discountPercentage = Math.max(discountPercentage, service.student_discount_percentage);
      discountType = 'Student Discount';
    }

    const basePrice = service.base_price;
    const discountAmount = (basePrice * discountPercentage) / 100;
    const finalPrice = basePrice - discountAmount;

    return {
      basePrice,
      discountAmount,
      finalPrice,
      discountType: discountAmount > 0 ? discountType : undefined
    };
  }

  /**
   * Get service categories available at a clinic
   */
  async getServiceCategories(clinicId: string): Promise<{
    success: boolean;
    categories?: string[];
    error?: string;
  }> {
    try {
      const { data: services, error } = await supabase
        .from('clinic_services')
        .select('service_category')
        .eq('clinic_id', clinicId)
        .eq('is_available', true);

      if (error) {
        console.error('Error fetching service categories:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const categories = [...new Set(services?.map(s => s.service_category) || [])];

      return {
        success: true,
        categories
      };
    } catch (error) {
      console.error('Error in getServiceCategories:', error);
      return {
        success: false,
        error: `Failed to fetch categories: ${error}`
      };
    }
  }

  /**
   * Format service category for display
   */
  formatServiceCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'consultation': 'General Consultation',
      'routine_checkup': 'Routine Checkup',
      'follow_up': 'Follow-up Visit',
      'emergency': 'Emergency Care',
      'specialist_visit': 'Specialist Consultation',
      'vaccination': 'Vaccination',
      'procedure': 'Medical Procedure',
      'surgery': 'Surgery',
      'lab_test': 'Laboratory Test',
      'imaging': 'Medical Imaging',
      'physical_therapy': 'Physical Therapy',
      'mental_health': 'Mental Health',
      'dental': 'Dental Care',
      'vision': 'Vision Care',
      'other': 'Other Services'
    };

    return categoryMap[category] || category;
  }

  /**
   * Format currency for display
   */
  formatPrice(amount: number, currency: string = 'PHP'): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }
}

// Export singleton instance
export const clinicServicesService = new ClinicServicesService();
export default clinicServicesService;
