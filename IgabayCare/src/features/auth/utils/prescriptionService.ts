import { supabase } from '../../../supabaseClient';

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  prescribed_date: string;
  expiry_date?: string;
  refills_remaining: number;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface CreatePrescriptionData {
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  prescribed_date: string;
  expiry_date?: string;
  refills_remaining?: number;
  status?: 'active' | 'completed' | 'cancelled' | 'expired';
}

export interface UpdatePrescriptionData {
  medication_name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  expiry_date?: string;
  refills_remaining?: number;
  status?: 'active' | 'completed' | 'cancelled' | 'expired';
}

export interface PrescriptionWithPatient extends Prescription {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  doctor: {
    id: string;
    full_name: string;
    specialization: string;
  };
}

class PrescriptionService {
  async createPrescription(data: CreatePrescriptionData): Promise<{ success: boolean; error?: string; prescription?: Prescription }> {
    try {
      console.log('Creating prescription with data:', data);
      
      const { data: prescription, error } = await supabase
        .from('prescriptions')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating prescription:', error);
        return { success: false, error: error.message };
      }

      console.log('Prescription created successfully:', prescription);
      return { success: true, prescription };
    } catch (error) {
      console.error('Error creating prescription:', error);
      return { success: false, error: 'Failed to create prescription' };
    }
  }

  async getPrescriptionsByDoctor(doctorId: string): Promise<{ success: boolean; error?: string; prescriptions?: PrescriptionWithPatient[] }> {
    try {
      console.log('Fetching prescriptions for doctor:', doctorId);
      
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(id, first_name, last_name, email, phone),
          doctor:doctors(id, full_name, specialization)
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching prescriptions:', error);
        return { success: false, error: error.message };
      }

      console.log('Prescriptions fetched successfully:', prescriptions);
      return { success: true, prescriptions };
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      return { success: false, error: 'Failed to fetch prescriptions' };
    }
  }

  async getPrescriptionsByPatient(patientId: string): Promise<{ success: boolean; error?: string; prescriptions?: PrescriptionWithPatient[] }> {
    try {
      console.log('Fetching prescriptions for patient:', patientId);
      
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(id, first_name, last_name, email, phone),
          doctor:doctors(id, full_name, specialization)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching patient prescriptions:', error);
        return { success: false, error: error.message };
      }

      console.log('Patient prescriptions fetched successfully:', prescriptions);
      return { success: true, prescriptions };
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      return { success: false, error: 'Failed to fetch patient prescriptions' };
    }
  }

  async getPrescriptionById(id: string): Promise<{ success: boolean; error?: string; prescription?: PrescriptionWithPatient }> {
    try {
      const { data: prescription, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(id, first_name, last_name, email, phone),
          doctor:doctors(id, full_name, specialization)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error fetching prescription:', error);
        return { success: false, error: error.message };
      }

      return { success: true, prescription };
    } catch (error) {
      console.error('Error fetching prescription:', error);
      return { success: false, error: 'Failed to fetch prescription' };
    }
  }

  async updatePrescription(id: string, data: UpdatePrescriptionData): Promise<{ success: boolean; error?: string; prescription?: Prescription }> {
    try {
      const { data: prescription, error } = await supabase
        .from('prescriptions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating prescription:', error);
        return { success: false, error: error.message };
      }

      return { success: true, prescription };
    } catch (error) {
      console.error('Error updating prescription:', error);
      return { success: false, error: 'Failed to update prescription' };
    }
  }

  async deletePrescription(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting prescription:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting prescription:', error);
      return { success: false, error: 'Failed to delete prescription' };
    }
  }

  async getActivePrescriptions(patientId: string): Promise<{ success: boolean; error?: string; prescriptions?: Prescription[] }> {
    try {
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching active prescriptions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, prescriptions };
    } catch (error) {
      console.error('Error fetching active prescriptions:', error);
      return { success: false, error: 'Failed to fetch active prescriptions' };
    }
  }

  async createMultiplePrescriptions(prescriptions: CreatePrescriptionData[]): Promise<{ success: boolean; error?: string; prescriptions?: Prescription[] }> {
    try {
      console.log('Creating multiple prescriptions:', prescriptions);
      
      const { data: createdPrescriptions, error } = await supabase
        .from('prescriptions')
        .insert(prescriptions)
        .select();

      if (error) {
        console.error('Supabase error creating multiple prescriptions:', error);
        return { success: false, error: error.message };
      }

      console.log('Multiple prescriptions created successfully:', createdPrescriptions);
      return { success: true, prescriptions: createdPrescriptions };
    } catch (error) {
      console.error('Error creating multiple prescriptions:', error);
      return { success: false, error: 'Failed to create multiple prescriptions' };
    }
  }
}

export const prescriptionService = new PrescriptionService(); 