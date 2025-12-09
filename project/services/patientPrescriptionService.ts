import { supabase } from '../lib/supabase';

interface RawPatientPrescriptionRecord {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  appointment_id: string | null;
  medication_name: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
  refills?: number | null;
  status: string;
  prescribed_at: string;
  doctor?: RawDoctorRelation | RawDoctorRelation[] | null;
  appointment?: RawAppointmentRelation | RawAppointmentRelation[] | null;
}

interface RawDoctorRelation {
  id: string;
  full_name: string;
  specialization?: string | null;
  clinic?: RawClinicRelation | RawClinicRelation[] | null;
}

interface RawAppointmentRelation {
  id: string;
  appointment_date: string;
  appointment_time: string;
  clinic?: RawClinicRelation | RawClinicRelation[] | null;
}

interface RawClinicRelation {
  id: string;
  clinic_name: string;
}

export interface PatientPrescriptionRecord {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  appointment_id: string | null;
  medication_name: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
  refills?: number | null;
  status: string;
  prescribed_at: string;
  doctor?: PatientPrescriptionDoctor | null;
  appointment?: PatientPrescriptionAppointment | null;
}

export interface PatientPrescriptionDoctor {
  id: string;
  full_name: string;
  specialization?: string | null;
  clinic?: PatientPrescriptionClinic | null;
}

export interface PatientPrescriptionAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  clinic?: PatientPrescriptionClinic | null;
}

export interface PatientPrescriptionClinic {
  id: string;
  clinic_name: string;
}

interface GetPatientPrescriptionsParams {
  patientId: string;
  limit?: number;
}

class PatientPrescriptionService {
  async getPrescriptions({
    patientId,
    limit = 100,
  }: GetPatientPrescriptionsParams): Promise<{
    success: boolean;
    prescriptions?: PatientPrescriptionRecord[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(
          `
            id,
            patient_id,
            doctor_id,
            appointment_id,
            medication_name,
            dosage,
            frequency,
            duration,
            instructions,
            refills,
            status,
            prescribed_at,
            doctor:doctors (
              id,
              full_name,
              specialization,
              clinic:clinics (
                id,
                clinic_name
              )
            ),
            appointment:appointments (
              id,
              appointment_date,
              appointment_time,
              clinic:clinics (
                id,
                clinic_name
              )
            )
          `
        )
        .eq('patient_id', patientId)
        .order('prescribed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching patient prescriptions:', error);
        throw error;
      }

      const prescriptions = (data || []).map((item) => normalizePrescriptionRecord(item as RawPatientPrescriptionRecord));

      return {
        success: true,
        prescriptions,
      };
    } catch (err: any) {
      console.error('PatientPrescriptionService.getPrescriptions error:', err);
      return {
        success: false,
        error: err?.message || 'Failed to fetch prescriptions',
      };
    }
  }
}

export const patientPrescriptionService = new PatientPrescriptionService();

function normalizePrescriptionRecord(record: RawPatientPrescriptionRecord): PatientPrescriptionRecord {
  const rawDoctor = unwrapRelation(record.doctor);
  const rawAppointment = unwrapRelation(record.appointment);

  return {
    id: record.id,
    patient_id: record.patient_id,
    doctor_id: record.doctor_id,
    appointment_id: record.appointment_id,
    medication_name: record.medication_name,
    dosage: record.dosage ?? null,
    frequency: record.frequency ?? null,
    duration: record.duration ?? null,
    instructions: record.instructions ?? null,
    refills: record.refills ?? null,
    status: record.status,
    prescribed_at: record.prescribed_at,
    doctor: normalizeDoctorRelation(rawDoctor),
    appointment: normalizeAppointmentRelation(rawAppointment),
  };
}

function normalizeDoctorRelation(raw?: RawDoctorRelation | null): PatientPrescriptionDoctor | null {
  if (!raw) return null;

  return {
    id: raw.id,
    full_name: raw.full_name,
    specialization: raw.specialization ?? null,
    clinic: normalizeClinicRelation(unwrapRelation(raw.clinic)),
  };
}

function normalizeAppointmentRelation(raw?: RawAppointmentRelation | null): PatientPrescriptionAppointment | null {
  if (!raw) return null;

  return {
    id: raw.id,
    appointment_date: raw.appointment_date,
    appointment_time: raw.appointment_time,
    clinic: normalizeClinicRelation(unwrapRelation(raw.clinic)),
  };
}

function normalizeClinicRelation(raw?: RawClinicRelation | null): PatientPrescriptionClinic | null {
  if (!raw) return null;

  return {
    id: raw.id,
    clinic_name: raw.clinic_name,
  };
}

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}
