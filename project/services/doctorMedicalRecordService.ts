import { supabase } from '../lib/supabase';

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  prescription?: string;
  notes?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  blood_pressure?: string;
  heart_rate?: string;
  temperature?: string;
  weight?: number;
  height?: number;
  allergies?: string;
  chronic_conditions?: string;
  medications?: string;
  family_history?: string;
  social_history?: string;
  created_at: string;
  updated_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth?: string;
  };
  appointment?: {
    appointment_date: string;
    appointment_time: string;
  };
}

export interface MedicalRecordCreate {
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  prescription?: string;
  notes?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  blood_pressure?: string;
  heart_rate?: string;
  temperature?: string;
  weight?: number;
  height?: number;
  allergies?: string;
  chronic_conditions?: string;
  medications?: string;
  family_history?: string;
  social_history?: string;
}

export interface ConsultationNote {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  note_type: 'general' | 'diagnosis' | 'treatment' | 'follow_up' | 'prescription' | 'vitals';
  title: string;
  content: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  patient?: {
    first_name: string;
    last_name: string;
  };
}

export interface ConsultationNoteCreate {
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  note_type: 'general' | 'diagnosis' | 'treatment' | 'follow_up' | 'prescription' | 'vitals';
  title: string;
  content: string;
  is_private?: boolean;
}

class DoctorMedicalRecordService {
  async getMedicalRecords(
    doctorId: string,
    filters?: {
      patientId?: string;
      dateFrom?: string;
      dateTo?: string;
      diagnosis?: string;
    }
  ): Promise<{ success: boolean; data: MedicalRecord[]; error?: string }> {
    try {
      let query = supabase
        .from('medical_records')
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone, date_of_birth),
          appointment:appointments(appointment_date, appointment_time)
        `)
        .eq('doctor_id', doctorId);

      // Apply filters
      if (filters?.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters?.diagnosis) {
        query = query.ilike('diagnosis', `%${filters.diagnosis}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching medical records:', error);
      return { success: false, data: [], error: 'Failed to fetch medical records' };
    }
  }

  async createMedicalRecord(
    record: MedicalRecordCreate
  ): Promise<{ success: boolean; data?: MedicalRecord; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          ...record,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone, date_of_birth),
          appointment:appointments(appointment_date, appointment_time)
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating medical record:', error);
      return { success: false, error: 'Failed to create medical record' };
    }
  }

  async updateMedicalRecord(
    recordId: string,
    updates: Partial<MedicalRecordCreate>,
    doctorId: string
  ): Promise<{ success: boolean; data?: MedicalRecord; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .eq('doctor_id', doctorId)
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone, date_of_birth),
          appointment:appointments(appointment_date, appointment_time)
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating medical record:', error);
      return { success: false, error: 'Failed to update medical record' };
    }
  }

  async deleteMedicalRecord(
    recordId: string,
    doctorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordId)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting medical record:', error);
      return { success: false, error: 'Failed to delete medical record' };
    }
  }

  async getPatientMedicalHistory(
    doctorId: string,
    patientId: string,
    limit: number = 50
  ): Promise<{ success: boolean; data: MedicalRecord[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone, date_of_birth),
          appointment:appointments(appointment_date, appointment_time)
        `)
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching patient medical history:', error);
      return { success: false, data: [], error: 'Failed to fetch patient medical history' };
    }
  }

  async getConsultationNotes(
    doctorId: string,
    filters?: {
      patientId?: string;
      noteType?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<{ success: boolean; data: ConsultationNote[]; error?: string }> {
    try {
      let query = supabase
        .from('consultation_notes')
        .select(`
          *,
          patient:patients(first_name, last_name)
        `)
        .eq('doctor_id', doctorId);

      // Apply filters
      if (filters?.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }

      if (filters?.noteType && filters.noteType !== 'all') {
        query = query.eq('note_type', filters.noteType);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching consultation notes:', error);
      return { success: false, data: [], error: 'Failed to fetch consultation notes' };
    }
  }

  async createConsultationNote(
    note: ConsultationNoteCreate
  ): Promise<{ success: boolean; data?: ConsultationNote; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('consultation_notes')
        .insert({
          ...note,
          is_private: note.is_private || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          patient:patients(first_name, last_name)
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating consultation note:', error);
      return { success: false, error: 'Failed to create consultation note' };
    }
  }

  async updateConsultationNote(
    noteId: string,
    updates: Partial<ConsultationNoteCreate>,
    doctorId: string
  ): Promise<{ success: boolean; data?: ConsultationNote; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('consultation_notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('doctor_id', doctorId)
        .select(`
          *,
          patient:patients(first_name, last_name)
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating consultation note:', error);
      return { success: false, error: 'Failed to update consultation note' };
    }
  }

  async deleteConsultationNote(
    noteId: string,
    doctorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('consultation_notes')
        .delete()
        .eq('id', noteId)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting consultation note:', error);
      return { success: false, error: 'Failed to delete consultation note' };
    }
  }

  async getPatientVitals(
    doctorId: string,
    patientId: string
  ): Promise<{ 
    success: boolean; 
    data: {
      latest_vitals: {
        blood_pressure?: string;
        heart_rate?: string;
        temperature?: string;
        weight?: number;
        height?: number;
        recorded_at: string;
      } | null;
      vitals_history: Array<{
        blood_pressure?: string;
        heart_rate?: string;
        temperature?: string;
        weight?: number;
        height?: number;
        recorded_at: string;
      }>;
    }; 
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          blood_pressure,
          heart_rate,
          temperature,
          weight,
          height,
          created_at
        `)
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .not('blood_pressure', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const records = data || [];
      const latest_vitals = records.length > 0 ? {
        blood_pressure: records[0].blood_pressure,
        heart_rate: records[0].heart_rate,
        temperature: records[0].temperature,
        weight: records[0].weight,
        height: records[0].height,
        recorded_at: records[0].created_at
      } : null;

      const vitals_history = records.map(record => ({
        blood_pressure: record.blood_pressure,
        heart_rate: record.heart_rate,
        temperature: record.temperature,
        weight: record.weight,
        height: record.height,
        recorded_at: record.created_at
      }));

      return { 
        success: true, 
        data: { latest_vitals, vitals_history } 
      };
    } catch (error) {
      console.error('Error fetching patient vitals:', error);
      return { 
        success: false, 
        data: { latest_vitals: null, vitals_history: [] }, 
        error: 'Failed to fetch patient vitals' 
      };
    }
  }

  async getMedicalRecordStats(doctorId: string): Promise<{ 
    success: boolean; 
    data: {
      totalRecords: number;
      recordsThisMonth: number;
      recordsThisWeek: number;
      uniquePatients: number;
      commonDiagnoses: { diagnosis: string; count: number }[];
      followUpRequired: number;
    }; 
    error?: string;
  }> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      const weekStart = currentWeekStart.toISOString().split('T')[0];
      
      // Get all records
      const { data: allRecords, error: allError } = await supabase
        .from('medical_records')
        .select('patient_id, diagnosis, follow_up_required, created_at')
        .eq('doctor_id', doctorId);

      if (allError) throw allError;

      // Get this month's records
      const { data: monthRecords, error: monthError } = await supabase
        .from('medical_records')
        .select('id')
        .eq('doctor_id', doctorId)
        .like('created_at', `${currentMonth}%`);

      if (monthError) throw monthError;

      // Get this week's records
      const { data: weekRecords, error: weekError } = await supabase
        .from('medical_records')
        .select('id')
        .eq('doctor_id', doctorId)
        .gte('created_at', weekStart);

      if (weekError) throw weekError;

      const records = allRecords || [];
      const monthCount = monthRecords?.length || 0;
      const weekCount = weekRecords?.length || 0;

      // Count unique patients
      const uniquePatients = new Set(records.map(r => r.patient_id)).size;

      // Count diagnoses
      const diagnosisCounts: { [key: string]: number } = {};
      records.forEach(r => {
        diagnosisCounts[r.diagnosis] = (diagnosisCounts[r.diagnosis] || 0) + 1;
      });

      const commonDiagnoses = Object.entries(diagnosisCounts)
        .map(([diagnosis, count]) => ({ diagnosis, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Count follow-ups required
      const followUpCount = records.filter(r => r.follow_up_required).length;

      return {
        success: true,
        data: {
          totalRecords: records.length,
          recordsThisMonth: monthCount,
          recordsThisWeek: weekCount,
          uniquePatients: uniquePatients,
          commonDiagnoses: commonDiagnoses,
          followUpRequired: followUpCount
        }
      };
    } catch (error) {
      console.error('Error fetching medical record stats:', error);
      return {
        success: false,
        data: {
          totalRecords: 0,
          recordsThisMonth: 0,
          recordsThisWeek: 0,
          uniquePatients: 0,
          commonDiagnoses: [],
          followUpRequired: 0
        },
        error: 'Failed to fetch medical record stats'
      };
    }
  }

  async searchMedicalRecords(
    doctorId: string,
    searchTerm: string,
    searchType: 'diagnosis' | 'symptoms' | 'treatment' | 'all' = 'all'
  ): Promise<{ success: boolean; data: MedicalRecord[]; error?: string }> {
    try {
      let query = supabase
        .from('medical_records')
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone, date_of_birth),
          appointment:appointments(appointment_date, appointment_time)
        `)
        .eq('doctor_id', doctorId);

      if (searchType === 'diagnosis') {
        query = query.ilike('diagnosis', `%${searchTerm}%`);
      } else if (searchType === 'symptoms') {
        query = query.ilike('symptoms', `%${searchTerm}%`);
      } else if (searchType === 'treatment') {
        query = query.ilike('treatment', `%${searchTerm}%`);
      } else {
        // Search across all text fields
        query = query.or(`diagnosis.ilike.%${searchTerm}%,symptoms.ilike.%${searchTerm}%,treatment.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error searching medical records:', error);
      return { success: false, data: [], error: 'Failed to search medical records' };
    }
  }

  async generateMedicalReport(
    doctorId: string,
    patientId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{ 
    success: boolean; 
    data: {
      patient_summary?: {
        total_visits: number;
        first_visit: string;
        last_visit: string;
        common_diagnoses: { diagnosis: string; count: number }[];
        vitals_summary: {
          avg_blood_pressure: string;
          avg_heart_rate: number;
          avg_temperature: number;
        };
      };
      records: MedicalRecord[];
      summary: {
        total_records: number;
        date_range: { from: string; to: string };
        follow_ups_required: number;
      };
    }; 
    error?: string;
  }> {
    try {
      let query = supabase
        .from('medical_records')
        .select(`
          *,
          patient:patients(first_name, last_name, email, phone, date_of_birth),
          appointment:appointments(appointment_date, appointment_time)
        `)
        .eq('doctor_id', doctorId);

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const records = data || [];
      const followUpsRequired = records.filter(r => r.follow_up_required).length;

      const summary = {
        total_records: records.length,
        date_range: {
          from: dateFrom || (records.length > 0 ? records[records.length - 1].created_at : ''),
          to: dateTo || (records.length > 0 ? records[0].created_at : '')
        },
        follow_ups_required: followUpsRequired
      };

      let patient_summary;
      if (patientId && records.length > 0) {
        // Calculate patient-specific summary
        const diagnoses: { [key: string]: number } = {};
        let totalBP = 0;
        let totalHR = 0;
        let totalTemp = 0;
        let vitalsCount = 0;

        records.forEach(record => {
          if (record.diagnosis) {
            diagnoses[record.diagnosis] = (diagnoses[record.diagnosis] || 0) + 1;
          }
          if (record.heart_rate) {
            totalHR += parseInt(record.heart_rate);
            vitalsCount++;
          }
          if (record.temperature) {
            totalTemp += parseFloat(record.temperature);
          }
        });

        const commonDiagnoses = Object.entries(diagnoses)
          .map(([diagnosis, count]) => ({ diagnosis, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        patient_summary = {
          total_visits: records.length,
          first_visit: records[records.length - 1].created_at,
          last_visit: records[0].created_at,
          common_diagnoses: commonDiagnoses,
          vitals_summary: {
            avg_blood_pressure: '120/80', // Simplified
            avg_heart_rate: vitalsCount > 0 ? Math.round(totalHR / vitalsCount) : 0,
            avg_temperature: vitalsCount > 0 ? parseFloat((totalTemp / vitalsCount).toFixed(1)) : 0
          }
        };
      }

      return {
        success: true,
        data: {
          patient_summary,
          records,
          summary
        }
      };
    } catch (error) {
      console.error('Error generating medical report:', error);
      return {
        success: false,
        data: {
          records: [],
          summary: {
            total_records: 0,
            date_range: { from: '', to: '' },
            follow_ups_required: 0
          }
        },
        error: 'Failed to generate medical report'
      };
    }
  }
}

export const doctorMedicalRecordService = new DoctorMedicalRecordService();
