import { supabase } from '../supabaseClient';

export interface DoctorAppointment {
  id: string;
  doctor_id: string;
  appointment_id: string;
  patient_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  duration_minutes: number;
  status: string;
  doctor_notes?: string;
  consultation_notes?: string;
  prescription_given: boolean;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  clinic_name?: string;
  payment_amount: number;
  payment_status: string;
  priority: string;
  special_instructions?: string;
  assigned_at: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data from related tables
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  clinic?: {
    id: string;
    clinic_name: string;
    address: string;
    phone: string;
  };
}

export interface CreateDoctorAppointmentData {
  doctor_id: string;
  appointment_id: string;
  patient_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  duration_minutes?: number;
  payment_amount?: number;
  priority?: string;
  special_instructions?: string;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
}

export class DoctorAppointmentService {
  /**
   * Create a new doctor appointment when a doctor is assigned
   */
  static async createDoctorAppointment(data: CreateDoctorAppointmentData): Promise<{
    success: boolean;
    appointment?: DoctorAppointment;
    error?: string;
  }> {
    try {
      console.log('📝 Creating doctor appointment:', data);

      // Prepare the doctor appointment data with all required fields
      const appointmentData = {
        ...data,
        duration_minutes: data.duration_minutes || 30,
        payment_amount: data.payment_amount || 0,
        priority: data.priority || 'normal',
        status: 'assigned',
        assigned_at: new Date().toISOString(),
        payment_status: 'pending',
        prescription_given: false,
        // Always include patient information - use empty string if not provided (database will handle null)
        patient_name: data.patient_name || '',
        patient_email: data.patient_email || '',
        patient_phone: data.patient_phone || ''
      };
      
      console.log('🔄 Inserting doctor appointment data:', {
        ...appointmentData,
        patient_name: appointmentData.patient_name || '(empty)',
        patient_email: appointmentData.patient_email || '(empty)',
        patient_phone: appointmentData.patient_phone || '(empty)'
      });

      const { data: doctorAppointment, error } = await supabase
        .from('doctor_appointments')
        .insert([appointmentData])
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error creating doctor appointment:', error);
        console.error('❌ Failed appointment data:', appointmentData);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return {
          success: false,
          error: `Database error: ${error.message} (Code: ${error.code})`
        };
      }
      
      if (!doctorAppointment) {
        console.error('❌ No doctor appointment returned from database');
        return {
          success: false,
          error: 'No data returned after insert'
        };
      }

      console.log('✅ Doctor appointment created successfully:', doctorAppointment.id);
      console.log('✅ Created appointment details:', {
        id: doctorAppointment.id,
        patient_name: doctorAppointment.patient_name,
        patient_email: doctorAppointment.patient_email,
        patient_phone: doctorAppointment.patient_phone,
        clinic_name: doctorAppointment.clinic_name,
        assigned_at: doctorAppointment.assigned_at
      });
      
      // Validate that patient information was populated by the trigger
      if (!doctorAppointment.patient_name || !doctorAppointment.patient_email) {
        console.warn('⚠️ Patient information not populated by database trigger:', {
          patient_id: doctorAppointment.patient_id,
          patient_name: doctorAppointment.patient_name,
          patient_email: doctorAppointment.patient_email
        });
      }
      
      return {
        success: true,
        appointment: doctorAppointment
      };

    } catch (error) {
      console.error('❌ Unexpected error creating doctor appointment:', error);
      return {
        success: false,
        error: 'Failed to create doctor appointment'
      };
    }
  }

  /**
   * Get all appointments for a specific doctor
   */
  static async getDoctorAppointments(doctorId: string, filters?: {
    status?: string;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): Promise<{
    success: boolean;
    appointments?: DoctorAppointment[];
    error?: string;
  }> {
    try {
      console.log('🔍 Fetching doctor appointments for:', doctorId, filters);

      let query = supabase
        .from('doctor_appointments')
        .select(`
          *,
          patient:patients(id, first_name, last_name, email, phone),
          clinic:clinics(id, clinic_name, address, phone)
        `)
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });
      
      // Log what we're querying
      console.log('🔍 Querying doctor_appointments for doctor:', doctorId);

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.date) {
        query = query.eq('appointment_date', filters.date);
      }

      if (filters?.dateFrom) {
        query = query.gte('appointment_date', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('appointment_date', filters.dateTo);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data: appointments, error } = await query;

      if (error) {
        console.error('❌ Error fetching doctor appointments:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Successfully fetched doctor appointments:', appointments?.length || 0);
      
      // Log patient info for debugging
      if (appointments && appointments.length > 0) {
        console.log('📋 Sample appointment patient info:', {
          first: {
            patient_name: appointments[0].patient_name,
            patient_email: appointments[0].patient_email,
            patient_phone: appointments[0].patient_phone,
            has_patient_relation: !!appointments[0].patient
          }
        });
      }
      
      return {
        success: true,
        appointments: appointments || []
      };

    } catch (error) {
      console.error('❌ Unexpected error fetching doctor appointments:', error);
      return {
        success: false,
        error: 'Failed to fetch doctor appointments'
      };
    }
  }

  /**
   * Update doctor appointment status
   */
  static async updateDoctorAppointmentStatus(appointmentId: string, status: string, notes?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Set timestamps based on status
      if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      if (notes) {
        updateData.doctor_notes = notes;
      }

      const { error } = await supabase
        .from('doctor_appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) {
        console.error('❌ Error updating doctor appointment status:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Doctor appointment status updated successfully');
      return {
        success: true
      };

    } catch (error) {
      console.error('❌ Unexpected error updating doctor appointment status:', error);
      return {
        success: false,
        error: 'Failed to update appointment status'
      };
    }
  }

  /**
   * Add consultation notes to a doctor appointment
   */
  static async addConsultationNotes(appointmentId: string, notes: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('doctor_appointments')
        .update({
          consultation_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        console.error('❌ Error adding consultation notes:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Consultation notes added successfully');
      return {
        success: true
      };

    } catch (error) {
      console.error('❌ Unexpected error adding consultation notes:', error);
      return {
        success: false,
        error: 'Failed to add consultation notes'
      };
    }
  }

  /**
   * Check if a doctor is already assigned to an appointment
   */
  static async isDoctorAssigned(doctorId: string, appointmentId: string): Promise<{
    assigned: boolean;
    appointment?: DoctorAppointment;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('doctor_appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('appointment_id', appointmentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found
          return { assigned: false };
        }
        console.error('❌ Error checking doctor assignment:', error);
        return {
          assigned: false,
          error: error.message
        };
      }

      return {
        assigned: true,
        appointment: data
      };

    } catch (error) {
      console.error('❌ Unexpected error checking doctor assignment:', error);
      return {
        assigned: false,
        error: 'Failed to check doctor assignment'
      };
    }
  }

  /**
   * Get doctor appointment by appointment ID
   */
  static async getDoctorAppointmentByAppointmentId(appointmentId: string): Promise<{
    success: boolean;
    appointment?: DoctorAppointment;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('doctor_appointments')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found
          return { 
            success: true, 
            appointment: undefined 
          };
        }
        console.error('❌ Error fetching doctor appointment:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        appointment: data
      };

    } catch (error) {
      console.error('❌ Unexpected error fetching doctor appointment:', error);
      return {
        success: false,
        error: 'Failed to fetch doctor appointment'
      };
    }
  }

  /**
   * Delete doctor appointment (when doctor is unassigned)
   */
  static async deleteDoctorAppointment(appointmentId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('doctor_appointments')
        .delete()
        .eq('appointment_id', appointmentId);

      if (error) {
        console.error('❌ Error deleting doctor appointment:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Doctor appointment deleted successfully');
      return {
        success: true
      };

    } catch (error) {
      console.error('❌ Unexpected error deleting doctor appointment:', error);
      return {
        success: false,
        error: 'Failed to delete doctor appointment'
      };
    }
  }
}

export default DoctorAppointmentService;