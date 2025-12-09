import { supabase } from '../supabaseClient';
import { authService } from '../features/auth/utils/authService';

// Types for prescriptions
export interface Prescription {
  id: string;
  appointment_id: string;
  patient_id: string;
  clinic_id: string;
  doctor_id?: string;
  prescription_number: string;
  prescribing_doctor_name: string;
  prescribing_doctor_license?: string;
  doctor_specialty?: string;
  diagnosis?: string;
  patient_symptoms?: string;
  clinical_notes?: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  prescribed_date: string;
  valid_until?: string;
  general_instructions?: string;
  dietary_restrictions?: string;
  follow_up_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface PrescriptionMedication {
  id: string;
  prescription_id: string;
  medication_name: string;
  generic_name?: string;
  medication_type?: string;
  strength: string;
  form?: string;
  dosage: string;
  frequency: string;
  duration: string;
  timing?: string;
  special_instructions?: string;
  side_effects?: string;
  precautions?: string;
  quantity_prescribed: number;
  refills_allowed: number;
  refills_used: number;
  status: 'active' | 'discontinued' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface PrescriptionWithMedications extends Prescription {
  medications: PrescriptionMedication[];
  appointment?: {
    appointment_date: string;
    appointment_time: string;
    clinic_name?: string;
  };
}

export interface PrescriptionDispensingLog {
  id: string;
  prescription_id: string;
  medication_id: string;
  pharmacy_name?: string;
  pharmacist_name?: string;
  dispensed_date: string;
  dispensed_quantity: number;
  pharmacist_notes?: string;
  created_at: string;
}

export const prescriptionService = {
  /**
   * Create a new comprehensive prescription with medications
   */
  async createNewPrescription(prescriptionData: any, medications: any[]): Promise<{
    success: boolean;
    prescription?: any;
    error?: string;
  }> {
    try {
      // First create the main prescription record
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert([prescriptionData])
        .select()
        .single();

      if (prescriptionError) {
        console.error('Error creating prescription:', prescriptionError);
        return { success: false, error: prescriptionError.message };
      }

      if (!prescription) {
        return { success: false, error: 'Failed to create prescription record' };
      }

      // Then create the medication records - validate and filter out any invalid medications
      const medicationRecords = medications
        .filter(med => {
          // Ensure medication_name is not null, undefined, or empty string
          if (!med.medication_name || med.medication_name.trim() === '') {
            console.warn('⚠️ Filtering out medication with invalid name:', med);
            return false;
          }
          return true;
        })
        .map(med => ({
          ...med,
          prescription_id: prescription.id,
          medication_name: med.medication_name.trim(), // Ensure it's trimmed
          status: 'active'
        }));

      // Validate that we have at least one valid medication
      if (medicationRecords.length === 0) {
        // Clean up the prescription if no valid medications
        await supabase
          .from('prescriptions')
          .delete()
          .eq('id', prescription.id);
        return { success: false, error: 'No valid medications provided. Each medication must have a name.' };
      }

      const { data: medicationData, error: medicationError } = await supabase
        .from('prescription_medications')
        .insert(medicationRecords)
        .select();

      if (medicationError) {
        console.error('Error creating prescription medications:', medicationError);
        // Clean up the prescription if medications failed
        await supabase
          .from('prescriptions')
          .delete()
          .eq('id', prescription.id);
        return { success: false, error: medicationError.message };
      }

      return { 
        success: true, 
        prescription: {
          ...prescription,
          medications: medicationData
        }
      };
    } catch (error) {
      console.error('Error in createNewPrescription:', error);
      return { success: false, error: 'Failed to create prescription' };
    }
  },
  /**
   * Get all prescriptions for the current patient
   */
  async getPatientPrescriptions(): Promise<{
    success: boolean;
    prescriptions?: PrescriptionWithMedications[];
    error?: string;
  }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get patient ID first
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (patientError || !patient) {
        console.error('Error fetching patient:', patientError);
        return { success: false, error: 'Patient profile not found' };
      }

      // Fetch prescriptions with related data - avoid relationship ambiguity
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_medications (*)
        `)
        .eq('patient_id', patient.id)
        .order('prescribed_date', { ascending: false });

      if (error) {
        console.error('Error fetching prescriptions:', error);
        return { success: false, error: 'Failed to fetch prescriptions' };
      }

      // Transform the data to match our interface
      const formattedPrescriptions: PrescriptionWithMedications[] = prescriptions?.map(prescription => ({
        ...prescription,
        medications: prescription.prescription_medications || []
      })) || [];

      return { success: true, prescriptions: formattedPrescriptions };
    } catch (error) {
      console.error('Error in getPatientPrescriptions:', error);
      return { success: false, error: 'Failed to fetch prescriptions' };
    }
  },

  /**
   * Get a specific prescription by ID
   */
  async getPrescriptionById(prescriptionId: string): Promise<{
    success: boolean;
    prescription?: PrescriptionWithMedications;
    error?: string;
  }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: prescription, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_medications (*),
          appointments (
            appointment_date,
            appointment_time,
            clinics (clinic_name)
          )
        `)
        .eq('id', prescriptionId)
        .single();

      if (error) {
        console.error('Error fetching prescription:', error);
        return { success: false, error: 'Prescription not found' };
      }

      // Transform the data
      const formattedPrescription: PrescriptionWithMedications = {
        ...prescription,
        medications: prescription.prescription_medications || [],
        appointment: prescription.appointments ? {
          appointment_date: prescription.appointments.appointment_date,
          appointment_time: prescription.appointments.appointment_time,
          clinic_name: prescription.appointments.clinics?.clinic_name
        } : undefined
      };

      return { success: true, prescription: formattedPrescription };
    } catch (error) {
      console.error('Error in getPrescriptionById:', error);
      return { success: false, error: 'Failed to fetch prescription' };
    }
  },

  /**
   * Get prescriptions for a specific appointment
   */
  async getPrescriptionsByAppointment(appointmentId: string): Promise<{
    success: boolean;
    prescriptions?: PrescriptionWithMedications[];
    error?: string;
  }> {
    try {
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_medications (*)
        `)
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching appointment prescriptions:', error);
        return { success: false, error: 'Failed to fetch prescriptions' };
      }

      const formattedPrescriptions: PrescriptionWithMedications[] = prescriptions?.map(prescription => ({
        ...prescription,
        medications: prescription.prescription_medications || []
      })) || [];

      return { success: true, prescriptions: formattedPrescriptions };
    } catch (error) {
      console.error('Error in getPrescriptionsByAppointment:', error);
      return { success: false, error: 'Failed to fetch appointment prescriptions' };
    }
  },

  /**
   * Search prescriptions by medication name, doctor, or diagnosis
   */
  async searchPrescriptions(searchQuery: string): Promise<{
    success: boolean;
    prescriptions?: PrescriptionWithMedications[];
    error?: string;
  }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get patient ID first
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (patientError || !patient) {
        return { success: false, error: 'Patient profile not found' };
      }

      // Search in prescriptions and medications
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_medications (*),
          appointments (
            appointment_date,
            appointment_time,
            clinics (clinic_name)
          )
        `)
        .eq('patient_id', patient.id)
        .or(`
          prescribing_doctor_name.ilike.%${searchQuery}%,
          diagnosis.ilike.%${searchQuery}%,
          clinical_notes.ilike.%${searchQuery}%
        `)
        .order('prescribed_date', { ascending: false });

      if (error) {
        console.error('Error searching prescriptions:', error);
        return { success: false, error: 'Failed to search prescriptions' };
      }

      // Also search in medication names
      const { data: medicationPrescriptions, error: medError } = await supabase
        .from('prescription_medications')
        .select(`
          prescription_id,
          prescriptions!inner (
            *,
            appointments (
              appointment_date,
              appointment_time,
              clinics (clinic_name)
            )
          )
        `)
        .ilike('medication_name', `%${searchQuery}%`);

      if (medError) {
        console.error('Error searching medication prescriptions:', medError);
      }

      // Combine results and remove duplicates
      const allPrescriptions = [...(prescriptions || [])];
      
      medicationPrescriptions?.forEach(medPrescription => {
        const exists = allPrescriptions.find(p => p.id === medPrescription.prescriptions.id);
        if (!exists) {
          allPrescriptions.push(medPrescription.prescriptions);
        }
      });

      // Format the results
      const formattedPrescriptions: PrescriptionWithMedications[] = allPrescriptions.map(prescription => ({
        ...prescription,
        medications: prescription.prescription_medications || [],
        appointment: prescription.appointments ? {
          appointment_date: prescription.appointments.appointment_date,
          appointment_time: prescription.appointments.appointment_time,
          clinic_name: prescription.appointments.clinics?.clinic_name
        } : undefined
      }));

      return { success: true, prescriptions: formattedPrescriptions };
    } catch (error) {
      console.error('Error in searchPrescriptions:', error);
      return { success: false, error: 'Failed to search prescriptions' };
    }
  },

  /**
   * Filter prescriptions by date range, status, or doctor
   */
  async filterPrescriptions(filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
    doctorName?: string;
  }): Promise<{
    success: boolean;
    prescriptions?: PrescriptionWithMedications[];
    error?: string;
  }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get patient ID first
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (patientError || !patient) {
        return { success: false, error: 'Patient profile not found' };
      }

      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_medications (*),
          appointments (
            appointment_date,
            appointment_time,
            clinics (clinic_name)
          )
        `)
        .eq('patient_id', patient.id);

      // Apply filters
      if (filters.startDate) {
        query = query.gte('prescribed_date', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('prescribed_date', filters.endDate);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.doctorName) {
        query = query.ilike('prescribing_doctor_name', `%${filters.doctorName}%`);
      }

      const { data: prescriptions, error } = await query
        .order('prescribed_date', { ascending: false });

      if (error) {
        console.error('Error filtering prescriptions:', error);
        return { success: false, error: 'Failed to filter prescriptions' };
      }

      const formattedPrescriptions: PrescriptionWithMedications[] = prescriptions?.map(prescription => ({
        ...prescription,
        medications: prescription.prescription_medications || [],
        appointment: prescription.appointments ? {
          appointment_date: prescription.appointments.appointment_date,
          appointment_time: prescription.appointments.appointment_time,
          clinic_name: prescription.appointments.clinics?.clinic_name
        } : undefined
      })) || [];

      return { success: true, prescriptions: formattedPrescriptions };
    } catch (error) {
      console.error('Error in filterPrescriptions:', error);
      return { success: false, error: 'Failed to filter prescriptions' };
    }
  },

  /**
   * Get prescription dispensing history
   */
  async getDispensingHistory(prescriptionId: string): Promise<{
    success: boolean;
    dispensingLog?: PrescriptionDispensingLog[];
    error?: string;
  }> {
    try {
      const { data: dispensingLog, error } = await supabase
        .from('prescription_dispensing_log')
        .select('*')
        .eq('prescription_id', prescriptionId)
        .order('dispensed_date', { ascending: false });

      if (error) {
        console.error('Error fetching dispensing history:', error);
        return { success: false, error: 'Failed to fetch dispensing history' };
      }

      return { success: true, dispensingLog: dispensingLog || [] };
    } catch (error) {
      console.error('Error in getDispensingHistory:', error);
      return { success: false, error: 'Failed to fetch dispensing history' };
    }
  },

  /**
   * Check if prescription is expired
   */
  async isPrescriptionExpired(prescriptionId: string): Promise<{
    success: boolean;
    expired?: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('is_prescription_expired', { prescription_id: prescriptionId });

      if (error) {
        console.error('Error checking prescription expiry:', error);
        return { success: false, error: 'Failed to check prescription expiry' };
      }

      return { success: true, expired: data };
    } catch (error) {
      console.error('Error in isPrescriptionExpired:', error);
      return { success: false, error: 'Failed to check prescription expiry' };
    }
  },

  /**
   * Get prescription statistics for patient dashboard
   */
  async getPrescriptionStats(): Promise<{
    success: boolean;
    stats?: {
      total: number;
      active: number;
      expired: number;
      completed: number;
      recentCount: number; // Last 30 days
    };
    error?: string;
  }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get patient ID first
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();

      if (patientError || !patient) {
        return { success: false, error: 'Patient profile not found' };
      }

      // Get all prescriptions
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select('status, prescribed_date')
        .eq('patient_id', patient.id);

      if (error) {
        console.error('Error fetching prescription stats:', error);
        return { success: false, error: 'Failed to fetch prescription statistics' };
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats = {
        total: prescriptions?.length || 0,
        active: prescriptions?.filter(p => p.status === 'active').length || 0,
        expired: prescriptions?.filter(p => p.status === 'expired').length || 0,
        completed: prescriptions?.filter(p => p.status === 'completed').length || 0,
        recentCount: prescriptions?.filter(p => 
          new Date(p.prescribed_date) >= thirtyDaysAgo
        ).length || 0
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error in getPrescriptionStats:', error);
      return { success: false, error: 'Failed to fetch prescription statistics' };
    }
  },

  /**
   * Update prescription status
   */
  async updatePrescriptionStatus(prescriptionId: string, status: 'active' | 'completed' | 'cancelled' | 'expired'): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Update prescription status
      const { error } = await supabase
        .from('prescriptions')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', prescriptionId);

      if (error) {
        console.error('Error updating prescription status:', error);
        return { success: false, error: 'Failed to update prescription status' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updatePrescriptionStatus:', error);
      return { success: false, error: 'Failed to update prescription status' };
    }
  }
};

export default prescriptionService;