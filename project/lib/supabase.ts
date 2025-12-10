import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Conditional storage to prevent "window is not defined" error and still persist sessions
const getStorage = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      return {
        getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
        setItem: (key: string, value: string) => {
          window.localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          window.localStorage.removeItem(key);
          return Promise.resolve();
        },
      };
    }

    return undefined;
  }

  // Native (iOS/Android) - rely on AsyncStorage so refresh tokens persist
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true, // Always persist session for React Native
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Database types based on the schema
export interface Patient {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  blood_type?: string;
  allergies?: string;
  medications?: string;
  medical_conditions?: string;
  profile_pic_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Clinic {
  id: string;
  user_id: string;
  clinic_name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  license_number?: string;
  accreditation?: string;
  tax_id?: string;
  year_established?: number;
  operating_hours?: any;
  number_of_doctors?: number;
  number_of_staff?: number;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  specialties?: string[];
  custom_specialties?: string[];
  services?: string[];
  custom_services?: string[];
  profile_pic_url?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  user_id?: string;
  clinic_id?: string;
  full_name: string;
  specialization: string;
  email: string;
  phone?: string;
  license_number: string;
  years_experience?: number;
  availability?: string;
  profile_picture_url?: string;
  profile_picture_path?: string;
  username?: string;
  password_hash?: string;
  last_login?: string;
  status: 'active' | 'on-leave' | 'inactive';
  rating?: number;
  total_patients?: number;
  is_clinic_created?: boolean;
  email_verified?: boolean;
  created_at: string;
  updated_at: string;
}

// Appointment types
export interface Appointment {
  id: string;
  patient_id: string;
  clinic_id: string;
  doctor_id?: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  duration_minutes?: number;
  status: AppointmentStatus;
  payment_status?: PaymentStatus;
  priority?: AppointmentPriority;
  symptoms?: string;
  patient_notes?: string;
  doctor_notes?: string;
  diagnosis?: string;
  prescription?: string;
  consultation_fee?: number;
  booking_fee?: number;
  total_amount?: number;
  payment_id?: string;
  confirmation_sent?: boolean;
  confirmation_sent_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  rating?: number;
  review?: string;
  ml_validation_status?: string;
  booking_legitimacy_score?: number;
  ml_flags?: string[];
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'payment_confirmed'
  | 'pending_payment'
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type AppointmentPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AppointmentType = 
  | 'consultation'
  | 'follow_up'
  | 'routine_checkup'
  | 'specialist_visit'
  | 'lab_test'
  | 'imaging'
  | 'vaccination'
  | 'physical_therapy'
  | 'dental'
  | 'vision'
  | 'other';

// Payment types
export interface Payment {
  id: string;
  appointment_id: string;
  patient_id: string;
  clinic_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_number?: string;
  payment_reference?: string;
  adyen_psp_reference?: string;
  gcash_reference?: string;
  paymaya_reference?: string;
  card_last_four?: string;
  payment_date?: string;
  instructions?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'gcash' | 'paymaya' | 'card' | 'grabpay' | 'cash';

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  user_type: UserRole;
  title: string;
  message: string;
  notification_type: NotificationType;
  appointment_id?: string;
  priority: NotificationPriority;
  read_at?: string;
  created_at: string;
}

export type NotificationType = 
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_reminder'
  | 'payment_received'
  | 'rating_request'
  | 'system_update'
  | 'appointment_pending_payment'
  | 'appointment_completed';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// Service types
export interface ClinicService {
  id: string;
  clinic_id: string;
  service_name: string;
  service_category: string;
  description?: string;
  base_price: number;
  duration_minutes: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export type MedicalRecordType =
  | 'consultation'
  | 'lab_result'
  | 'prescription'
  | 'vaccination'
  | 'surgery'
  | 'imaging'
  | 'other';

export interface MedicalRecordEntry {
  id: string;
  patient_id: string;
  doctor_id?: string | null;
  clinic_id?: string | null;
  appointment_id?: string | null;
  record_type: MedicalRecordType;
  title: string;
  description?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  prescription?: string | null;
  lab_results?: Record<string, any> | null;
  vital_signs?: Record<string, any> | null;
  attachments?: string[] | null;
  is_private?: boolean | null;
  visit_date?: string | null;
  chief_complaint?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecordWithRelations extends MedicalRecordEntry {
  doctor?: Doctor | null;
  clinic?: Clinic | null;
  appointment?: Appointment | null;
}

export interface LabResultRecord {
  id: string;
  patient_id: string;
  doctor_id?: string | null;
  clinic_id?: string | null;
  appointment_id?: string | null;
  test_type?: string | null;
  status?: string | null;
  result_summary?: string | null;
  result_details?: Record<string, any> | null;
  notes?: string | null;
  result_date?: string | null;
  created_at: string;
  updated_at?: string;
  doctor?: Doctor | null;
  clinic?: Clinic | null;
}

export interface VaccinationRecord {
  id: string;
  patient_id: string;
  vaccine_name?: string | null;
  dose_number?: number | null;
  administered_at?: string | null;
  clinic_id?: string | null;
  doctor_id?: string | null;
  site?: string | null;
  notes?: string | null;
  next_dose_due?: string | null;
  created_at: string;
  updated_at?: string;
  clinic?: Clinic | null;
  doctor?: Doctor | null;
}

export interface AllergyRecord {
  id: string;
  patient_id: string;
  allergen: string;
  reaction?: string | null;
  severity?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at?: string;
}

export interface InsuranceInfoRecord {
  id: string;
  patient_id: string;
  provider_name?: string | null;
  policy_number?: string | null;
  coverage_details?: string | null;
  effective_date?: string | null;
  expiration_date?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface EmergencyContactRecord {
  id: string;
  patient_id: string;
  name: string;
  relationship?: string | null;
  phone: string;
  is_primary?: boolean | null;
  created_at: string;
  updated_at?: string;
}

export type HistoryTimelineItemType =
  | 'appointments'
  | 'medical_records'
  | 'prescriptions'
  | 'lab_results'
  | 'vaccinations';

export interface HistoryTimelineItem {
  id: string;
  type: HistoryTimelineItemType;
  date: string;
  title: string;
  description?: string;
  status?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface HistorySummary {
  total_appointments: number;
  completed_appointments: number;
  upcoming_appointments: number;
  cancelled_appointments: number;
  total_medical_records: number;
  total_prescriptions: number;
  active_prescriptions: number;
  total_lab_results: number;
  pending_lab_results: number;
  total_vaccinations: number;
  total_allergies: number;
  active_allergies: number;
  last_visit_date?: string | null;
  next_appointment_date?: string | null;
  chronic_conditions: string[];
  current_medications: string[];
}

export interface PatientMedicalHistory {
  patient_id: string;
  summary: HistorySummary;
  appointments: AppointmentWithDetails[];
  medical_records: MedicalRecordWithRelations[];
  prescriptions: any[];
  lab_results: LabResultRecord[];
  vaccinations: VaccinationRecord[];
  allergies: AllergyRecord[];
  insurance_info: InsuranceInfoRecord[];
  emergency_contacts: EmergencyContactRecord[];
  timeline: HistoryTimelineItem[];
}

// Review types
export interface Review {
  id: string;
  appointment_id: string;
  patient_id: string;
  clinic_id: string;
  doctor_id?: string;
  rating: number;
  review_text?: string;
  service_quality?: number;
  facility_cleanliness?: number;
  staff_friendliness?: number;
  wait_time_satisfaction?: number;
  overall_experience?: number;
  would_recommend: boolean;
  is_verified: boolean;
  created_at: string;
}

// Enhanced interfaces with relationships
export interface AppointmentWithDetails extends Omit<Appointment, 'review'> {
  patient?: Patient;
  clinic?: Clinic;
  doctor?: Doctor;
  payment?: Payment;
  review?: Review;
}

export interface PatientWithAppointments extends Patient {
  appointments?: Appointment[];
  reviews?: Review[];
}

export interface ClinicWithDetails extends Omit<Clinic, 'services'> {
  clinic_services?: ClinicService[];
  doctors?: Doctor[];
  appointments?: Appointment[];
  reviews?: Review[];
  average_rating?: number;
  total_reviews?: number;
}

export interface DoctorWithDetails extends Doctor {
  appointments?: Appointment[];
  reviews?: Review[];
  clinic?: Clinic;
}

export type UserRole = 'patient' | 'clinic' | 'doctor';

export interface UserMetadata {
  role: UserRole;
  profile_completed?: boolean;
}
