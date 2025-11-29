import { supabase } from '../lib/supabase';

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  refills?: number;
  prescribed_at: string;
  status: 'active' | 'completed' | 'discontinued';
  created_at: string;
  updated_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  appointment?: {
    appointment_date: string;
    appointment_time: string;
  };
}

export interface PrescriptionCreate {
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  refills?: number;
}

export interface MedicationInfo {
  name: string;
  common_dosages: string[];
  common_frequencies: string[];
  typical_duration: string;
  category: string;
}

class DoctorPrescriptionService {
  async getPrescriptions(
    doctorId: string,
    filters?: {
      patientId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      medicationName?: string;
    }
  ): Promise<{ success: boolean; data: Prescription[]; error?: string }> {
    try {
      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone),
          appointment:appointments(appointment_date, appointment_time)
        `)
        .eq('doctor_id', doctorId);

      // Apply filters
      if (filters?.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('prescribed_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('prescribed_at', filters.dateTo);
      }

      if (filters?.medicationName) {
        query = query.ilike('medication_name', `%${filters.medicationName}%`);
      }

      const { data, error } = await query.order('prescribed_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      return { success: false, data: [], error: 'Failed to fetch prescriptions' };
    }
  }

  async createPrescription(
    prescription: PrescriptionCreate
  ): Promise<{ success: boolean; data?: Prescription; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert({
          ...prescription,
          prescribed_at: new Date().toISOString(),
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone),
          appointment:appointments(appointment_date, appointment_time)
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating prescription:', error);
      return { success: false, error: 'Failed to create prescription' };
    }
  }

  async updatePrescription(
    prescriptionId: string,
    updates: Partial<PrescriptionCreate & { status?: string }>,
    doctorId: string
  ): Promise<{ success: boolean; data?: Prescription; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', prescriptionId)
        .eq('doctor_id', doctorId) // Ensure doctor can only update their own prescriptions
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone),
          appointment:appointments(appointment_date, appointment_time)
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating prescription:', error);
      return { success: false, error: 'Failed to update prescription' };
    }
  }

  async deletePrescription(
    prescriptionId: string,
    doctorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', prescriptionId)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting prescription:', error);
      return { success: false, error: 'Failed to delete prescription' };
    }
  }

  async getPatientPrescriptions(
    doctorId: string,
    patientId: string
  ): Promise<{ success: boolean; data: Prescription[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone),
          appointment:appointments(appointment_date, appointment_time)
        `)
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .order('prescribed_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      return { success: false, data: [], error: 'Failed to fetch patient prescriptions' };
    }
  }

  async getActivePrescriptions(
    doctorId: string,
    patientId?: string
  ): Promise<{ success: boolean; data: Prescription[]; error?: string }> {
    try {
      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone),
          appointment:appointments(appointment_date, appointment_time)
        `)
        .eq('doctor_id', doctorId)
        .eq('status', 'active');

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query.order('prescribed_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching active prescriptions:', error);
      return { success: false, data: [], error: 'Failed to fetch active prescriptions' };
    }
  }

  async searchMedications(searchTerm: string): Promise<{ success: boolean; data: MedicationInfo[]; error?: string }> {
    try {
      // This is a mock implementation - in a real app, you'd connect to a medication database
      const mockMedications: MedicationInfo[] = [
        {
          name: 'Paracetamol',
          common_dosages: ['500mg', '650mg', '1000mg'],
          common_frequencies: ['Every 4-6 hours', 'Every 8 hours', '3 times daily'],
          typical_duration: '3-7 days',
          category: 'Analgesic'
        },
        {
          name: 'Ibuprofen',
          common_dosages: ['200mg', '400mg', '600mg', '800mg'],
          common_frequencies: ['Every 6-8 hours', '3 times daily'],
          typical_duration: '5-10 days',
          category: 'NSAID'
        },
        {
          name: 'Amoxicillin',
          common_dosages: ['250mg', '500mg', '875mg'],
          common_frequencies: ['Every 8 hours', 'Every 12 hours'],
          typical_duration: '7-14 days',
          category: 'Antibiotic'
        },
        {
          name: 'Lisinopril',
          common_dosages: ['5mg', '10mg', '20mg', '40mg'],
          common_frequencies: ['Once daily'],
          typical_duration: 'Long-term',
          category: 'ACE Inhibitor'
        },
        {
          name: 'Metformin',
          common_dosages: ['500mg', '850mg', '1000mg'],
          common_frequencies: ['Twice daily', 'With meals'],
          typical_duration: 'Long-term',
          category: 'Antidiabetic'
        },
        {
          name: 'Atorvastatin',
          common_dosages: ['10mg', '20mg', '40mg', '80mg'],
          common_frequencies: ['Once daily', 'At bedtime'],
          typical_duration: 'Long-term',
          category: 'Statin'
        },
        {
          name: 'Omeprazole',
          common_dosages: ['10mg', '20mg', '40mg'],
          common_frequencies: ['Once daily', 'Before meals'],
          typical_duration: '2-8 weeks',
          category: 'PPI'
        },
        {
          name: 'Salbutamol',
          common_dosages: ['100mcg per puff'],
          common_frequencies: ['As needed', '2-4 puffs as needed'],
          typical_duration: 'As needed',
          category: 'Bronchodilator'
        }
      ];

      const filteredMedications = mockMedications.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return { success: true, data: filteredMedications };
    } catch (error) {
      console.error('Error searching medications:', error);
      return { success: false, data: [], error: 'Failed to search medications' };
    }
  }

  async getPrescriptionStats(doctorId: string): Promise<{ 
    success: boolean; 
    data: {
      totalPrescriptions: number;
      activePrescriptions: number;
      completedPrescriptions: number;
      prescriptionsThisMonth: number;
      uniquePatients: number;
      topMedications: { medication: string; count: number }[];
    }; 
    error?: string;
  }> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      // Get all prescriptions
      const { data: allPrescriptions, error: allError } = await supabase
        .from('prescriptions')
        .select('patient_id, medication_name, status, prescribed_at')
        .eq('doctor_id', doctorId);

      if (allError) throw allError;

      // Get this month's prescriptions
      const { data: monthPrescriptions, error: monthError } = await supabase
        .from('prescriptions')
        .select('id')
        .eq('doctor_id', doctorId)
        .like('prescribed_at', `${currentMonth}%`);

      if (monthError) throw monthError;

      const prescriptions = allPrescriptions || [];
      const activeCount = prescriptions.filter(p => p.status === 'active').length;
      const completedCount = prescriptions.filter(p => p.status === 'completed').length;
      const monthCount = monthPrescriptions?.length || 0;

      // Count unique patients
      const uniquePatients = new Set(prescriptions.map(p => p.patient_id)).size;

      // Count medications
      const medicationCounts: { [key: string]: number } = {};
      prescriptions.forEach(p => {
        medicationCounts[p.medication_name] = (medicationCounts[p.medication_name] || 0) + 1;
      });

      const topMedications = Object.entries(medicationCounts)
        .map(([medication, count]) => ({ medication, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        success: true,
        data: {
          totalPrescriptions: prescriptions.length,
          activePrescriptions: activeCount,
          completedPrescriptions: completedCount,
          prescriptionsThisMonth: monthCount,
          uniquePatients: uniquePatients,
          topMedications: topMedications
        }
      };
    } catch (error) {
      console.error('Error fetching prescription stats:', error);
      return {
        success: false,
        data: {
          totalPrescriptions: 0,
          activePrescriptions: 0,
          completedPrescriptions: 0,
          prescriptionsThisMonth: 0,
          uniquePatients: 0,
          topMedications: []
        },
        error: 'Failed to fetch prescription stats'
      };
    }
  }

  async validatePrescription(prescription: PrescriptionCreate): Promise<{ 
    valid: boolean; 
    warnings?: string[]; 
    errors?: string[] 
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Basic validation
    if (!prescription.medication_name.trim()) {
      errors.push('Medication name is required');
    }

    if (!prescription.dosage.trim()) {
      errors.push('Dosage is required');
    }

    if (!prescription.frequency.trim()) {
      errors.push('Frequency is required');
    }

    if (!prescription.duration.trim()) {
      errors.push('Duration is required');
    }

    // Check for potential interactions (mock implementation)
    if (prescription.medication_name.toLowerCase().includes('warfarin')) {
      warnings.push('Warfarin requires regular monitoring');
    }

    if (prescription.medication_name.toLowerCase().includes('insulin')) {
      warnings.push('Insulin requires blood glucose monitoring');
    }

    // Check dosage ranges (mock implementation)
    const highRiskMedications = ['warfarin', 'insulin', 'digoxin', 'lithium'];
    if (highRiskMedications.some(med => 
      prescription.medication_name.toLowerCase().includes(med)
    )) {
      warnings.push('This medication requires careful monitoring');
    }

    return {
      valid: errors.length === 0,
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async refillPrescription(
    prescriptionId: string,
    doctorId: string
  ): Promise<{ success: boolean; data?: Prescription; error?: string }> {
    try {
      // Get current prescription
      const { data: currentPrescription, error: fetchError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('id', prescriptionId)
        .eq('doctor_id', doctorId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentPrescription) {
        return { success: false, error: 'Prescription not found' };
      }

      if (currentPrescription.refills && currentPrescription.refills <= 0) {
        return { success: false, error: 'No refills remaining' };
      }

      // Create new prescription (refill)
      const refillData = {
        patient_id: currentPrescription.patient_id,
        doctor_id: doctorId,
        appointment_id: currentPrescription.appointment_id,
        medication_name: currentPrescription.medication_name,
        dosage: currentPrescription.dosage,
        frequency: currentPrescription.frequency,
        duration: currentPrescription.duration,
        instructions: currentPrescription.instructions,
        refills: currentPrescription.refills ? currentPrescription.refills - 1 : 0
      };

      const { data, error } = await this.createPrescription(refillData);

      if (error) throw error;

      // Update original prescription
      await this.updatePrescription(prescriptionId, {
        refills: currentPrescription.refills ? currentPrescription.refills - 1 : 0
      }, doctorId);

      return { success: true, data };
    } catch (error) {
      console.error('Error refilling prescription:', error);
      return { success: false, error: 'Failed to refill prescription' };
    }
  }

  async getPrescriptionHistory(
    doctorId: string,
    patientId: string,
    limit: number = 50
  ): Promise<{ success: boolean; data: Prescription[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone),
          appointment:appointments(appointment_date, appointment_time)
        `)
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .order('prescribed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching prescription history:', error);
      return { success: false, data: [], error: 'Failed to fetch prescription history' };
    }
  }
}

export const doctorPrescriptionService = new DoctorPrescriptionService();
