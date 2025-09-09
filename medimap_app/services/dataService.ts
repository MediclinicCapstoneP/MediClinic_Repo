import { supabase, type Tables, type InsertTables, type UpdateTables } from '../lib/supabase';

export interface ClinicWithDistance extends Tables<'clinics'> {
  distance?: number;
  averageRating?: number;
  estimatedPrice?: number;
}

export interface AppointmentWithDetails extends Tables<'appointments'> {
  clinic?: Tables<'clinics'>;
  patient?: Tables<'patients'>;
}

export const dataService = {
  // ========== CLINIC SERVICES ==========

  // Get all approved clinics
  async getClinics(): Promise<{ success: boolean; data?: Tables<'clinics'>[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('status', 'approved')
        .order('clinic_name');

      if (error) {
        console.error('Error fetching clinics:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Exception fetching clinics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch clinics' 
      };
    }
  },

  // Get clinic by ID
  async getClinicById(id: string): Promise<{ success: boolean; data?: Tables<'clinics'>; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching clinic:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception fetching clinic:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch clinic' 
      };
    }
  },

  // Search clinics by name or location
  async searchClinics(query: string): Promise<{ success: boolean; data?: Tables<'clinics'>[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('status', 'approved')
        .or(`clinic_name.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%`)
        .order('clinic_name');

      if (error) {
        console.error('Error searching clinics:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Exception searching clinics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to search clinics' 
      };
    }
  },

  // Get nearby clinics (you would need to implement distance calculation)
  async getNearbyClinics(latitude: number, longitude: number, radius: number = 10): Promise<{ 
    success: boolean; 
    data?: ClinicWithDistance[]; 
    error?: string 
  }> {
    try {
      // First get all approved clinics with coordinates
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('status', 'approved')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching nearby clinics:', error);
        return { success: false, error: error.message };
      }

      // Calculate distances and filter by radius
      const clinicsWithDistance: ClinicWithDistance[] = (data || []).map(clinic => {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          clinic.latitude!, 
          clinic.longitude!
        );
        
        return {
          ...clinic,
          distance,
          averageRating: 4.5, // Mock rating - you can implement actual ratings later
          estimatedPrice: 500, // Mock price - you can implement actual pricing later
        };
      }).filter(clinic => clinic.distance! <= radius)
        .sort((a, b) => a.distance! - b.distance!);

      return { success: true, data: clinicsWithDistance };
    } catch (error) {
      console.error('Exception fetching nearby clinics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch nearby clinics' 
      };
    }
  },

  // ========== APPOINTMENT SERVICES ==========

  // Get patient appointments
  async getPatientAppointments(patientId: string): Promise<{ 
    success: boolean; 
    data?: AppointmentWithDetails[]; 
    error?: string 
  }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics (*)
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });

      if (error) {
        console.error('Error fetching appointments:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as AppointmentWithDetails[] || [] };
    } catch (error) {
      console.error('Exception fetching appointments:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch appointments' 
      };
    }
  },

  // Create new appointment
  async createAppointment(appointmentData: InsertTables<'appointments'>): Promise<{ 
    success: boolean; 
    data?: Tables<'appointments'>; 
    error?: string 
  }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception creating appointment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create appointment' 
      };
    }
  },

  // Update appointment
  async updateAppointment(
    id: string, 
    updates: UpdateTables<'appointments'>
  ): Promise<{ success: boolean; data?: Tables<'appointments'>; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception updating appointment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update appointment' 
      };
    }
  },

  // Cancel appointment
  async cancelAppointment(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) {
        console.error('Error cancelling appointment:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Exception cancelling appointment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel appointment' 
      };
    }
  },

  // ========== PATIENT SERVICES ==========

  // Get patient profile
  async getPatientProfile(userId: string): Promise<{ 
    success: boolean; 
    data?: Tables<'patients'>; 
    error?: string 
  }> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching patient profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception fetching patient profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch patient profile' 
      };
    }
  },

  // Update patient profile
  async updatePatientProfile(
    userId: string, 
    updates: UpdateTables<'patients'>
  ): Promise<{ success: boolean; data?: Tables<'patients'>; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating patient profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Exception updating patient profile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update patient profile' 
      };
    }
  },

  // ========== UTILITY FUNCTIONS ==========

  // Get appointment statistics for patient
  async getAppointmentStats(patientId: string): Promise<{ 
    success: boolean; 
    data?: { 
      total: number; 
      upcoming: number; 
      completed: number; 
      cancelled: number; 
    }; 
    error?: string 
  }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('status, appointment_date')
        .eq('patient_id', patientId);

      if (error) {
        console.error('Error fetching appointment stats:', error);
        return { success: false, error: error.message };
      }

      const today = new Date().toISOString().split('T')[0];
      const stats = {
        total: data.length,
        upcoming: data.filter(apt => 
          apt.status === 'confirmed' && apt.appointment_date >= today
        ).length,
        completed: data.filter(apt => apt.status === 'completed').length,
        cancelled: data.filter(apt => apt.status === 'cancelled').length,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Exception fetching appointment stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch appointment statistics' 
      };
    }
  },
};

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}
