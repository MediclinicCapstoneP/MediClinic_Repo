import type { UserRole, AuthCredentials, SignUpData, AuthSession } from '../../../core/types'

export interface SignInFormData extends AuthCredentials {
  rememberMe?: boolean
}

export interface SignUpFormData extends SignUpData {
  confirmPassword: string
  agreeToTerms: boolean
}

export interface ClinicSignUpFormData extends SignUpFormData {
  clinicName: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  licenseNumber?: string
  accreditation?: string
  taxId?: string
  yearEstablished?: string
  specialties?: string[]
  customSpecialties?: string[]
  services?: string[]
  customServices?: string[]
  operatingHours?: any
  numberOfDoctors?: string
  numberOfStaff?: string
  description?: string
}

export interface DoctorSignUpFormData extends SignUpFormData {
  clinicId: string
  specialization: string
  licenseNumber: string
  consultationFee: number
  experience?: number
}

export interface AuthFormProps {
  loading?: boolean
  error?: string
  redirectTo?: string
}

export interface AuthFormEmits {
  submit: [data: any]
  'update:loading': [loading: boolean]
  'update:error': [error: string | null]
}

// Validation rules
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface FormValidation {
  [field: string]: ValidationRule[]
}
