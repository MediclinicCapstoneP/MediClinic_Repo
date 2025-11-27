// Medical History Types for IgabayCare
import { AppointmentWithDetails } from './appointments';

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id?: string;
  clinic_id: string;
  appointment_id?: string;
  visit_date: string;
  chief_complaint: string;
  diagnosis: string;
  treatment_plan: string;
  notes?: string;
  vital_signs?: VitalSigns;
  physical_examination?: string;
  assessment?: string;
  plan?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export interface VitalSigns {
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  appointment_id?: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribed_date: string;
  expiry_date?: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  refills_allowed?: number;
  refills_used?: number;
  pharmacy_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LabResult {
  id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  appointment_id?: string;
  test_name: string;
  test_type: string;
  test_date: string;
  result_date?: string;
  status: 'ordered' | 'in_progress' | 'completed' | 'cancelled';
  results?: LabTestResult[];
  normal_range?: string;
  interpretation?: string;
  critical_values?: boolean;
  doctor_notes?: string;
  lab_facility?: string;
  created_at: string;
  updated_at: string;
}

export interface LabTestResult {
  parameter: string;
  value: string | number;
  unit?: string;
  normal_range?: string;
  flag?: 'normal' | 'high' | 'low' | 'critical';
}

export interface VaccinationRecord {
  id: string;
  patient_id: string;
  doctor_id?: string;
  clinic_id: string;
  vaccine_name: string;
  vaccine_type: string;
  manufacturer?: string;
  lot_number?: string;
  administration_date: string;
  next_dose_date?: string;
  site_of_injection: string;
  route_of_administration: string;
  dose_number?: number;
  total_doses?: number;
  adverse_reactions?: string;
  healthcare_provider: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Allergy {
  id: string;
  patient_id: string;
  allergen: string;
  allergy_type: 'drug' | 'food' | 'environmental' | 'contact' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reaction_symptoms: string[];
  onset_date?: string;
  diagnosis_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InsuranceInfo {
  id: string;
  patient_id: string;
  provider_name: string;
  policy_number: string;
  group_number?: string;
  plan_type: string;
  coverage_start_date: string;
  coverage_end_date?: string;
  is_primary: boolean;
  is_active: boolean;
  copay_amount?: number;
  deductible_amount?: number;
  out_of_pocket_max?: number;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  patient_id: string;
  name: string;
  relationship: string;
  phone_number: string;
  email?: string;
  address?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// Comprehensive Medical History Interface
export interface PatientMedicalHistory {
  patient_id: string;
  appointments: AppointmentWithDetails[];
  medical_records: MedicalRecordWithDetails[];
  prescriptions: PrescriptionWithDetails[];
  lab_results: LabResultWithDetails[];
  vaccinations: VaccinationWithDetails[];
  allergies: Allergy[];
  insurance_info: InsuranceInfo[];
  emergency_contacts: EmergencyContact[];
  summary: HistorySummary;
}

// Extended interfaces with related data
export interface MedicalRecordWithDetails extends MedicalRecord {
  doctor?: {
    id: string;
    full_name: string;
    specialization: string;
  };
  clinic?: {
    id: string;
    clinic_name: string;
  };
  appointment?: {
    id: string;
    appointment_date: string;
    appointment_time: string;
  };
}

export interface PrescriptionWithDetails extends Prescription {
  doctor?: {
    id: string;
    full_name: string;
    specialization: string;
  };
  clinic?: {
    id: string;
    clinic_name: string;
  };
}

export interface LabResultWithDetails extends LabResult {
  doctor?: {
    id: string;
    full_name: string;
    specialization: string;
  };
  clinic?: {
    id: string;
    clinic_name: string;
  };
}

export interface VaccinationWithDetails extends VaccinationRecord {
  doctor?: {
    id: string;
    full_name: string;
    specialization: string;
  };
  clinic?: {
    id: string;
    clinic_name: string;
  };
}

// History Summary for Dashboard
export interface HistorySummary {
  total_appointments: number;
  completed_appointments: number;
  upcoming_appointments: number;
  cancelled_appointments: number;
  total_prescriptions: number;
  active_prescriptions: number;
  total_lab_results: number;
  pending_lab_results: number;
  total_vaccinations: number;
  total_allergies: number;
  active_allergies: number;
  last_visit_date?: string;
  next_appointment_date?: string;
  chronic_conditions: string[];
  current_medications: string[];
}

// Filter options for history display
export interface HistoryFilters {
  date_from?: string;
  date_to?: string;
  record_type?: HistoryRecordType[];
  doctor_id?: string;
  clinic_id?: string;
  status?: string;
  search_term?: string;
}

export type HistoryRecordType = 
  | 'appointments'
  | 'medical_records'
  | 'prescriptions'
  | 'lab_results'
  | 'vaccinations'
  | 'allergies';

// Timeline item for history display
export interface HistoryTimelineItem {
  id: string;
  type: HistoryRecordType;
  date: string;
  title: string;
  description: string;
  doctor_name?: string;
  clinic_name?: string;
  status?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  data: MedicalRecord | Prescription | LabResult | VaccinationRecord | AppointmentWithDetails;
}

// Export constants for UI
export const HISTORY_RECORD_TYPES: Record<HistoryRecordType, string> = {
  appointments: 'Appointments',
  medical_records: 'Medical Records',
  prescriptions: 'Prescriptions',
  lab_results: 'Lab Results',
  vaccinations: 'Vaccinations',
  allergies: 'Allergies'
};

export const HISTORY_RECORD_COLORS: Record<HistoryRecordType, string> = {
  appointments: 'bg-blue-100 text-blue-800',
  medical_records: 'bg-green-100 text-green-800',
  prescriptions: 'bg-purple-100 text-purple-800',
  lab_results: 'bg-yellow-100 text-yellow-800',
  vaccinations: 'bg-cyan-100 text-cyan-800',
  allergies: 'bg-red-100 text-red-800'
};

export const ALLERGY_SEVERITY_COLORS: Record<string, string> = {
  mild: 'bg-yellow-100 text-yellow-800',
  moderate: 'bg-orange-100 text-orange-800',
  severe: 'bg-red-100 text-red-800',
  life_threatening: 'bg-red-600 text-white'
};

export const PRESCRIPTION_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800'
};

export const LAB_RESULT_STATUS_COLORS: Record<string, string> = {
  ordered: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};