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
          ),
          doctor:doctors (
            id,
            full_name,
            specialization
          ),
          clinic:clinics (
            id,
            clinic_name
          )
        `)
        .eq('patient_id', patientId)
        .is('is_private', false)
        .order('visit_date', { ascending: false })
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

      // Transform medical records to match expected format
      const transformedMedicalRecords = (medicalRecords || []).map((record: any) => ({
        ...record,
        doctor: record.doctor || (record.doctors ? {
          id: record.doctors.id,
          full_name: `${record.doctors.first_name} ${record.doctors.last_name}`,
          specialization: record.doctors.specialty
        } : undefined),
        clinic: record.clinic || (record.clinics ? {
          id: record.clinics.id,
          clinic_name: record.clinics.clinic_name
        } : undefined)
      }));

      // Get other required data (lab results, vaccinations, allergies, etc.)
      const { MedicalHistoryService } = await import('./medicalHistoryService');
      const [labResultsResult, vaccinationsResult, allergiesResult, insuranceResult, emergencyContactsResult] = await Promise.all([
        MedicalHistoryService.getLabResults(patientId),
        MedicalHistoryService.getVaccinations(patientId),
        MedicalHistoryService.getAllergies(patientId),
        MedicalHistoryService.getInsuranceInfo(patientId),
        MedicalHistoryService.getEmergencyContacts(patientId)
      ]);

      const labResults = labResultsResult.success ? labResultsResult.data || [] : [];
      const vaccinations = vaccinationsResult.success ? vaccinationsResult.data || [] : [];
      const allergies = allergiesResult.success ? allergiesResult.data || [] : [];
      const insurance = insuranceResult.success ? insuranceResult.data || [] : [];
      const emergencyContacts = emergencyContactsResult.success ? emergencyContactsResult.data || [] : [];

      // Generate summary
      const today = new Date().toISOString().split('T')[0];
      const completedAppointments = (appointments || []).filter((apt: any) => apt.status === 'completed').length;
      const upcomingAppointments = (appointments || []).filter((apt: any) => 
        apt.appointment_date >= today && ['scheduled', 'confirmed'].includes(apt.status)
      ).length;
      const cancelledAppointments = (appointments || []).filter((apt: any) => apt.status === 'cancelled').length;
      const activePrescriptions = (prescriptions || []).filter((p: any) => p.status === 'active').length;
      const pendingLabResults = labResults.filter((l: any) => l.status === 'pending').length;
      const activeAllergies = allergies.filter((a: any) => a.is_active).length;
      
      const lastVisitDate = (appointments || [])
        .filter((apt: any) => apt.status === 'completed')
        .map((apt: any) => apt.appointment_date)
        .sort()
        .pop();
      
      const nextAppointmentDate = (appointments || [])
        .filter((apt: any) => apt.appointment_date >= today && ['scheduled', 'confirmed'].includes(apt.status))
        .map((apt: any) => apt.appointment_date)
        .sort()
        .shift();
      
      const chronicConditions = [...new Set(
        transformedMedicalRecords
          .filter((r: any) => r.diagnosis && r.diagnosis.toLowerCase().includes('chronic'))
          .map((r: any) => r.diagnosis)
          .filter(Boolean)
      )];
      
      const currentMedications = (prescriptions || [])
        .filter((p: any) => p.status === 'active')
        .map((p: any) => p.medication_name)
        .filter(Boolean);

      const summary = {
        total_appointments: appointments?.length || 0,
        completed_appointments: completedAppointments,
        upcoming_appointments: upcomingAppointments,
        cancelled_appointments: cancelledAppointments,
        total_prescriptions: prescriptions?.length || 0,
        active_prescriptions: activePrescriptions,
        total_lab_results: labResults.length,
        pending_lab_results: pendingLabResults,
        total_vaccinations: vaccinations.length,
        total_allergies: allergies.length,
        active_allergies: activeAllergies,
        last_visit_date: lastVisitDate,
        next_appointment_date: nextAppointmentDate,
        chronic_conditions: chronicConditions,
        current_medications: currentMedications
      };

      const medicalHistory: PatientMedicalHistory = {
        patient_id: patientId,
        appointments: appointments || [],
        medical_records: transformedMedicalRecords,
        prescriptions: prescriptions || [],
        lab_results: labResults,
        vaccinations: vaccinations,
        allergies: allergies,
        insurance_info: insurance,
        emergency_contacts: emergencyContacts,
        summary
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
          ),
          doctor:doctors (
            id,
            full_name,
            specialization
          ),
          clinic:clinics (
            id,
            clinic_name
          )
        `)
        .eq('patient_id', patientId)
        .is('is_private', false)
        .order('visit_date', { ascending: false })
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
      const appointmentData = appointment as any;
      timelineItems.push({
        id: `appointment-${appointment.id}`,
        type: 'appointments',
        date: appointment.appointment_date,
        title: `Appointment - ${appointmentData.appointment_type || 'Consultation'}`,
        description: `${appointment.status} appointment${appointmentData.clinics?.clinic_name ? ` at ${appointmentData.clinics.clinic_name}` : ''}${appointmentData.doctors ? ` with ${appointmentData.doctors.first_name} ${appointmentData.doctors.last_name}` : ''}`,
        doctor_name: appointmentData.doctors ? `${appointmentData.doctors.first_name} ${appointmentData.doctors.last_name}` : undefined,
        clinic_name: appointmentData.clinics?.clinic_name,
        status: appointment.status,
        data: appointment
      });
    });

    // Add medical records to timeline
    history.medical_records.forEach(record => {
      const recordData = record as any;
      timelineItems.push({
        id: `record-${record.id}`,
        type: 'medical_records',
        date: recordData.visit_date || record.created_at.split('T')[0],
        title: recordData.title || `Medical Record - ${recordData.record_type || 'consultation'}`,
        description: recordData.description || recordData.diagnosis || recordData.chief_complaint || 'Medical record entry',
        doctor_name: record.doctor?.full_name,
        clinic_name: record.clinic?.clinic_name,
        data: record
      });
    });

    // Add prescriptions to timeline
    history.prescriptions.forEach(prescription => {
      const prescriptionData = prescription as any;
      timelineItems.push({
        id: `prescription-${prescription.id}`,
        type: 'prescriptions',
        date: prescriptionData.prescribed_date || prescription.created_at.split('T')[0],
        title: `Prescription - ${prescription.medication_name}`,
        description: `${prescription.dosage}, ${prescription.frequency}`,
        doctor_name: prescription.doctor?.full_name,
        clinic_name: prescription.clinic?.clinic_name,
        status: prescription.status,
        data: prescription
      });
    });

    // Sort by date (most recent first)
    return timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
