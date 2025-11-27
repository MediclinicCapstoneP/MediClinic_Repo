import { supabase } from '../supabaseClient';
import {
  PatientMedicalHistory,
  MedicalRecordWithDetails,
  PrescriptionWithDetails,
  LabResultWithDetails,
  VaccinationWithDetails,
  Allergy,
  InsuranceInfo,
  EmergencyContact,
  HistorySummary,
  HistoryFilters,
  HistoryTimelineItem,
  HistoryRecordType
} from '../types/history';
import { AppointmentWithDetails } from '../types/appointments';

export class MedicalHistoryService {
  /**
   * Helper method to check if a table exists and handle gracefully
   */
  private static async safeQuery<T>(
    tableName: string,
    queryFn: () => Promise<{ data: T[] | null; error: any }>,
    fallbackData: T[] = []
  ): Promise<{ success: boolean; data: T[]; error?: string }> {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        // Handle table not found
        if (error.code === '42P01') {
          console.warn(`⚠️ Table ${tableName} not found, returning empty data`);
          return { success: true, data: fallbackData };
        }
        
        // Handle column not found
        if (error.code === '42703') {
          console.warn(`⚠️ Column issue in ${tableName}, trying fallback query`);
          return { success: true, data: fallbackData };
        }
        
        // Handle relationship issues
        if (error.code === 'PGRST200' || error.message?.includes('relationship')) {
          console.warn(`⚠️ Relationship issue in ${tableName}, trying simplified query`);
          return { success: true, data: fallbackData };
        }
        
        console.error(`❌ Error querying ${tableName}:`, error);
        return { success: false, data: fallbackData, error: error.message };
      }
      
      return { success: true, data: data || fallbackData };
    } catch (error) {
      console.error(`❌ Unexpected error querying ${tableName}:`, error);
      return { success: false, data: fallbackData, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get comprehensive patient medical history
   */
  static async getPatientMedicalHistory(
    patientId: string,
    filters?: HistoryFilters
  ): Promise<{ success: boolean; data?: PatientMedicalHistory; error?: string }> {
    try {
      console.log('🔍 Fetching comprehensive medical history for patient:', patientId);

      // Fetch all data in parallel
      const [
        appointmentsResult,
        medicalRecordsResult,
        prescriptionsResult,
        labResultsResult,
        vaccinationsResult,
        allergiesResult,
        insuranceResult,
        emergencyContactsResult
      ] = await Promise.all([
        this.getAppointmentHistory(patientId, filters),
        this.getMedicalRecords(patientId, filters),
        this.getPrescriptions(patientId, filters),
        this.getLabResults(patientId, filters),
        this.getVaccinations(patientId, filters),
        this.getAllergies(patientId),
        this.getInsuranceInfo(patientId),
        this.getEmergencyContacts(patientId)
      ]);

      // Check for any critical errors
      const hasErrors = [
        appointmentsResult,
        medicalRecordsResult,
        prescriptionsResult,
        labResultsResult,
        vaccinationsResult,
        allergiesResult,
        insuranceResult,
        emergencyContactsResult
      ].some(result => !result.success);

      if (hasErrors) {
        console.warn('⚠️ Some data could not be fetched, continuing with available data');
      }

      const appointments = appointmentsResult.success ? appointmentsResult.data || [] : [];
      const medicalRecords = medicalRecordsResult.success ? medicalRecordsResult.data || [] : [];
      const prescriptions = prescriptionsResult.success ? prescriptionsResult.data || [] : [];
      const labResults = labResultsResult.success ? labResultsResult.data || [] : [];
      const vaccinations = vaccinationsResult.success ? vaccinationsResult.data || [] : [];
      const allergies = allergiesResult.success ? allergiesResult.data || [] : [];
      const insurance = insuranceResult.success ? insuranceResult.data || [] : [];
      const emergencyContacts = emergencyContactsResult.success ? emergencyContactsResult.data || [] : [];

      // Generate summary
      const summary = this.generateHistorySummary(
        appointments,
        medicalRecords,
        prescriptions,
        labResults,
        vaccinations,
        allergies
      );

      const medicalHistory: PatientMedicalHistory = {
        patient_id: patientId,
        appointments,
        medical_records: medicalRecords,
        prescriptions,
        lab_results: labResults,
        vaccinations,
        allergies,
        insurance_info: insurance,
        emergency_contacts: emergencyContacts,
        summary
      };

      console.log(`✅ Successfully fetched medical history for patient. Summary:`, {
        appointments: appointments.length,
        medicalRecords: medicalRecords.length,
        prescriptions: prescriptions.length,
        labResults: labResults.length,
        vaccinations: vaccinations.length,
        allergies: allergies.length
      });

      return { success: true, data: medicalHistory };
    } catch (error) {
      console.error('❌ Error fetching patient medical history:', error);
      return { success: false, error: 'Failed to fetch medical history' };
    }
  }

  /**
   * Get appointment history
   */
  static async getAppointmentHistory(
    patientId: string,
    filters?: HistoryFilters
  ): Promise<{ success: boolean; data?: AppointmentWithDetails[]; error?: string }> {
    try {
      let query = supabase
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
            email
          ),
          doctor:doctors(
            id,
            full_name,
            specialization,
            email
          )
        `)
        .eq('patient_id', patientId);

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
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      query = query.order('appointment_date', { ascending: false })
                   .order('appointment_time', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching appointments:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Error fetching appointment history:', error);
      return { success: false, error: 'Failed to fetch appointment history' };
    }
  }

  /**
   * Get medical records
   */
  static async getMedicalRecords(
    patientId: string,
    filters?: HistoryFilters
  ): Promise<{ success: boolean; data?: MedicalRecordWithDetails[]; error?: string }> {
    const result = await this.safeQuery<MedicalRecordWithDetails>(
      'medical_records',
      async () => {
        try {
          // Try with appointment relationship first
          let query = supabase
            .from('medical_records')
            .select(`
              *,
              doctor:doctors(
                id,
                full_name,
                specialization
              ),
              clinic:clinics(
                id,
                clinic_name
              ),
              appointment:appointments(
                id,
                appointment_date,
                appointment_time
              )
            `)
            .eq('patient_id', patientId);

          // Apply filters
          if (filters?.date_from) {
            query = query.gte('visit_date', filters.date_from);
          }
          if (filters?.date_to) {
            query = query.lte('visit_date', filters.date_to);
          }
          if (filters?.doctor_id) {
            query = query.eq('doctor_id', filters.doctor_id);
          }
          if (filters?.clinic_id) {
            query = query.eq('clinic_id', filters.clinic_id);
          }

          return await query.order('visit_date', { ascending: false });
        } catch {
          // Fallback without appointment relationship
          let query = supabase
            .from('medical_records')
            .select(`
              *,
              doctor:doctors(
                id,
                full_name,
                specialization
              ),
              clinic:clinics(
                id,
                clinic_name
              )
            `)
            .eq('patient_id', patientId);

          // Apply filters
          if (filters?.date_from) {
            query = query.gte('visit_date', filters.date_from);
          }
          if (filters?.date_to) {
            query = query.lte('visit_date', filters.date_to);
          }
          if (filters?.doctor_id) {
            query = query.eq('doctor_id', filters.doctor_id);
          }
          if (filters?.clinic_id) {
            query = query.eq('clinic_id', filters.clinic_id);
          }

          return await query.order('created_at', { ascending: false });
        }
      }
    );

    return {
      success: result.success,
      data: result.data,
      error: result.error
    };
  }

  /**
   * Get prescriptions
   */
  static async getPrescriptions(
    patientId: string,
    filters?: HistoryFilters
  ): Promise<{ success: boolean; data?: PrescriptionWithDetails[]; error?: string }> {
    const result = await this.safeQuery(
      'prescriptions',
      async () => {
        let query = supabase
          .from('prescriptions')
          .select(`
            *,
            prescription_medications(*),
            appointments(
              appointment_date,
              appointment_time,
              clinics(clinic_name)
            )
          `)
          .eq('patient_id', patientId);

        // Apply filters
        if (filters?.date_from) {
          query = query.gte('prescribed_date', filters.date_from);
        }
        if (filters?.date_to) {
          query = query.lte('prescribed_date', filters.date_to);
        }
        if (filters?.clinic_id) {
          query = query.eq('clinic_id', filters.clinic_id);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }

        query = query.order('prescribed_date', { ascending: false });

        return await query;
      }
    );

    return {
      success: result.success,
      data: result.data,
      error: result.error
    };
  }
  static async getLabResults(
    patientId: string,
    filters?: HistoryFilters
  ): Promise<{ success: boolean; data?: LabResultWithDetails[]; error?: string }> {
    try {
      let query = supabase
        .from('lab_results')
        .select(`
          *,
          doctor:doctors(
            id,
            full_name,
            specialization
          ),
          clinic:clinics(
            id,
            clinic_name
          )
        `)
        .eq('patient_id', patientId);

      // Apply filters
      if (filters?.date_from) {
        query = query.gte('test_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('test_date', filters.date_to);
      }
      if (filters?.doctor_id) {
        query = query.eq('doctor_id', filters.doctor_id);
      }
      if (filters?.clinic_id) {
        query = query.eq('clinic_id', filters.clinic_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      query = query.order('test_date', { ascending: false });

      const { data, error } = await query;

      if (error && error.code !== '42P01') { // Ignore table not found error
        console.error('❌ Error fetching lab results:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Error fetching lab results:', error);
      return { success: false, error: 'Failed to fetch lab results' };
    }
  }

  /**
   * Get vaccinations
   */
  static async getVaccinations(
    patientId: string,
    filters?: HistoryFilters
  ): Promise<{ success: boolean; data?: VaccinationWithDetails[]; error?: string }> {
    try {
      let query = supabase
        .from('vaccination_records')
        .select(`
          *,
          doctor:doctors(
            id,
            full_name,
            specialization
          ),
          clinic:clinics(
            id,
            clinic_name
          )
        `)
        .eq('patient_id', patientId);

      // Apply filters
      if (filters?.date_from) {
        query = query.gte('administration_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('administration_date', filters.date_to);
      }
      if (filters?.doctor_id) {
        query = query.eq('doctor_id', filters.doctor_id);
      }
      if (filters?.clinic_id) {
        query = query.eq('clinic_id', filters.clinic_id);
      }

      query = query.order('administration_date', { ascending: false });

      const { data, error } = await query;

      if (error && error.code !== '42P01') { // Ignore table not found error
        console.error('❌ Error fetching vaccinations:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Error fetching vaccinations:', error);
      return { success: false, error: 'Failed to fetch vaccinations' };
    }
  }

  /**
   * Get allergies
   */
  static async getAllergies(
    patientId: string
  ): Promise<{ success: boolean; data?: Allergy[]; error?: string }> {
    const result = await this.safeQuery<Allergy>(
      'allergies',
      () => supabase
        .from('allergies')
        .select('*')
        .eq('patient_id', patientId)
        .order('is_active', { ascending: false })
        .order('severity', { ascending: false })
    );

    return {
      success: result.success,
      data: result.data,
      error: result.error
    };
  }

  /**
   * Get insurance info
   */
  static async getInsuranceInfo(
    patientId: string
  ): Promise<{ success: boolean; data?: InsuranceInfo[]; error?: string }> {
    // Try with is_primary ordering first
    const result = await this.safeQuery<InsuranceInfo>(
      'insurance_info',
      async () => {
        try {
          return await supabase
            .from('insurance_info')
            .select('*')
            .eq('patient_id', patientId)
            .order('is_primary', { ascending: false })
            .order('is_active', { ascending: false });
        } catch {
          // Fallback without is_primary ordering
          return await supabase
            .from('insurance_info')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });
        }
      }
    );

    return {
      success: result.success,
      data: result.data,
      error: result.error
    };
  }

  /**
   * Get emergency contacts
   */
  static async getEmergencyContacts(
    patientId: string
  ): Promise<{ success: boolean; data?: EmergencyContact[]; error?: string }> {
    const result = await this.safeQuery<EmergencyContact>(
      'emergency_contacts',
      () => supabase
        .from('emergency_contacts')
        .select('*')
        .eq('patient_id', patientId)
        .order('is_primary', { ascending: false })
    );

    return {
      success: result.success,
      data: result.data,
      error: result.error
    };
  }

  /**
   * Generate history timeline items for chronological display
   */
  static generateHistoryTimeline(
    medicalHistory: PatientMedicalHistory,
    filters?: HistoryFilters
  ): HistoryTimelineItem[] {
    const timeline: HistoryTimelineItem[] = [];

    // Add appointments
    if (!filters?.record_type || filters.record_type.includes('appointments')) {
      medicalHistory.appointments.forEach(appointment => {
        timeline.push({
          id: `appointment-${appointment.id}`,
          type: 'appointments',
          date: appointment.appointment_date,
          title: `Appointment - ${appointment.appointment_type}`,
          description: `${appointment.status} appointment${appointment.doctor_name ? ` with ${appointment.doctor_name}` : ''}`,
          doctor_name: appointment.doctor_name,
          clinic_name: appointment.clinic?.clinic_name,
          status: appointment.status,
          data: appointment
        });
      });
    }

    // Add medical records
    if (!filters?.record_type || filters.record_type.includes('medical_records')) {
      medicalHistory.medical_records.forEach(record => {
        timeline.push({
          id: `record-${record.id}`,
          type: 'medical_records',
          date: record.visit_date,
          title: `Medical Record - ${record.chief_complaint}`,
          description: record.diagnosis,
          doctor_name: record.doctor?.full_name,
          clinic_name: record.clinic?.clinic_name,
          data: record
        });
      });
    }

    // Add prescriptions
    if (!filters?.record_type || filters.record_type.includes('prescriptions')) {
      medicalHistory.prescriptions.forEach(prescription => {
        timeline.push({
          id: `prescription-${prescription.id}`,
          type: 'prescriptions',
          date: prescription.prescribed_date,
          title: `Prescription - ${prescription.medication_name}`,
          description: `${prescription.dosage}, ${prescription.frequency}`,
          doctor_name: prescription.doctor?.full_name,
          clinic_name: prescription.clinic?.clinic_name,
          status: prescription.status,
          data: prescription
        });
      });
    }

    // Add lab results
    if (!filters?.record_type || filters.record_type.includes('lab_results')) {
      medicalHistory.lab_results.forEach(result => {
        timeline.push({
          id: `lab-${result.id}`,
          type: 'lab_results',
          date: result.test_date,
          title: `Lab Test - ${result.test_name}`,
          description: result.test_type,
          doctor_name: result.doctor?.full_name,
          clinic_name: result.clinic?.clinic_name,
          status: result.status,
          priority: result.critical_values ? 'urgent' : 'normal',
          data: result
        });
      });
    }

    // Add vaccinations
    if (!filters?.record_type || filters.record_type.includes('vaccinations')) {
      medicalHistory.vaccinations.forEach(vaccination => {
        timeline.push({
          id: `vaccination-${vaccination.id}`,
          type: 'vaccinations',
          date: vaccination.administration_date,
          title: `Vaccination - ${vaccination.vaccine_name}`,
          description: `${vaccination.vaccine_type} administered ${vaccination.site_of_injection}`,
          doctor_name: vaccination.doctor?.full_name,
          clinic_name: vaccination.clinic?.clinic_name,
          data: vaccination
        });
      });
    }

    // Sort by date (most recent first)
    return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Generate summary statistics
   */
  private static generateHistorySummary(
    appointments: AppointmentWithDetails[],
    medicalRecords: MedicalRecordWithDetails[],
    prescriptions: PrescriptionWithDetails[],
    labResults: LabResultWithDetails[],
    vaccinations: VaccinationWithDetails[],
    allergies: Allergy[]
  ): HistorySummary {
    const today = new Date().toISOString().split('T')[0];

    // Calculate appointment stats
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const upcomingAppointments = appointments.filter(a => 
      a.appointment_date >= today && ['scheduled', 'confirmed'].includes(a.status)
    ).length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

    // Calculate prescription stats
    const activePrescriptions = prescriptions.filter(p => p.status === 'active').length;

    // Calculate lab result stats
    const pendingLabResults = labResults.filter(l => l.status === 'pending').length;

    // Calculate allergy stats
    const activeAllergies = allergies.filter(a => a.is_active).length;

    // Find dates
    const lastVisitDate = appointments
      .filter(a => a.status === 'completed')
      .map(a => a.appointment_date)
      .sort()
      .pop();

    const nextAppointmentDate = appointments
      .filter(a => a.appointment_date >= today && ['scheduled', 'confirmed'].includes(a.status))
      .map(a => a.appointment_date)
      .sort()
      .shift();

    // Extract chronic conditions and medications
    const chronicConditions = [...new Set(
      medicalRecords
        .filter(r => r.diagnosis && r.diagnosis.toLowerCase().includes('chronic'))
        .map(r => r.diagnosis)
    )];

    const currentMedications = prescriptions
      .filter(p => p.status === 'active')
      .map(p => p.medication_name);

    return {
      total_appointments: appointments.length,
      completed_appointments: completedAppointments,
      upcoming_appointments: upcomingAppointments,
      cancelled_appointments: cancelledAppointments,
      total_prescriptions: prescriptions.length,
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
  }

  /**
   * Search across all medical history records
   */
  static searchMedicalHistory(
    medicalHistory: PatientMedicalHistory,
    searchTerm: string
  ): HistoryTimelineItem[] {
    const timeline = this.generateHistoryTimeline(medicalHistory);
    const lowerSearchTerm = searchTerm.toLowerCase();

    return timeline.filter(item => 
      item.title.toLowerCase().includes(lowerSearchTerm) ||
      item.description.toLowerCase().includes(lowerSearchTerm) ||
      item.doctor_name?.toLowerCase().includes(lowerSearchTerm) ||
      item.clinic_name?.toLowerCase().includes(lowerSearchTerm)
    );
  }
}