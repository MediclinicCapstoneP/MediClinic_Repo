import { supabase } from '../supabaseClient';
import { 
  PatientMedicalHistory, 
  MedicalRecordWithDetails, 
  PrescriptionWithDetails,
  HistoryTimelineItem,
  HistoryFilters 
} from '../types/history';
import { AppointmentWithDetails } from '../types/appointments';

export interface EnhancedHistoryFilters extends HistoryFilters {
  clinicId?: string;
  doctorId?: string;
  appointmentType?: string;
  paymentStatus?: 'paid' | 'pending' | 'failed';
  dateRange?: {
    start: string;
    end: string;
  };
}

export class EnhancedHistoryService {
  /**
   * Get comprehensive patient history with all related data
   */
  static async getPatientHistory(
    patientId: string,
    filters?: EnhancedHistoryFilters
  ): Promise<{ success: boolean; data?: PatientMedicalHistory; error?: string }> {
    try {
      console.log('🔍 Fetching comprehensive patient history for:', patientId);

      // Build the main appointments query with all relationships
      let appointmentsQuery = supabase
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
            email,
            profile_pic_url
          ),
          doctors (
            id,
            first_name,
            last_name,
            specialty,
            profile_pic_url
          ),
          prescriptions (
            id,
            medication_name,
            dosage,
            frequency,
            duration,
            instructions,
            created_at,
            prescription_medications (
              id,
              medication_name,
              dosage,
              frequency,
              duration,
              instructions
            )
          ),
          medical_records (
            id,
            diagnosis,
            symptoms,
            treatment_plan,
            notes,
            created_at,
            updated_at
          )
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      // Apply filters
      if (filters?.clinicId) {
        appointmentsQuery = appointmentsQuery.eq('clinic_id', filters.clinicId);
      }
      if (filters?.doctorId) {
        appointmentsQuery = appointmentsQuery.eq('doctor_id', filters.doctorId);
      }
      if (filters?.appointmentType) {
        appointmentsQuery = appointmentsQuery.eq('appointment_type', filters.appointmentType);
      }
      if (filters?.status) {
        appointmentsQuery = appointmentsQuery.eq('status', filters.status);
      }
      if (filters?.dateRange) {
        appointmentsQuery = appointmentsQuery
          .gte('appointment_date', filters.dateRange.start)
          .lte('appointment_date', filters.dateRange.end);
      }

      const { data: appointments, error: appointmentsError } = await appointmentsQuery;

      if (appointmentsError) {
        console.error('❌ Error fetching appointments:', appointmentsError);
        return { success: false, error: appointmentsError.message };
      }

      // Get patient profile data
      const { data: patientProfile, error: profileError } = await supabase
        .from('patients')
        .select(`
          *,
          emergency_contacts (*),
          insurance_info (*)
        `)
        .eq('id', patientId)
        .single();

      if (profileError) {
        console.error('❌ Error fetching patient profile:', profileError);
        return { success: false, error: profileError.message };
      }

      // Get all medical records for the patient
      const { data: medicalRecords, error: recordsError } = await supabase
        .from('medical_records')
        .select(`
          *,
          appointments (
            appointment_date,
            appointment_time,
            clinics (clinic_name),
            doctors (first_name, last_name, specialty)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (recordsError) {
        console.error('❌ Error fetching medical records:', recordsError);
      }

      // Get all prescriptions for the patient
      const { data: prescriptions, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_medications (*),
          appointments (
            appointment_date,
            appointment_time,
            clinics (clinic_name),
            doctors (first_name, last_name, specialty)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (prescriptionsError) {
        console.error('❌ Error fetching prescriptions:', prescriptionsError);
      }

      // Calculate summary statistics
      const completedAppointments = appointments?.filter(apt => apt.status === 'completed') || [];
      const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.payment_amount || 0), 0);
      const uniqueClinics = new Set(appointments?.map(apt => apt.clinic_id)).size;
      const uniqueDoctors = new Set(appointments?.map(apt => apt.doctor_id).filter(Boolean)).size;

      const summary = {
        totalAppointments: appointments?.length || 0,
        completedAppointments: completedAppointments.length,
        cancelledAppointments: appointments?.filter(apt => apt.status === 'cancelled').length || 0,
        totalPrescriptions: prescriptions?.length || 0,
        totalMedicalRecords: medicalRecords?.length || 0,
        totalRevenue,
        uniqueClinics,
        uniqueDoctors,
        lastAppointmentDate: appointments?.[0]?.appointment_date || null,
        nextAppointmentDate: appointments?.find(apt => 
          new Date(apt.appointment_date) > new Date() && apt.status === 'confirmed'
        )?.appointment_date || null
      };

      const medicalHistory: PatientMedicalHistory = {
        patientId,
        patientProfile,
        appointments: appointments || [],
        medicalRecords: medicalRecords || [],
        prescriptions: prescriptions || [],
        summary,
        lastUpdated: new Date().toISOString()
      };

      console.log(`✅ Successfully fetched patient history with ${appointments?.length || 0} appointments`);
      return { success: true, data: medicalHistory };

    } catch (error) {
      console.error('❌ Unexpected error fetching patient history:', error);
      return { success: false, error: 'Failed to fetch patient history' };
    }
  }

  /**
   * Get appointment history with enhanced filtering
   */
  static async getAppointmentHistory(
    patientId: string,
    filters?: EnhancedHistoryFilters
  ): Promise<{ success: boolean; appointments?: AppointmentWithDetails[]; error?: string }> {
    try {
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
            profile_pic_url
          ),
          doctors (
            id,
            first_name,
            last_name,
            specialty,
            profile_pic_url
          )
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.clinicId) {
        query = query.eq('clinic_id', filters.clinicId);
      }
      if (filters?.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }
      if (filters?.appointmentType) {
        query = query.eq('appointment_type', filters.appointmentType);
      }
      if (filters?.dateRange) {
        query = query
          .gte('appointment_date', filters.dateRange.start)
          .lte('appointment_date', filters.dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching appointment history:', error);
        return { success: false, error: error.message };
      }

      return { success: true, appointments: data || [] };
    } catch (error) {
      console.error('❌ Unexpected error fetching appointment history:', error);
      return { success: false, error: 'Failed to fetch appointment history' };
    }
  }

  /**
   * Get medical records history
   */
  static async getMedicalRecordsHistory(
    patientId: string,
    filters?: EnhancedHistoryFilters
  ): Promise<{ success: boolean; records?: MedicalRecordWithDetails[]; error?: string }> {
    try {
      let query = supabase
        .from('medical_records')
        .select(`
          *,
          appointments (
            id,
            appointment_date,
            appointment_time,
            status,
            clinics (clinic_name),
            doctors (first_name, last_name, specialty)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (filters?.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }
      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching medical records:', error);
        return { success: false, error: error.message };
      }

      return { success: true, records: data || [] };
    } catch (error) {
      console.error('❌ Unexpected error fetching medical records:', error);
      return { success: false, error: 'Failed to fetch medical records' };
    }
  }

  /**
   * Get prescription history
   */
  static async getPrescriptionHistory(
    patientId: string,
    filters?: EnhancedHistoryFilters
  ): Promise<{ success: boolean; prescriptions?: PrescriptionWithDetails[]; error?: string }> {
    try {
      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_medications (*),
          appointments (
            id,
            appointment_date,
            appointment_time,
            clinics (clinic_name),
            doctors (first_name, last_name, specialty)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (filters?.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }
      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching prescriptions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, prescriptions: data || [] };
    } catch (error) {
      console.error('❌ Unexpected error fetching prescriptions:', error);
      return { success: false, error: 'Failed to fetch prescriptions' };
    }
  }

  /**
   * Generate timeline from medical history
   */
  static generateHistoryTimeline(history: PatientMedicalHistory): HistoryTimelineItem[] {
    const timelineItems: HistoryTimelineItem[] = [];

    // Add appointments to timeline
    history.appointments.forEach(appointment => {
      timelineItems.push({
        id: `appointment_${appointment.id}`,
        type: 'appointment',
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        title: `Appointment at ${appointment.clinics?.clinic_name}`,
        description: `${appointment.appointment_type} appointment with ${appointment.doctors?.first_name} ${appointment.doctors?.last_name}`,
        status: appointment.status,
        metadata: {
          appointmentId: appointment.id,
          clinicName: appointment.clinics?.clinic_name,
          doctorName: `${appointment.doctors?.first_name} ${appointment.doctors?.last_name}`,
          specialty: appointment.doctors?.specialty
        }
      });
    });

    // Add medical records to timeline
    history.medicalRecords.forEach(record => {
      timelineItems.push({
        id: `record_${record.id}`,
        type: 'medical_record',
        date: record.created_at.split('T')[0],
        time: record.created_at.split('T')[1]?.split('.')[0],
        title: 'Medical Record Updated',
        description: record.diagnosis || record.symptoms || 'Medical record entry',
        status: 'completed',
        metadata: {
          recordId: record.id,
          diagnosis: record.diagnosis,
          symptoms: record.symptoms,
          treatmentPlan: record.treatment_plan
        }
      });
    });

    // Add prescriptions to timeline
    history.prescriptions.forEach(prescription => {
      timelineItems.push({
        id: `prescription_${prescription.id}`,
        type: 'prescription',
        date: prescription.created_at.split('T')[0],
        time: prescription.created_at.split('T')[1]?.split('.')[0],
        title: 'Prescription Issued',
        description: `${prescription.medication_name} - ${prescription.dosage}`,
        status: 'completed',
        metadata: {
          prescriptionId: prescription.id,
          medicationName: prescription.medication_name,
          dosage: prescription.dosage,
          frequency: prescription.frequency
        }
      });
    });

    // Sort by date and time (most recent first)
    return timelineItems.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`);
      return dateB.getTime() - dateA.getTime();
    });
  }

  /**
   * Get patient statistics
   */
  static async getPatientStatistics(
    patientId: string
  ): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      // Get appointment statistics
      const { data: appointmentStats, error: appointmentError } = await supabase
        .from('appointments')
        .select('status, payment_amount, appointment_date')
        .eq('patient_id', patientId);

      if (appointmentError) {
        return { success: false, error: appointmentError.message };
      }

      // Get prescription count
      const { count: prescriptionCount, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId);

      if (prescriptionError) {
        return { success: false, error: prescriptionError.message };
      }

      // Get medical records count
      const { count: recordsCount, error: recordsError } = await supabase
        .from('medical_records')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientId);

      if (recordsError) {
        return { success: false, error: recordsError.message };
      }

      const stats = {
        totalAppointments: appointmentStats?.length || 0,
        completedAppointments: appointmentStats?.filter(apt => apt.status === 'completed').length || 0,
        cancelledAppointments: appointmentStats?.filter(apt => apt.status === 'cancelled').length || 0,
        totalSpent: appointmentStats?.reduce((sum, apt) => sum + (apt.payment_amount || 0), 0) || 0,
        totalPrescriptions: prescriptionCount || 0,
        totalMedicalRecords: recordsCount || 0,
        lastAppointmentDate: appointmentStats?.[0]?.appointment_date || null
      };

      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error fetching patient statistics:', error);
      return { success: false, error: 'Failed to fetch patient statistics' };
    }
  }
}

export default EnhancedHistoryService;
