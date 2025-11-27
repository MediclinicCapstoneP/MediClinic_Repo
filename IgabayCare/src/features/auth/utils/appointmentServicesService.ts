import { supabase } from '../../../supabaseClient';
import { clinicServicesService, ClinicService } from './clinicServicesService';

/**
 * Service to handle appointment services
 * This handles the relationship between appointments and the services selected
 */

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id: string;
  service_name: string;
  quantity?: number;
  price: number;
  total_price: number;
}

class AppointmentServicesService {
  private static TABLE_NAME = 'appointment_services';

  /**
   * Get services for a specific appointment
   */
  static async getAppointmentServices(appointmentId: string): Promise<{
    success: boolean;
    services?: AppointmentService[];
    error?: string;
  }> {
    try {
      // First try to get from appointment_services table if it exists
      const { data: appointmentServices, error } = await supabase
        .from(this.TABLE_NAME)
        .select(`
          *,
          clinic_services (
            id,
            service_name,
            base_price,
            service_category,
            description
          )
        `)
        .eq('appointment_id', appointmentId);

      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        console.error('Error fetching appointment services:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // If the table doesn't exist or query failed, return empty array
      if (error || !appointmentServices) {
        return {
          success: true,
          services: []
        };
      }

      // Transform the data
      const services: AppointmentService[] = appointmentServices.map(as => ({
        id: as.id,
        appointment_id: as.appointment_id,
        service_id: as.service_id,
        service_name: as.clinic_services?.service_name || 'Unknown Service',
        quantity: as.quantity || 1,
        price: as.price || as.clinic_services?.base_price || 0,
        total_price: as.total_price || (as.price * (as.quantity || 1))
      }));

      return {
        success: true,
        services
      };
    } catch (error) {
      console.warn('Appointment services table may not exist, returning empty services:', error);
      return {
        success: true,
        services: []
      };
    }
  }

  /**
   * Get appointment services display text
   * If no specific services are found, derive from appointment type
   */
  static async getAppointmentServicesDisplay(
    appointmentId: string, 
    appointmentType: string, 
    clinicId?: string
  ): Promise<string[]> {
    try {
      const result = await this.getAppointmentServices(appointmentId);
      
      if (result.success && result.services && result.services.length > 0) {
        return result.services.map(s => s.service_name);
      }

      // Fallback: derive services from appointment type
      return this.deriveServicesFromAppointmentType(appointmentType);
    } catch (error) {
      console.warn('Error getting appointment services display:', error);
      return this.deriveServicesFromAppointmentType(appointmentType);
    }
  }

  /**
   * Derive likely services from appointment type
   */
  private static deriveServicesFromAppointmentType(appointmentType: string): string[] {
    const serviceMap: Record<string, string[]> = {
      'consultation': ['General Consultation'],
      'follow_up': ['Follow-up Visit'],
      'emergency': ['Emergency Care'],
      'routine_checkup': ['Routine Health Checkup', 'Vital Signs Check'],
      'specialist_visit': ['Specialist Consultation'],
      'procedure': ['Medical Procedure'],
      'surgery': ['Surgical Procedure'],
      'lab_test': ['Laboratory Tests'],
      'imaging': ['Medical Imaging'],
      'vaccination': ['Vaccination'],
      'physical_therapy': ['Physical Therapy Session'],
      'mental_health': ['Mental Health Consultation'],
      'dental': ['Dental Consultation'],
      'vision': ['Vision/Eye Examination'],
      'other': ['Medical Service']
    };

    return serviceMap[appointmentType] || ['Medical Consultation'];
  }

  /**
   * Calculate total services cost for an appointment
   */
  static async getAppointmentServicesTotal(appointmentId: string): Promise<number> {
    try {
      const result = await this.getAppointmentServices(appointmentId);
      
      if (result.success && result.services) {
        return result.services.reduce((total, service) => total + service.total_price, 0);
      }

      return 0;
    } catch (error) {
      console.warn('Error calculating appointment services total:', error);
      return 0;
    }
  }

  /**
   * Format services for display
   */
  static formatServicesDisplay(services: string[]): string {
    if (services.length === 0) return 'No services specified';
    if (services.length === 1) return services[0];
    if (services.length <= 3) return services.join(', ');
    
    return `${services.slice(0, 2).join(', ')} +${services.length - 2} more`;
  }
}

export { AppointmentServicesService };
export default AppointmentServicesService;
