// TypeScript interfaces for appointments table

export interface Appointment {
  id: string;
  patient_id: string;
  clinic_id: string;
  doctor_id?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  appointment_date: string; // ISO date string
  appointment_time: string; // HH:MM:SS format
  duration_minutes: number;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  room_number?: string;
  floor_number?: string;
  building?: string;
  patient_notes?: string;
  doctor_notes?: string;
  admin_notes?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  copay_amount?: number;
  total_cost?: number;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  confirmation_sent: boolean;
  confirmation_sent_at?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export type AppointmentType = 
  | 'consultation'
  | 'follow_up'
  | 'emergency'
  | 'routine_checkup'
  | 'specialist_visit'
  | 'procedure'
  | 'surgery'
  | 'lab_test'
  | 'imaging'
  | 'vaccination'
  | 'physical_therapy'
  | 'mental_health'
  | 'dental'
  | 'vision'
  | 'other';

export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export type AppointmentPriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

// Appointment creation interface (for creating new appointments)
export interface CreateAppointmentData {
  patient_id: string;
  clinic_id: string;
  doctor_id?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes?: number;
  appointment_type?: AppointmentType;
  status?: AppointmentStatus;
  priority?: AppointmentPriority;
  room_number?: string;
  floor_number?: string;
  building?: string;
  patient_notes?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  copay_amount?: number;
  total_cost?: number;
  cancellation_reason?: string;
}

// Appointment update interface (for updating existing appointments)
export interface UpdateAppointmentData {
  doctor_id?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  appointment_date?: string;
  appointment_time?: string;
  duration_minutes?: number;
  appointment_type?: AppointmentType;
  status?: AppointmentStatus;
  priority?: AppointmentPriority;
  room_number?: string;
  floor_number?: string;
  building?: string;
  patient_notes?: string;
  doctor_notes?: string;
  admin_notes?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  copay_amount?: number;
  total_cost?: number;
  reminder_sent?: boolean;
  reminder_sent_at?: string;
  confirmation_sent?: boolean;
  confirmation_sent_at?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
}

// Appointment filters for querying
export interface AppointmentFilters {
  patient_id?: string;
  clinic_id?: string;
  doctor_id?: string;
  appointment_date?: string;
  appointment_date_from?: string;
  appointment_date_to?: string;
  status?: AppointmentStatus;
  appointment_type?: AppointmentType;
  priority?: AppointmentPriority;
}

// Appointment with related data (for display purposes)
export interface AppointmentWithDetails extends Appointment {
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  clinic?: {
    id: string;
    clinic_name: string;
    address?: string;
    city?: string;
    state?: string;
  };
  doctor?: {
    id: string;
    name: string;
    specialty?: string;
  };
}

// Appointment statistics
export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  no_show: number;
  today: number;
  this_week: number;
  this_month: number;
}

// Appointment time slot
export interface AppointmentTimeSlot {
  time: string;
  available: boolean;
  appointment_id?: string;
  patient_name?: string;
}

// Appointment calendar day
export interface AppointmentCalendarDay {
  date: string;
  appointments: Appointment[];
  total_appointments: number;
  available_slots: number;
}

// Constants for appointment types
export const APPOINTMENT_TYPES: Record<AppointmentType, string> = {
  consultation: 'Consultation',
  follow_up: 'Follow-up',
  emergency: 'Emergency',
  routine_checkup: 'Routine Checkup',
  specialist_visit: 'Specialist Visit',
  procedure: 'Procedure',
  surgery: 'Surgery',
  lab_test: 'Lab Test',
  imaging: 'Imaging',
  vaccination: 'Vaccination',
  physical_therapy: 'Physical Therapy',
  mental_health: 'Mental Health',
  dental: 'Dental',
  vision: 'Vision',
  other: 'Other'
};

// Constants for appointment statuses
export const APPOINTMENT_STATUSES: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  rescheduled: 'Rescheduled'
};

// Constants for appointment priorities
export const APPOINTMENT_PRIORITIES: Record<AppointmentPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent'
};

// Status colors for UI
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800',
  rescheduled: 'bg-purple-100 text-purple-800'
};

// Priority colors for UI
export const APPOINTMENT_PRIORITY_COLORS: Record<AppointmentPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}; 