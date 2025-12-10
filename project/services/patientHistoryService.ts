import {
  supabase,
  AppointmentWithDetails,
  MedicalRecordWithRelations,
  LabResultRecord,
  VaccinationRecord,
  AllergyRecord,
  InsuranceInfoRecord,
  EmergencyContactRecord,
  PatientMedicalHistory,
  HistorySummary,
  HistoryTimelineItem,
  HistoryTimelineItemType,
} from '@/lib/supabase';
import { appointmentService } from './appointmentService';
import { patientPrescriptionService, PatientPrescriptionRecord } from './patientPrescriptionService';
import type { PostgrestError } from '@supabase/supabase-js';

type HistoryStatusFilter = 'all' | 'upcoming' | 'completed' | 'cancelled' | 'in_progress';

export interface HistoryDateRange {
  start?: string;
  end?: string;
}

export interface HistoryFilters {
  status?: HistoryStatusFilter;
  dateRange?: HistoryDateRange;
  includePrivateRecords?: boolean;
}

interface PatientHistoryResponse {
  success: boolean;
  history?: PatientMedicalHistory;
  error?: string;
}

const UPCOMING_APPOINTMENT_STATUSES = new Set<AppointmentWithDetails['status']>([
  'scheduled',
  'confirmed',
  'payment_confirmed',
  'pending_payment',
  'in_progress',
]);

const isTableMissingError = (error?: PostgrestError | null) => error?.code === '42P01';

const normalizeDate = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

class PatientHistoryService {
  async getPatientHistory(patientId: string, filters: HistoryFilters = {}): Promise<PatientHistoryResponse> {
    if (!patientId) {
      return {
        success: false,
        error: 'Patient ID is required to load medical history.',
      };
    }

    try {
      const { dateRange, status, includePrivateRecords } = filters;

      const [appointmentsResult, prescriptionsResult, medicalRecords, labResults, vaccinations, allergies, insuranceInfo, emergencyContacts] =
        await Promise.all([
          this.fetchAppointments(patientId, status, dateRange),
          this.fetchPrescriptions(patientId),
          this.fetchMedicalRecords(patientId, dateRange, includePrivateRecords),
          this.fetchLabResults(patientId, dateRange),
          this.fetchVaccinations(patientId, dateRange),
          this.fetchAllergies(patientId),
          this.fetchInsuranceInfo(patientId),
          this.fetchEmergencyContacts(patientId),
        ]);

      const prescriptions = prescriptionsResult ?? [];
      const appointments = appointmentsResult ?? [];

      const summary = this.generateSummary({
        appointments,
        medicalRecords,
        prescriptions,
        labResults,
        vaccinations,
        allergies,
      });

      const timeline = this.generateTimeline({
        appointments,
        medicalRecords,
        prescriptions,
        labResults,
        vaccinations,
      });

      const history: PatientMedicalHistory = {
        patient_id: patientId,
        summary,
        appointments,
        medical_records: medicalRecords,
        prescriptions,
        lab_results: labResults,
        vaccinations,
        allergies,
        insurance_info: insuranceInfo,
        emergency_contacts: emergencyContacts,
        timeline,
      };

      return { success: true, history };
    } catch (error) {
      console.error('[patientHistoryService] Failed to load patient history:', error);
      return {
        success: false,
        error: 'Failed to load medical history. Please try again later.',
      };
    }
  }

  private async fetchAppointments(
    patientId: string,
    status?: HistoryStatusFilter,
    dateRange?: HistoryDateRange,
  ): Promise<AppointmentWithDetails[] | undefined> {
    const filterStatuses = this.resolveAppointmentStatuses(status);

    const response = await appointmentService.getAppointments({
      patient_id: patientId,
      status: filterStatuses,
      date_from: dateRange?.start,
      date_to: dateRange?.end,
      limit: 200,
    });

    if (!response.success) {
      console.warn('[patientHistoryService] Unable to load appointments:', response.error);
      return [];
    }

    return response.appointments ?? [];
  }

  private resolveAppointmentStatuses(status?: HistoryStatusFilter) {
    if (!status || status === 'all') return undefined;

    if (status === 'upcoming') {
      return Array.from(UPCOMING_APPOINTMENT_STATUSES);
    }

    if (status === 'in_progress') {
      return ['in_progress'] as AppointmentWithDetails['status'][];
    }

    return [status] as AppointmentWithDetails['status'][];
  }

  private async fetchPrescriptions(patientId: string): Promise<PatientPrescriptionRecord[] | undefined> {
    const response = await patientPrescriptionService.getPrescriptions({
      patientId,
      limit: 200,
    });

    if (!response.success) {
      console.warn('[patientHistoryService] Unable to load prescriptions:', response.error);
      return [];
    }

    return response.prescriptions ?? [];
  }

  private async fetchMedicalRecords(
    patientId: string,
    dateRange?: HistoryDateRange,
    includePrivate?: boolean,
  ): Promise<MedicalRecordWithRelations[]> {
    try {
      let query = supabase
        .from('medical_records')
        .select(
          `
          *,
          doctor:doctor_id (
            id,
            full_name,
            specialization,
            email,
            phone,
            profile_picture_url
          ),
          clinic:clinic_id (
            id,
            clinic_name,
            address,
            city,
            state
          ),
          appointment:appointment_id (
            id,
            appointment_date,
            appointment_time,
            appointment_type
          )
        `,
        )
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (!includePrivate) {
        query = query.or('is_private.is.null,is_private.eq.false');
      }

      if (dateRange?.start) {
        query = query.gte('visit_date', dateRange.start);
      }

      if (dateRange?.end) {
        query = query.lte('visit_date', dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        if (isTableMissingError(error)) {
          console.warn('[patientHistoryService] medical_records table not found.');
          return [];
        }
        console.error('[patientHistoryService] Error fetching medical records:', error);
        return [];
      }

      return (data || []).map((record: any) => ({
        ...record,
        doctor: record.doctor ?? null,
        clinic: record.clinic ?? null,
        appointment: record.appointment ?? null,
      })) as MedicalRecordWithRelations[];
    } catch (error) {
      console.error('[patientHistoryService] Unexpected error fetching medical records:', error);
      return [];
    }
  }

  private async fetchLabResults(patientId: string, dateRange?: HistoryDateRange): Promise<LabResultRecord[]> {
    try {
      let query = supabase
        .from('lab_results')
        .select(
          `
          *,
          doctor:doctor_id (
            id,
            full_name,
            specialization
          ),
          clinic:clinic_id (
            id,
            clinic_name
          )
        `,
        )
        .eq('patient_id', patientId)
        .order('result_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (dateRange?.start) {
        query = query.gte('result_date', dateRange.start);
      }

      if (dateRange?.end) {
        query = query.lte('result_date', dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        if (isTableMissingError(error)) {
          console.warn('[patientHistoryService] lab_results table not found.');
          return [];
        }
        console.error('[patientHistoryService] Error fetching lab results:', error);
        return [];
      }

      return (data || []).map((result: any) => ({
        ...result,
        doctor: result.doctor ?? null,
        clinic: result.clinic ?? null,
      })) as LabResultRecord[];
    } catch (error) {
      console.error('[patientHistoryService] Unexpected error fetching lab results:', error);
      return [];
    }
  }

  private async fetchVaccinations(patientId: string, dateRange?: HistoryDateRange): Promise<VaccinationRecord[]> {
    try {
      let query = supabase
        .from('vaccination_records')
        .select(
          `
          *,
          clinic:clinic_id (
            id,
            clinic_name
          ),
          doctor:doctor_id (
            id,
            full_name,
            specialization
          )
        `,
        )
        .eq('patient_id', patientId)
        .order('administered_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (dateRange?.start) {
        query = query.gte('administered_at', dateRange.start);
      }

      if (dateRange?.end) {
        query = query.lte('administered_at', dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        if (isTableMissingError(error)) {
          console.warn('[patientHistoryService] vaccination_records table not found.');
          return [];
        }
        console.error('[patientHistoryService] Error fetching vaccinations:', error);
        return [];
      }

      return (data || []).map((record: any) => ({
        ...record,
        clinic: record.clinic ?? null,
        doctor: record.doctor ?? null,
      })) as VaccinationRecord[];
    } catch (error) {
      console.error('[patientHistoryService] Unexpected error fetching vaccinations:', error);
      return [];
    }
  }

  private async fetchAllergies(patientId: string): Promise<AllergyRecord[]> {
    try {
      const { data, error } = await supabase
        .from('allergies')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        if (isTableMissingError(error)) {
          console.warn('[patientHistoryService] allergies table not found.');
          return [];
        }
        console.error('[patientHistoryService] Error fetching allergies:', error);
        return [];
      }

      return (data || []) as AllergyRecord[];
    } catch (error) {
      console.error('[patientHistoryService] Unexpected error fetching allergies:', error);
      return [];
    }
  }

  private async fetchInsuranceInfo(patientId: string): Promise<InsuranceInfoRecord[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_info')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        if (isTableMissingError(error)) {
          console.warn('[patientHistoryService] insurance_info table not found.');
          return [];
        }
        console.error('[patientHistoryService] Error fetching insurance info:', error);
        return [];
      }

      return (data || []) as InsuranceInfoRecord[];
    } catch (error) {
      console.error('[patientHistoryService] Unexpected error fetching insurance info:', error);
      return [];
    }
  }

  private async fetchEmergencyContacts(patientId: string): Promise<EmergencyContactRecord[]> {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('patient_id', patientId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        if (isTableMissingError(error)) {
          console.warn('[patientHistoryService] emergency_contacts table not found.');
          return [];
        }
        console.error('[patientHistoryService] Error fetching emergency contacts:', error);
        return [];
      }

      return (data || []) as EmergencyContactRecord[];
    } catch (error) {
      console.error('[patientHistoryService] Unexpected error fetching emergency contacts:', error);
      return [];
    }
  }

  private generateSummary(data: {
    appointments: AppointmentWithDetails[];
    medicalRecords: MedicalRecordWithRelations[];
    prescriptions: PatientPrescriptionRecord[];
    labResults: LabResultRecord[];
    vaccinations: VaccinationRecord[];
    allergies: AllergyRecord[];
  }): HistorySummary {
    const { appointments, medicalRecords, prescriptions, labResults, vaccinations, allergies } = data;

    const completedAppointments = appointments.filter((apt) => apt.status === 'completed');
    const upcomingAppointments = appointments.filter((apt) => UPCOMING_APPOINTMENT_STATUSES.has(apt.status));
    const cancelledAppointments = appointments.filter((apt) => apt.status === 'cancelled');

    const pendingLabResults = labResults.filter((result) =>
      typeof result.status === 'string' ? /pending|processing/i.test(result.status) : false,
    );

    const activeAllergies = allergies.filter((allergy) => allergy.is_active ?? true);
    const activePrescriptions = prescriptions.filter((prescription) => prescription.status === 'active');

    const chronicConditions = Array.from(
      new Set(
        medicalRecords
          .map((record) => record.diagnosis)
          .filter((diagnosis): diagnosis is string => Boolean(diagnosis && /chronic/i.test(diagnosis))),
      ),
    );

    const currentMedications = Array.from(
      new Set(
        activePrescriptions
          .map((prescription) => prescription.medication_name)
          .filter((name): name is string => Boolean(name)),
      ),
    );

    const lastVisitDate = normalizeDate(
      completedAppointments.length > 0
        ? completedAppointments
            .slice()
            .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0]
            ?.appointment_date
        : undefined,
    );

    const nextAppointmentDate = normalizeDate(
      upcomingAppointments.length > 0
        ? upcomingAppointments
            .slice()
            .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())[0]
            ?.appointment_date
        : undefined,
    );

    return {
      total_appointments: appointments.length,
      completed_appointments: completedAppointments.length,
      upcoming_appointments: upcomingAppointments.length,
      cancelled_appointments: cancelledAppointments.length,
      total_medical_records: medicalRecords.length,
      total_prescriptions: prescriptions.length,
      active_prescriptions: activePrescriptions.length,
      total_lab_results: labResults.length,
      pending_lab_results: pendingLabResults.length,
      total_vaccinations: vaccinations.length,
      total_allergies: allergies.length,
      active_allergies: activeAllergies.length,
      last_visit_date: lastVisitDate ?? null,
      next_appointment_date: nextAppointmentDate ?? null,
      chronic_conditions: chronicConditions,
      current_medications: currentMedications,
    };
  }

  private generateTimeline(data: {
    appointments: AppointmentWithDetails[];
    medicalRecords: MedicalRecordWithRelations[];
    prescriptions: PatientPrescriptionRecord[];
    labResults: LabResultRecord[];
    vaccinations: VaccinationRecord[];
  }): HistoryTimelineItem[] {
    const items: HistoryTimelineItem[] = [];

    data.appointments.forEach((appointment) => {
      items.push({
        id: `appointment-${appointment.id}`,
        type: 'appointments',
        date: appointment.appointment_date,
        title: `Appointment – ${appointment.appointment_type}`,
        description: appointment.clinic?.clinic_name ?? undefined,
        status: appointment.status,
        metadata: {
          time: appointment.appointment_time,
          doctor: appointment.doctor?.full_name,
          clinic: appointment.clinic?.clinic_name,
          appointment_type: appointment.appointment_type,
        },
      });
    });

    data.medicalRecords.forEach((record) => {
      items.push({
        id: `record-${record.id}`,
        type: 'medical_records',
        date: record.visit_date ?? record.created_at,
        title: record.title ?? `Medical Record – ${record.record_type}`,
        description: record.description ?? record.diagnosis ?? undefined,
        status: record.record_type,
        metadata: {
          doctor: record.doctor?.full_name,
          clinic: record.clinic?.clinic_name,
          diagnosis: record.diagnosis,
          treatment: record.treatment,
        },
      });
    });

    data.prescriptions.forEach((prescription) => {
      items.push({
        id: `prescription-${prescription.id}`,
        type: 'prescriptions',
        date: prescription.prescribed_at,
        title: `Prescription – ${prescription.medication_name}`,
        description: prescription.instructions ?? undefined,
        status: prescription.status,
        metadata: {
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          duration: prescription.duration,
          doctor: prescription.doctor?.full_name,
          clinic: prescription.appointment?.clinic?.clinic_name,
        },
      });
    });

    data.labResults.forEach((result) => {
      items.push({
        id: `lab-${result.id}`,
        type: 'lab_results',
        date: result.result_date ?? result.created_at,
        title: `Lab Result – ${result.test_type ?? 'Laboratory Test'}`,
        description: result.result_summary ?? undefined,
        status: result.status ?? undefined,
        metadata: {
          doctor: (result as any).doctor?.full_name,
          clinic: (result as any).clinic?.clinic_name,
          notes: result.notes,
        },
      });
    });

    data.vaccinations.forEach((vaccination) => {
      items.push({
        id: `vaccination-${vaccination.id}`,
        type: 'vaccinations',
        date: vaccination.administered_at ?? vaccination.created_at,
        title: `Vaccination – ${vaccination.vaccine_name ?? 'Vaccine'}`,
        description: vaccination.notes ?? undefined,
        status: vaccination.dose_number ? `Dose ${vaccination.dose_number}` : undefined,
        metadata: {
          clinic: vaccination.clinic?.clinic_name,
          doctor: vaccination.doctor?.full_name,
          site: vaccination.site,
          next_dose_due: vaccination.next_dose_due,
        },
      });
    });

    return items
      .filter((item) => Boolean(item.date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const patientHistoryService = new PatientHistoryService();
