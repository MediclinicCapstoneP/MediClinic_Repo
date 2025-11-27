import { supabase } from '../supabaseClient';

// ===================== INTERFACES =====================

export interface EnhancedDoctorAppointment {
  id: string;
  doctor_id: string;
  appointment_id: string;
  patient_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  clinic_name?: string;
  duration_minutes: number;
  payment_amount: number;
  doctor_notes?: string;
  consultation_notes?: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorPatientRecord {
  id: string;
  doctor_id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  age?: number;
  blood_type?: string;
  allergies?: string;
  medical_notes?: string;
  chronic_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  total_appointments: number;
  last_appointment_date?: string;
  next_appointment_date?: string;
  active_prescriptions: number;
  high_priority: boolean;
  requires_follow_up: boolean;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export interface EnhancedPrescription {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_id?: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  diagnosis?: string;
  status: string;
  prescribed_date: string;
  refills_remaining: number;
  max_refills: number;
  is_controlled_substance: boolean;
  follow_up_required: boolean;
  follow_up_date?: string;
  patient_name?: string;
  patient_email?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsultationNote {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_id?: string;
  chief_complaint?: string;
  history_of_present_illness?: string;
  physical_examination?: string;
  assessment_and_plan?: string;
  diagnosis?: string;
  treatment_plan?: string;
  follow_up_instructions?: string;
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  severity: string;
  note_type: string;
  is_confidential: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfileSettings {
  id: string;
  doctor_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  appointment_reminders: boolean;
  prescription_alerts: boolean;
  timezone: string;
  date_format: string;
  time_format: string;
  language: string;
  theme: string;
  auto_confirm_appointments: boolean;
  max_daily_appointments: number;
  profile_visible: boolean;
  created_at: string;
  updated_at: string;
}

// ===================== ENHANCED DOCTOR SERVICE =====================

export class EnhancedDoctorService {
  
  // ============ APPOINTMENTS ============
  
  static async getDoctorAppointments(doctorId: string, filters?: {
    status?: string;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): Promise<{ success: boolean; appointments?: EnhancedDoctorAppointment[]; error?: string }> {
    try {
      console.log('🏥 Enhanced: Fetching doctor appointments for:', doctorId);

      let query = supabase
        .from('doctor_appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

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

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching doctor appointments:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully fetched doctor appointments:', data?.length || 0);
      return { success: true, appointments: data || [] };

    } catch (error) {
      console.error('❌ Unexpected error fetching doctor appointments:', error);
      return { success: false, error: 'Failed to fetch appointments' };
    }
  }

  static async getAppointmentHistory(doctorId: string, filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): Promise<{ success: boolean; appointments?: EnhancedDoctorAppointment[]; error?: string }> {
    try {
      console.log('📚 Enhanced: Fetching appointment history for:', doctorId);

      // Get historical appointments (completed, cancelled, or past dates)
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('doctor_appointments')
        .select('*')
        .eq('doctor_id', doctorId)
        .or(`status.in.(completed,cancelled),appointment_date.lt.${today}`)
        .order('appointment_date', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
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

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching appointment history:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully fetched appointment history:', data?.length || 0);
      return { success: true, appointments: data || [] };

    } catch (error) {
      console.error('❌ Unexpected error fetching appointment history:', error);
      return { success: false, error: 'Failed to fetch appointment history' };
    }
  }

  // ============ PATIENT RECORDS ============

  static async getDoctorPatients(doctorId: string, filters?: {
    active?: boolean;
    search?: string;
    limit?: number;
  }): Promise<{ success: boolean; patients?: DoctorPatientRecord[]; error?: string }> {
    try {
      console.log('👥 Enhanced: Fetching doctor patients for:', doctorId);

      let query = supabase
        .from('doctor_patient_records')
        .select(`
          *,
          patient:patients(
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            blood_type,
            profile_pic_url
          )
        `)
        .eq('doctor_id', doctorId)
        .order('last_appointment_date', { ascending: false });

      if (filters?.active !== undefined) {
        query = query.eq('is_active', filters.active);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching doctor patients:', error);
        return { success: false, error: error.message };
      }

      // Transform data to include patient details
      const patients = (data || []).map((record: any) => {
        const age = record.patient?.date_of_birth 
          ? this.calculateAge(record.patient.date_of_birth) 
          : undefined;

        return {
          ...record,
          first_name: record.patient?.first_name || 'Unknown',
          last_name: record.patient?.last_name || 'Patient',
          email: record.patient?.email || '',
          phone: record.patient?.phone || '',
          date_of_birth: record.patient?.date_of_birth || '',
          blood_type: record.patient?.blood_type || '',
          age
        };
      });

      // Apply search filter if provided
      let filteredPatients = patients;
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredPatients = patients.filter(patient =>
          `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm) ||
          patient.email.toLowerCase().includes(searchTerm) ||
          patient.phone?.includes(searchTerm)
        );
      }

      console.log('✅ Successfully fetched doctor patients:', filteredPatients.length);
      return { success: true, patients: filteredPatients };

    } catch (error) {
      console.error('❌ Unexpected error fetching doctor patients:', error);
      return { success: false, error: 'Failed to fetch patients' };
    }
  }

  static async updatePatientRecord(recordId: string, updates: Partial<DoctorPatientRecord>): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('doctor_patient_records')
        .update(updates)
        .eq('id', recordId);

      if (error) {
        console.error('❌ Error updating patient record:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully updated patient record');
      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error updating patient record:', error);
      return { success: false, error: 'Failed to update patient record' };
    }
  }

  // ============ PRESCRIPTIONS ============

  static async getDoctorPrescriptions(doctorId: string, filters?: {
    status?: string;
    patientId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }): Promise<{ success: boolean; prescriptions?: EnhancedPrescription[]; error?: string }> {
    try {
      console.log('💊 Enhanced: Fetching doctor prescriptions for:', doctorId);

      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(first_name, last_name, email)
        `)
        .eq('doctor_id', doctorId)
        .order('prescribed_date', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }
      if (filters?.dateFrom) {
        query = query.gte('prescribed_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('prescribed_date', filters.dateTo);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching doctor prescriptions:', error);
        return { success: false, error: error.message };
      }

      // Transform data to include patient names
      const prescriptions = (data || []).map((prescription: any) => ({
        ...prescription,
        patient_name: prescription.patient 
          ? `${prescription.patient.first_name} ${prescription.patient.last_name}`
          : 'Unknown Patient',
        patient_email: prescription.patient?.email || ''
      }));

      console.log('✅ Successfully fetched doctor prescriptions:', prescriptions.length);
      return { success: true, prescriptions };

    } catch (error) {
      console.error('❌ Unexpected error fetching doctor prescriptions:', error);
      return { success: false, error: 'Failed to fetch prescriptions' };
    }
  }

  static async createPrescription(prescriptionData: {
    patient_id: string;
    doctor_id: string;
    appointment_id?: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    diagnosis?: string;
    refills_remaining?: number;
    is_controlled_substance?: boolean;
    follow_up_required?: boolean;
    follow_up_date?: string;
  }): Promise<{ success: boolean; prescription?: EnhancedPrescription; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert([{
          ...prescriptionData,
          prescribed_date: new Date().toISOString().split('T')[0],
          status: 'active',
          refills_remaining: prescriptionData.refills_remaining || 3,
          max_refills: prescriptionData.refills_remaining || 3
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating prescription:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully created prescription');
      return { success: true, prescription: data };

    } catch (error) {
      console.error('❌ Unexpected error creating prescription:', error);
      return { success: false, error: 'Failed to create prescription' };
    }
  }

  // ============ CONSULTATION NOTES ============

  static async createConsultationNote(noteData: Partial<ConsultationNote>): Promise<{
    success: boolean;
    note?: ConsultationNote;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('doctor_consultation_notes')
        .insert([noteData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating consultation note:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully created consultation note');
      return { success: true, note: data };

    } catch (error) {
      console.error('❌ Unexpected error creating consultation note:', error);
      return { success: false, error: 'Failed to create consultation note' };
    }
  }

  static async getConsultationNotes(doctorId: string, patientId?: string): Promise<{
    success: boolean;
    notes?: ConsultationNote[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from('doctor_consultation_notes')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching consultation notes:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully fetched consultation notes:', data?.length || 0);
      return { success: true, notes: data || [] };

    } catch (error) {
      console.error('❌ Unexpected error fetching consultation notes:', error);
      return { success: false, error: 'Failed to fetch consultation notes' };
    }
  }

  // ============ PROFILE & SETTINGS ============

  static async getDoctorProfile(doctorId: string): Promise<{
    success: boolean;
    profile?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', doctorId)
        .single();

      if (error) {
        console.error('❌ Error fetching doctor profile:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully fetched doctor profile');
      return { success: true, profile: data };

    } catch (error) {
      console.error('❌ Unexpected error fetching doctor profile:', error);
      return { success: false, error: 'Failed to fetch doctor profile' };
    }
  }

  static async updateDoctorProfile(doctorId: string, updates: any): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('doctors')
        .update(updates)
        .eq('id', doctorId);

      if (error) {
        console.error('❌ Error updating doctor profile:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully updated doctor profile');
      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error updating doctor profile:', error);
      return { success: false, error: 'Failed to update doctor profile' };
    }
  }

  static async getDoctorSettings(doctorId: string): Promise<{
    success: boolean;
    settings?: DoctorProfileSettings;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('doctor_profile_settings')
        .select('*')
        .eq('doctor_id', doctorId)
        .single();

      if (error) {
        console.error('❌ Error fetching doctor settings:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully fetched doctor settings');
      return { success: true, settings: data };

    } catch (error) {
      console.error('❌ Unexpected error fetching doctor settings:', error);
      return { success: false, error: 'Failed to fetch doctor settings' };
    }
  }

  static async updateDoctorSettings(doctorId: string, settings: Partial<DoctorProfileSettings>): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('doctor_profile_settings')
        .upsert({ ...settings, doctor_id: doctorId })
        .eq('doctor_id', doctorId);

      if (error) {
        console.error('❌ Error updating doctor settings:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully updated doctor settings');
      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error updating doctor settings:', error);
      return { success: false, error: 'Failed to update doctor settings' };
    }
  }

  // ============ HELPER METHODS ============

  private static calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  static async getDashboardStats(doctorId: string): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('doctor_dashboard_stats')
        .select('*')
        .eq('doctor_id', doctorId)
        .single();

      if (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Successfully fetched dashboard stats');
      return { success: true, stats: data };

    } catch (error) {
      console.error('❌ Unexpected error fetching dashboard stats:', error);
      return { success: false, error: 'Failed to fetch dashboard stats' };
    }
  }
}

export default EnhancedDoctorService;