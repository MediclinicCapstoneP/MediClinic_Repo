import { supabase } from '../supabaseClient';
import { MedicalHistoryService } from './medicalHistoryService';

export interface PatientRecord {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  blood_type?: string;
  allergies?: string;
  medications?: string;
  medical_conditions?: string;
  profile_pic_url?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  age?: number;
  lastAppointment?: string;
  nextAppointment?: string;
  totalAppointments?: number;
  activePrescriptions?: number;
  completedAppointments?: number;
  cancelledAppointments?: number;
  totalRevenue?: number;
}

export interface PatientMedicalHistory {
  appointments: any[];
  prescriptions: any[];
  medical_records: any[];
  lab_results: any[];
  vaccinations: any[];
  allergies: any[];
}

export interface PatientStats {
  totalPatients: number;
  activePatients: number;
  newPatientsThisMonth: number;
  averageAge: number;
  mostCommonBloodType: string;
  patientsWithAllergies: number;
  totalRevenue: number;
  averageAppointmentsPerPatient: number;
}

export interface PatientSearchFilters {
  searchQuery?: string;
  bloodType?: string;
  hasAllergies?: boolean;
  ageRange?: { min: number; max: number };
  appointmentStatus?: 'active' | 'inactive';
  dateRange?: { from: string; to: string };
}

class DoctorPatientRecordsService {
  /**
   * Get all patients for a specific doctor with comprehensive data
   */
  async getDoctorPatients(
    doctorId: string,
    filters?: PatientSearchFilters
  ): Promise<{ success: boolean; patients?: PatientRecord[]; error?: string }> {
    try {
      console.log('🔍 Fetching patients for doctor:', doctorId);

      // Get all appointments for the doctor to find unique patients
      let appointmentsQuery = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(*)
        `)
        .eq('doctor_id', doctorId);

      // Apply date range filter if provided
      if (filters?.dateRange) {
        appointmentsQuery = appointmentsQuery
          .gte('appointment_date', filters.dateRange.from)
          .lte('appointment_date', filters.dateRange.to);
      }

      const { data: appointments, error: appointmentsError } = await appointmentsQuery;

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
        return { success: false, error: appointmentsError.message };
      }

      if (!appointments || appointments.length === 0) {
        return { success: true, patients: [] };
      }

      // Extract unique patients and calculate stats
      const uniquePatients = new Map<string, PatientRecord>();
      const patientAppointmentStats = new Map<string, any>();

      appointments.forEach(appointment => {
        if (appointment.patient_id && appointment.patient) {
          const patientId = appointment.patient_id;
          
          if (!uniquePatients.has(patientId)) {
            // Calculate age if date_of_birth is available
            let age = undefined;
            if (appointment.patient.date_of_birth) {
              const birthDate = new Date(appointment.patient.date_of_birth);
              const today = new Date();
              age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
            }

            uniquePatients.set(patientId, {
              ...appointment.patient,
              age,
              totalAppointments: 0,
              completedAppointments: 0,
              cancelledAppointments: 0,
              lastAppointment: null,
              nextAppointment: null,
              activePrescriptions: 0,
              totalRevenue: 0
            });

            patientAppointmentStats.set(patientId, {
              appointments: [],
              totalRevenue: 0
            });
          }

          // Add appointment to patient stats
          const stats = patientAppointmentStats.get(patientId);
          stats.appointments.push(appointment);
        }
      });

      // Calculate appointment statistics for each patient
      for (const [patientId, stats] of patientAppointmentStats.entries()) {
        const patient = uniquePatients.get(patientId);
        if (!patient) continue;

        const today = new Date();
        let lastAppointmentDate: Date | null = null;
        let nextAppointmentDate: Date | null = null;
        let totalRevenue = 0;

        stats.appointments.forEach((appointment: any) => {
          patient.totalAppointments = (patient.totalAppointments || 0) + 1;
          
          if (appointment.status === 'completed') {
            patient.completedAppointments = (patient.completedAppointments || 0) + 1;
            totalRevenue += appointment.payment_amount || 0;
          } else if (appointment.status === 'cancelled') {
            patient.cancelledAppointments = (patient.cancelledAppointments || 0) + 1;
          }

          const appointmentDate = new Date(appointment.appointment_date);
          
          if (appointmentDate < today) {
            if (!lastAppointmentDate || appointmentDate > lastAppointmentDate) {
              lastAppointmentDate = appointmentDate;
              patient.lastAppointment = appointment.appointment_date;
            }
          } else if (appointmentDate >= today) {
            if (!nextAppointmentDate || appointmentDate < nextAppointmentDate) {
              nextAppointmentDate = appointmentDate;
              patient.nextAppointment = appointment.appointment_date;
            }
          }
        });

        patient.totalRevenue = totalRevenue;
      }

      // Get prescription counts for each patient
      for (const patientId of uniquePatients.keys()) {
        try {
          const { data: prescriptions, error: prescError } = await supabase
            .from('prescriptions')
            .select('status')
            .eq('patient_id', patientId)
            .eq('doctor_id', doctorId);

          if (!prescError && prescriptions) {
            const activePrescriptions = prescriptions.filter(p => p.status === 'active').length;
            const patient = uniquePatients.get(patientId);
            if (patient) {
              patient.activePrescriptions = activePrescriptions;
            }
          }
        } catch (error) {
          console.warn(`Error loading prescriptions for patient ${patientId}:`, error);
        }
      }

      let patientRecords = Array.from(uniquePatients.values());

      // Apply filters
      if (filters) {
        patientRecords = this.applyPatientFilters(patientRecords, filters);
      }

      return { success: true, patients: patientRecords };
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return { success: false, error: 'Failed to fetch patient records' };
    }
  }

  /**
   * Get comprehensive medical history for a specific patient
   */
  async getPatientMedicalHistory(
    patientId: string,
    doctorId: string
  ): Promise<{ success: boolean; history?: PatientMedicalHistory; error?: string }> {
    try {
      console.log('📋 Fetching medical history for patient:', patientId);

      // Use the existing MedicalHistoryService for comprehensive data
      const historyResult = await MedicalHistoryService.getPatientMedicalHistory(patientId);

      if (!historyResult.success || !historyResult.data) {
        return { success: false, error: historyResult.error || 'Failed to fetch medical history' };
      }

      // Filter data to only include records related to this doctor
      const history = historyResult.data;
      const filteredHistory: PatientMedicalHistory = {
        appointments: history.appointments.filter(apt => apt.doctor_id === doctorId),
        prescriptions: history.prescriptions.filter(presc => presc.doctor_id === doctorId),
        medical_records: history.medical_records.filter(record => record.doctor_id === doctorId),
        lab_results: history.lab_results.filter(lab => lab.doctor_id === doctorId),
        vaccinations: history.vaccinations.filter(vacc => vacc.doctor_id === doctorId),
        allergies: history.allergies // Allergies are not doctor-specific
      };

      return { success: true, history: filteredHistory };
    } catch (error) {
      console.error('Error fetching patient medical history:', error);
      return { success: false, error: 'Failed to fetch patient medical history' };
    }
  }

  /**
   * Create a new medical record for a patient
   */
  async createMedicalRecord(
    patientId: string,
    doctorId: string,
    recordData: {
      record_type: 'consultation' | 'lab_result' | 'prescription' | 'vaccination' | 'surgery' | 'imaging' | 'other';
      title: string;
      description?: string;
      visit_date?: string;
      chief_complaint?: string;
      diagnosis?: string;
      treatment?: string;
      prescription?: string;
      lab_results?: any;
      vital_signs?: any;
      attachments?: string[];
      is_private?: boolean;
      appointment_id?: string;
      clinic_id?: string;
    }
  ): Promise<{ success: boolean; record?: any; error?: string }> {
    try {
      const { data: record, error } = await supabase
        .from('medical_records')
        .insert([{
          patient_id: patientId,
          doctor_id: doctorId,
          record_type: recordData.record_type,
          title: recordData.title,
          description: recordData.description,
          visit_date: recordData.visit_date || new Date().toISOString().split('T')[0],
          chief_complaint: recordData.chief_complaint,
          diagnosis: recordData.diagnosis,
          treatment: recordData.treatment,
          prescription: recordData.prescription,
          lab_results: recordData.lab_results,
          vital_signs: recordData.vital_signs,
          attachments: recordData.attachments,
          is_private: recordData.is_private || false,
          appointment_id: recordData.appointment_id,
          clinic_id: recordData.clinic_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating medical record:', error);
        return { success: false, error: error.message };
      }

      return { success: true, record };
    } catch (error) {
      console.error('Error creating medical record:', error);
      return { success: false, error: 'Failed to create medical record' };
    }
  }

  /**
   * Update patient medical information (doctor can update certain fields)
   */
  async updatePatientMedicalInfo(
    patientId: string,
    updates: {
      blood_type?: string;
      allergies?: string;
      medical_conditions?: string;
      medications?: string;
    }
  ): Promise<{ success: boolean; patient?: PatientRecord; error?: string }> {
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientId)
        .select()
        .single();

      if (error) {
        console.error('Error updating patient medical info:', error);
        return { success: false, error: error.message };
      }

      return { success: true, patient };
    } catch (error) {
      console.error('Error updating patient medical info:', error);
      return { success: false, error: 'Failed to update patient medical information' };
    }
  }

  /**
   * Calculate comprehensive patient statistics for the doctor
   */
  async calculatePatientStats(
    doctorId: string
  ): Promise<{ success: boolean; stats?: PatientStats; error?: string }> {
    try {
      const patientsResult = await this.getDoctorPatients(doctorId);
      
      if (!patientsResult.success || !patientsResult.patients) {
        return { success: false, error: patientsResult.error };
      }

      const patients = patientsResult.patients;
      const total = patients.length;
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Calculate various statistics
      const newPatientsThisMonth = patients.filter(p => 
        new Date(p.created_at) >= startOfMonth
      ).length;

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const activePatients = patients.filter(p => 
        p.lastAppointment && new Date(p.lastAppointment) >= sixMonthsAgo
      ).length;

      const patientsWithAge = patients.filter(p => p.age !== undefined);
      const averageAge = patientsWithAge.length > 0 
        ? Math.round(patientsWithAge.reduce((sum, p) => sum + (p.age || 0), 0) / patientsWithAge.length)
        : 0;

      const bloodTypes: { [key: string]: number } = {};
      patients.forEach(p => {
        if (p.blood_type && p.blood_type !== 'None' && p.blood_type.trim() !== '') {
          bloodTypes[p.blood_type] = (bloodTypes[p.blood_type] || 0) + 1;
        }
      });
      const mostCommonBloodType = Object.keys(bloodTypes).length > 0 
        ? Object.keys(bloodTypes).reduce((a, b) => bloodTypes[a] > bloodTypes[b] ? a : b)
        : 'N/A';

      const patientsWithAllergies = patients.filter(p => 
        p.allergies && p.allergies !== 'None' && p.allergies.trim() !== ''
      ).length;

      const totalRevenue = patients.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
      
      const totalAppointments = patients.reduce((sum, p) => sum + (p.totalAppointments || 0), 0);
      const averageAppointmentsPerPatient = total > 0 ? Math.round(totalAppointments / total * 10) / 10 : 0;

      const stats: PatientStats = {
        totalPatients: total,
        activePatients,
        newPatientsThisMonth,
        averageAge,
        mostCommonBloodType,
        patientsWithAllergies,
        totalRevenue,
        averageAppointmentsPerPatient
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error calculating patient stats:', error);
      return { success: false, error: 'Failed to calculate patient statistics' };
    }
  }

  /**
   * Search patients with advanced filtering
   */
  async searchPatients(
    doctorId: string,
    filters: PatientSearchFilters
  ): Promise<{ success: boolean; patients?: PatientRecord[]; error?: string }> {
    return this.getDoctorPatients(doctorId, filters);
  }

  /**
   * Get patient appointment history with the doctor
   */
  async getPatientAppointments(
    patientId: string,
    doctorId: string
  ): Promise<{ success: boolean; appointments?: any[]; error?: string }> {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics(clinic_name, address)
        `)
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: false });

      if (error) {
        console.error('Error fetching patient appointments:', error);
        return { success: false, error: error.message };
      }

      return { success: true, appointments: appointments || [] };
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      return { success: false, error: 'Failed to fetch patient appointments' };
    }
  }

  /**
   * Get patient prescriptions from this doctor
   */
  async getPatientPrescriptions(
    patientId: string,
    doctorId: string
  ): Promise<{ success: boolean; prescriptions?: any[]; error?: string }> {
    try {
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_medications(*)
        `)
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .order('prescribed_date', { ascending: false });

      if (error) {
        console.error('Error fetching patient prescriptions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, prescriptions: prescriptions || [] };
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      return { success: false, error: 'Failed to fetch patient prescriptions' };
    }
  }

  /**
   * Apply filters to patient records
   */
  private applyPatientFilters(
    patients: PatientRecord[],
    filters: PatientSearchFilters
  ): PatientRecord[] {
    let filtered = [...patients];

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(patient => 
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query) ||
        patient.phone?.includes(query) ||
        patient.medical_conditions?.toLowerCase().includes(query) ||
        patient.allergies?.toLowerCase().includes(query)
      );
    }

    if (filters.bloodType) {
      filtered = filtered.filter(patient => patient.blood_type === filters.bloodType);
    }

    if (filters.hasAllergies !== undefined) {
      filtered = filtered.filter(patient => {
        const hasAllergies = patient.allergies && patient.allergies !== 'None' && patient.allergies.trim() !== '';
        return filters.hasAllergies ? hasAllergies : !hasAllergies;
      });
    }

    if (filters.ageRange) {
      filtered = filtered.filter(patient => {
        if (!patient.age) return false;
        return patient.age >= filters.ageRange!.min && patient.age <= filters.ageRange!.max;
      });
    }

    if (filters.appointmentStatus) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      filtered = filtered.filter(patient => {
        const isActive = patient.lastAppointment && new Date(patient.lastAppointment) >= sixMonthsAgo;
        return filters.appointmentStatus === 'active' ? isActive : !isActive;
      });
    }

    return filtered;
  }
}

export const doctorPatientRecordsService = new DoctorPatientRecordsService();
