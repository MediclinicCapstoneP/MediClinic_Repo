export interface ClinicService {
  id: string;
  clinic_id: string;
  service_name: string;
  service_category: 'consultation' | 'routine_checkup' | 'follow_up' | 'emergency' | 
                   'specialist_visit' | 'vaccination' | 'procedure' | 'surgery' | 
                   'lab_test' | 'imaging' | 'physical_therapy' | 'mental_health' | 
                   'dental' | 'vision' | 'other';
  description?: string;
  base_price: number;
  currency: string;
  is_available: boolean;
  duration_minutes?: number;
  has_insurance_coverage: boolean;
  insurance_discount_percentage: number;
  senior_discount_percentage: number;
  student_discount_percentage: number;
  requires_appointment: boolean;
  requires_referral: boolean;
  min_age?: number;
  max_age?: number;
  created_at: string;
  updated_at: string;
}

export interface ClinicServicePackage {
  id: string;
  clinic_id: string;
  package_name: string;
  description?: string;
  package_price: number;
  individual_total_price?: number;
  savings_amount?: number;
  is_available: boolean;
  validity_days: number;
  created_at: string;
  updated_at: string;
  services?: ClinicService[];
}

export interface CreateClinicServiceData {
  clinic_id: string;
  service_name: string;
  service_category: ClinicService['service_category'];
  description?: string;
  base_price: number;
  duration_minutes?: number;
  has_insurance_coverage?: boolean;
  insurance_discount_percentage?: number;
  senior_discount_percentage?: number;
  student_discount_percentage?: number;
  requires_appointment?: boolean;
  requires_referral?: boolean;
  min_age?: number;
  max_age?: number;
}
