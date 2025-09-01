import { supabase } from '../../../supabaseClient';
import { AppointmentWithDetails } from '../../../types/appointments';

export const enhancedPatientService = {
  /**
   * Get comprehensive patient appointment history with all related data
   */
  async getPatientAppointmentHistory(patientId: string): Promise<{ 
    success: boolean; 
    appointments?: AppointmentWithDetails[]; 
    error?: string 
  }> {
    try {
      console.log('🔍 Fetching comprehensive appointment history for patient:', patientId);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics(
            id,
            clinic_name,
            address,
            city,
            state,
            phone,
            email,
            profile_pic_url
          ),
          doctor:doctors(
            id,
            full_name,
            specialization,
            email,
            profile_picture_url
          )
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) {
        console.error('❌ Error fetching patient appointments:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Found ${appointments?.length || 0} appointments for patient`);
      return { success: true, appointments: appointments || [] };
    } catch (error) {
      console.error('❌ Unexpected error fetching patient appointments:', error);
      return { success: false, error: 'Failed to fetch appointment history' };
    }
  },

  /**
   * Get patient's medical records
   */
  async getPatientMedicalRecords(patientId: string): Promise<{
    success: boolean;
    records?: any[];
    error?: string;
  }> {
    try {
      const { data: records, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          doctor:doctors(full_name, specialization),
          clinic:clinics(clinic_name)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching medical records:', error);
        return { success: false, error: error.message };
      }

      return { success: true, records: records || [] };
    } catch (error) {
      console.error('❌ Error fetching medical records:', error);
      return { success: false, error: 'Failed to fetch medical records' };
    }
  },

  /**
   * Get patient's prescriptions
   */
  async getPatientPrescriptions(patientId: string): Promise<{
    success: boolean;
    prescriptions?: any[];
    error?: string;
  }> {
    try {
      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctor:doctors(full_name, specialization),
          clinic:clinics(clinic_name)
        `)
        .eq('patient_id', patientId)
        .order('prescribed_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching prescriptions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, prescriptions: prescriptions || [] };
    } catch (error) {
      console.error('❌ Error fetching prescriptions:', error);
      return { success: false, error: 'Failed to fetch prescriptions' };
    }
  },

  /**
   * Get patient's lab results
   */
  async getPatientLabResults(patientId: string): Promise<{
    success: boolean;
    labResults?: any[];
    error?: string;
  }> {
    try {
      const { data: labResults, error } = await supabase
        .from('lab_results')
        .select(`
          *,
          doctor:doctors(full_name, specialization),
          clinic:clinics(clinic_name)
        `)
        .eq('patient_id', patientId)
        .order('test_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching lab results:', error);
        return { success: false, error: error.message };
      }

      return { success: true, labResults: labResults || [] };
    } catch (error) {
      console.error('❌ Error fetching lab results:', error);
      return { success: false, error: 'Failed to fetch lab results' };
    }
  },

  /**
   * Get patient's vaccination records
   */
  async getPatientVaccinations(patientId: string): Promise<{
    success: boolean;
    vaccinations?: any[];
    error?: string;
  }> {
    try {
      const { data: vaccinations, error } = await supabase
        .from('vaccination_records')
        .select(`
          *,
          doctor:doctors(full_name, specialization),
          clinic:clinics(clinic_name)
        `)
        .eq('patient_id', patientId)
        .order('administration_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching vaccination records:', error);
        return { success: false, error: error.message };
      }

      return { success: true, vaccinations: vaccinations || [] };
    } catch (error) {
      console.error('❌ Error fetching vaccination records:', error);
      return { success: false, error: 'Failed to fetch vaccination records' };
    }
  },

  /**
   * Get patient's insurance information
   */
  async getPatientInsurance(patientId: string): Promise<{
    success: boolean;
    insurance?: any[];
    error?: string;
  }> {
    try {
      const { data: insurance, error } = await supabase
        .from('insurance_info')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching insurance info:', error);
        return { success: false, error: error.message };
      }

      return { success: true, insurance: insurance || [] };
    } catch (error) {
      console.error('❌ Error fetching insurance info:', error);
      return { success: false, error: 'Failed to fetch insurance information' };
    }
  },

  /**
   * Get patient's emergency contacts
   */
  async getPatientEmergencyContacts(patientId: string): Promise<{
    success: boolean;
    contacts?: any[];
    error?: string;
  }> {
    try {
      const { data: contacts, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('patient_id', patientId)
        .order('is_primary', { ascending: false });

      if (error) {
        console.error('❌ Error fetching emergency contacts:', error);
        return { success: false, error: error.message };
      }

      return { success: true, contacts: contacts || [] };
    } catch (error) {
      console.error('❌ Error fetching emergency contacts:', error);
      return { success: false, error: 'Failed to fetch emergency contacts' };
    }
  },

  /**
   * Get patient's allergies
   */
  async getPatientAllergies(patientId: string): Promise<{
    success: boolean;
    allergies?: any[];
    error?: string;
  }> {
    try {
      const { data: allergies, error } = await supabase
        .from('allergies')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .order('severity', { ascending: false });

      if (error) {
        console.error('❌ Error fetching allergies:', error);
        return { success: false, error: error.message };
      }

      return { success: true, allergies: allergies || [] };
    } catch (error) {
      console.error('❌ Error fetching allergies:', error);
      return { success: false, error: 'Failed to fetch allergies' };
    }
  },

  /**
   * Get comprehensive patient dashboard data
   */
  async getPatientDashboardData(patientId: string): Promise<{
    success: boolean;
    data?: {
      appointments: any[];
      upcomingAppointments: any[];
      recentMedicalRecords: any[];
      activePrescriptions: any[];
      pendingLabResults: any[];
      stats: {
        totalAppointments: number;
        completedAppointments: number;
        upcomingAppointments: number;
        cancelledAppointments: number;
      };
    };
    error?: string;
  }> {
    try {
      // Get all appointments
      const appointmentsResult = await this.getPatientAppointmentHistory(patientId);
      if (!appointmentsResult.success) {
        return { success: false, error: appointmentsResult.error };
      }

      const appointments = appointmentsResult.appointments || [];
      const today = new Date().toISOString().split('T')[0];

      // Filter appointments
      const upcomingAppointments = appointments.filter(apt => 
        apt.appointment_date >= today && 
        ['scheduled', 'confirmed'].includes(apt.status)
      );

      // Get recent medical records
      const medicalRecordsResult = await this.getPatientMedicalRecords(patientId);
      const recentMedicalRecords = medicalRecordsResult.success ? 
        (medicalRecordsResult.records || []).slice(0, 5) : [];

      // Get active prescriptions
      const prescriptionsResult = await this.getPatientPrescriptions(patientId);
      const activePrescriptions = prescriptionsResult.success ?
        (prescriptionsResult.prescriptions || []).filter(p => p.status === 'active') : [];

      // Get pending lab results
      const labResultsResult = await this.getPatientLabResults(patientId);
      const pendingLabResults = labResultsResult.success ?
        (labResultsResult.labResults || []).filter(l => l.status === 'pending') : [];

      // Calculate stats
      const stats = {
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter(a => a.status === 'completed').length,
        upcomingAppointments: upcomingAppointments.length,
        cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length
      };

      return {
        success: true,
        data: {
          appointments,
          upcomingAppointments,
          recentMedicalRecords,
          activePrescriptions,
          pendingLabResults,
          stats
        }
      };
    } catch (error) {
      console.error('❌ Error fetching patient dashboard data:', error);
      return { success: false, error: 'Failed to fetch dashboard data' };
    }
  }
};
