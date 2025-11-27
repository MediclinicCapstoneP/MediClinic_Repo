import { supabase } from '../supabaseClient';
import { 
  PatientMedicalHistory, 
  MedicalRecordWithDetails,
  HistoryTimelineItem,
  HistoryFilters 
} from '../types/history';
import { AppointmentWithDetails } from '../types/appointments';

export interface ConsultationRecord {
  id: string;
  patient_id: string;
  doctor_id?: string;
  clinic_id: string;
  appointment_id?: string;
  consultation_date: string;
  consultation_type: 'virtual' | 'in_person' | 'phone' | 'follow_up' | 'emergency';
  chief_complaint: string;
  diagnosis: string;
  treatment_plan: string;
  prescription_notes?: string;
  doctor_notes?: string;
  patient_notes?: string;
  duration_minutes: number;
  consultation_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  payment_status: 'pending' | 'paid' | 'refunded' | 'waived';
  consultation_fee: number;
  follow_up_required: boolean;
  follow_up_date?: string;
  vital_signs?: {
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    heart_rate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ConsultationWithDetails extends ConsultationRecord {
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
  };
  doctor?: {
    id: string;
    first_name: string;
    last_name: string;
    specialty: string;
    email?: string;
  };
  clinic?: {
    id: string;
    clinic_name: string;
    address?: string;
    city?: string;
    state?: string;
  };
  appointment?: {
    id: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
  };
}

export interface ConsultationHistoryFilters extends HistoryFilters {
  consultation_type?: string;
  consultation_status?: string;
  payment_status?: string;
  doctor_specialty?: string;
  fee_range?: {
    min: number;
    max: number;
  };
  has_follow_up?: boolean;
}

export class ConsultationHistoryService {
  /**
   * Get comprehensive consultation history for a patient
   */
  static async getPatientConsultationHistory(
    patientId: string,
    filters?: ConsultationHistoryFilters
  ): Promise<{ success: boolean; data?: ConsultationWithDetails[]; error?: string }> {
    try {
      console.log('🔍 Fetching consultation history for patient:', patientId);

      // Build query with relationships
      let query = supabase
        .from('appointments')
        .select(`
          *,
          clinics (
            id,
            clinic_name,
            address,
            city,
            state,
            phone,
            email
          ),
          doctors (
            id,
            first_name,
            last_name,
            specialty,
            email
          ),
          patients (
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            gender
          ),
          medical_records (
            id,
            chief_complaint,
            diagnosis,
            treatment_plan,
            notes,
            vital_signs,
            created_at
          )
        `)
        .eq('patient_id', patientId)
        .in('status', ['completed', 'in_progress'])
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      // Apply filters
      if (filters?.date_from) {
        query = query.gte('appointment_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('appointment_date', filters.date_to);
      }
      if (filters?.doctor_id) {
        query = query.eq('doctor_id', filters.doctor_id);
      }
      if (filters?.clinic_id) {
        query = query.eq('clinic_id', filters.clinic_id);
      }
      if (filters?.consultation_type) {
        query = query.eq('appointment_type', filters.consultation_type);
      }
      if (filters?.consultation_status) {
        query = query.eq('status', filters.consultation_status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching consultation history:', error);
        return { success: false, error: error.message };
      }

      // Transform appointments into consultation records
      const consultations: ConsultationWithDetails[] = (data || []).map(appointment => {
        const medicalRecord = appointment.medical_records?.[0];
        
        return {
          id: appointment.id,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          clinic_id: appointment.clinic_id,
          appointment_id: appointment.id,
          consultation_date: appointment.appointment_date,
          consultation_type: appointment.appointment_type,
          chief_complaint: medicalRecord?.chief_complaint || appointment.patient_notes || '',
          diagnosis: medicalRecord?.diagnosis || '',
          treatment_plan: medicalRecord?.treatment_plan || '',
          prescription_notes: '',
          doctor_notes: appointment.doctor_notes || medicalRecord?.notes || '',
          patient_notes: appointment.patient_notes || '',
          duration_minutes: appointment.duration_minutes,
          consultation_status: appointment.status,
          payment_status: appointment.payment_amount ? 'paid' : 'pending',
          consultation_fee: appointment.payment_amount || appointment.total_cost || 0,
          follow_up_required: appointment.appointment_type === 'follow_up',
          follow_up_date: undefined,
          vital_signs: medicalRecord?.vital_signs,
          created_at: appointment.created_at,
          updated_at: appointment.updated_at,
          patient: appointment.patients ? {
            id: appointment.patients.id,
            first_name: appointment.patients.first_name,
            last_name: appointment.patients.last_name,
            email: appointment.patients.email,
            phone: appointment.patients.phone,
            date_of_birth: appointment.patients.date_of_birth,
            gender: appointment.patients.gender
          } : undefined,
          doctor: appointment.doctors ? {
            id: appointment.doctors.id,
            first_name: appointment.doctors.first_name,
            last_name: appointment.doctors.last_name,
            specialty: appointment.doctors.specialty,
            email: appointment.doctors.email
          } : undefined,
          clinic: appointment.clinics ? {
            id: appointment.clinics.id,
            clinic_name: appointment.clinics.clinic_name,
            address: appointment.clinics.address,
            city: appointment.clinics.city,
            state: appointment.clinics.state
          } : undefined,
          appointment: {
            id: appointment.id,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            status: appointment.status
          }
        };
      });

      console.log(`✅ Successfully fetched ${consultations.length} consultation records`);
      return { success: true, data: consultations };

    } catch (error) {
      console.error('❌ Unexpected error fetching consultation history:', error);
      return { success: false, error: 'Failed to fetch consultation history' };
    }
  }

  /**
   * Get consultation history for a doctor (all patients)
   */
  static async getDoctorConsultationHistory(
    doctorId: string,
    filters?: ConsultationHistoryFilters
  ): Promise<{ success: boolean; data?: ConsultationWithDetails[]; error?: string }> {
    try {
      console.log('🔍 Fetching consultation history for doctor:', doctorId);

      let query = supabase
        .from('appointments')
        .select(`
          *,
          clinics (
            id,
            clinic_name,
            address,
            city,
            state
          ),
          patients (
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            gender
          ),
          doctors (
            id,
            first_name,
            last_name,
            specialty
          ),
          medical_records (
            id,
            chief_complaint,
            diagnosis,
            treatment_plan,
            notes,
            vital_signs,
            created_at
          )
        `)
        .eq('doctor_id', doctorId)
        .in('status', ['completed', 'in_progress'])
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      // Apply filters
      if (filters?.date_from) {
        query = query.gte('appointment_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('appointment_date', filters.date_to);
      }
      if (filters?.clinic_id) {
        query = query.eq('clinic_id', filters.clinic_id);
      }
      if (filters?.consultation_status) {
        query = query.eq('status', filters.consultation_status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching doctor consultation history:', error);
        return { success: false, error: error.message };
      }

      // Transform data similar to patient history
      const consultations: ConsultationWithDetails[] = (data || []).map(appointment => {
        const medicalRecord = appointment.medical_records?.[0];
        
        return {
          id: appointment.id,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          clinic_id: appointment.clinic_id,
          appointment_id: appointment.id,
          consultation_date: appointment.appointment_date,
          consultation_type: appointment.appointment_type,
          chief_complaint: medicalRecord?.chief_complaint || appointment.patient_notes || '',
          diagnosis: medicalRecord?.diagnosis || '',
          treatment_plan: medicalRecord?.treatment_plan || '',
          prescription_notes: '',
          doctor_notes: appointment.doctor_notes || medicalRecord?.notes || '',
          patient_notes: appointment.patient_notes || '',
          duration_minutes: appointment.duration_minutes,
          consultation_status: appointment.status,
          payment_status: appointment.payment_amount ? 'paid' : 'pending',
          consultation_fee: appointment.payment_amount || appointment.total_cost || 0,
          follow_up_required: appointment.appointment_type === 'follow_up',
          follow_up_date: undefined,
          vital_signs: medicalRecord?.vital_signs,
          created_at: appointment.created_at,
          updated_at: appointment.updated_at,
          patient: appointment.patients ? {
            id: appointment.patients.id,
            first_name: appointment.patients.first_name,
            last_name: appointment.patients.last_name,
            email: appointment.patients.email,
            phone: appointment.patients.phone,
            date_of_birth: appointment.patients.date_of_birth,
            gender: appointment.patients.gender
          } : undefined,
          doctor: appointment.doctors ? {
            id: appointment.doctors.id,
            first_name: appointment.doctors.first_name,
            last_name: appointment.doctors.last_name,
            specialty: appointment.doctors.specialty
          } : undefined,
          clinic: appointment.clinics ? {
            id: appointment.clinics.id,
            clinic_name: appointment.clinics.clinic_name,
            address: appointment.clinics.address,
            city: appointment.clinics.city,
            state: appointment.clinics.state
          } : undefined,
          appointment: {
            id: appointment.id,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            status: appointment.status
          }
        };
      });

      console.log(`✅ Successfully fetched ${consultations.length} consultation records for doctor`);
      return { success: true, data: consultations };

    } catch (error) {
      console.error('❌ Unexpected error fetching doctor consultation history:', error);
      return { success: false, error: 'Failed to fetch consultation history' };
    }
  }

  /**
   * Update consultation record with post-consultation details
   */
  static async updateConsultationRecord(
    appointmentId: string,
    updateData: {
      diagnosis?: string;
      treatment_plan?: string;
      doctor_notes?: string;
      vital_signs?: any;
      follow_up_required?: boolean;
      follow_up_date?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 Updating consultation record:', appointmentId);

      // Update appointment with doctor notes
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({
          doctor_notes: updateData.doctor_notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (appointmentError) {
        console.error('❌ Error updating appointment:', appointmentError);
        return { success: false, error: appointmentError.message };
      }

      // Create or update medical record
      if (updateData.diagnosis || updateData.treatment_plan || updateData.vital_signs) {
        const { error: medicalRecordError } = await supabase
          .from('medical_records')
          .upsert({
            appointment_id: appointmentId,
            diagnosis: updateData.diagnosis,
            treatment_plan: updateData.treatment_plan,
            vital_signs: updateData.vital_signs,
            notes: updateData.doctor_notes,
            updated_at: new Date().toISOString()
          });

        if (medicalRecordError) {
          console.warn('⚠️ Error updating medical record:', medicalRecordError);
          // Don't fail the entire operation if medical record update fails
        }
      }

      console.log('✅ Successfully updated consultation record');
      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error updating consultation record:', error);
      return { success: false, error: 'Failed to update consultation record' };
    }
  }

  /**
   * Get consultation statistics for a patient
   */
  static async getPatientConsultationStats(
    patientId: string
  ): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('status, payment_amount, appointment_date, appointment_type, duration_minutes')
        .eq('patient_id', patientId);

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = {
        total_consultations: appointments?.length || 0,
        completed_consultations: appointments?.filter(apt => apt.status === 'completed').length || 0,
        upcoming_consultations: appointments?.filter(apt => 
          new Date(apt.appointment_date) > new Date() && apt.status === 'scheduled'
        ).length || 0,
        cancelled_consultations: appointments?.filter(apt => apt.status === 'cancelled').length || 0,
        total_consultation_fees: appointments?.reduce((sum, apt) => sum + (apt.payment_amount || 0), 0) || 0,
        average_consultation_duration: Math.round(
          (appointments?.reduce((sum, apt) => sum + apt.duration_minutes, 0) || 0) / 
          Math.max(appointments?.length || 1, 1)
        ),
        consultation_types: appointments?.reduce((acc, apt) => {
          acc[apt.appointment_type] = (acc[apt.appointment_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        last_consultation_date: appointments
          ?.filter(apt => apt.status === 'completed')
          ?.map(apt => apt.appointment_date)
          ?.sort()
          ?.pop() || null,
        next_consultation_date: appointments
          ?.filter(apt => new Date(apt.appointment_date) > new Date() && apt.status === 'scheduled')
          ?.map(apt => apt.appointment_date)
          ?.sort()
          ?.shift() || null
      };

      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error fetching consultation statistics:', error);
      return { success: false, error: 'Failed to fetch consultation statistics' };
    }
  }

  /**
   * Generate timeline for consultation history
   */
  static generateConsultationTimeline(consultations: ConsultationWithDetails[]): HistoryTimelineItem[] {
    return consultations.map(consultation => ({
      id: `consultation_${consultation.id}`,
      type: 'appointments',
      date: consultation.consultation_date,
      title: `${consultation.consultation_type} Consultation`,
      description: consultation.chief_complaint || consultation.diagnosis || 'Consultation completed',
      doctor_name: consultation.doctor ? 
        `${consultation.doctor.first_name} ${consultation.doctor.last_name}` : undefined,
      clinic_name: consultation.clinic?.clinic_name,
      status: consultation.consultation_status,
      priority: consultation.follow_up_required ? 'high' : 'normal',
      data: consultation
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Search consultation history
   */
  static searchConsultationHistory(
    consultations: ConsultationWithDetails[],
    searchTerm: string
  ): ConsultationWithDetails[] {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return consultations.filter(consultation => 
      consultation.chief_complaint.toLowerCase().includes(lowerSearchTerm) ||
      consultation.diagnosis.toLowerCase().includes(lowerSearchTerm) ||
      consultation.treatment_plan.toLowerCase().includes(lowerSearchTerm) ||
      consultation.doctor_notes?.toLowerCase().includes(lowerSearchTerm) ||
      consultation.patient_notes?.toLowerCase().includes(lowerSearchTerm) ||
      consultation.doctor?.first_name?.toLowerCase().includes(lowerSearchTerm) ||
      consultation.doctor?.last_name?.toLowerCase().includes(lowerSearchTerm) ||
      consultation.clinic?.clinic_name?.toLowerCase().includes(lowerSearchTerm)
    );
  }
}

export default ConsultationHistoryService;