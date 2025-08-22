import type { BaseEntity } from './common.types'
import type { UserRole } from './common.types'

export interface User extends BaseEntity {
  email: string
  role: UserRole
  emailVerified: boolean
  lastLoginAt?: string
  profile?: UserProfile
}

export interface UserProfile {
  firstName: string
  lastName: string
  fullName?: string
  avatar?: string
  phone?: string
  address?: Address
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface PatientProfile extends UserProfile {
  dateOfBirth?: string
  bloodType?: BloodType
  allergies?: string[]
  medications?: string[]
  emergencyContact?: EmergencyContact
  medicalHistory?: MedicalRecord[]
}

export interface ClinicProfile extends UserProfile {
  clinicName: string
  licenseNumber: string
  accreditation?: string
  taxId?: string
  yearEstablished?: number
  description?: string
  website?: string
  services?: string[]
  specialties?: string[]
  operatingHours?: OperatingHours
  numberOfDoctors?: number
  numberOfStaff?: number
  verified: boolean
}

export interface DoctorProfile extends UserProfile {
  clinicId: string
  specialization: string
  licenseNumber: string
  consultationFee: number
  experience?: number
  schedule?: DoctorSchedule[]
  verified: boolean
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

export interface MedicalRecord extends BaseEntity {
  patientId: string
  doctorId: string
  clinicId: string
  appointmentId?: string
  diagnosis: string
  treatment: string
  prescription?: Prescription[]
  notes?: string
  attachments?: string[]
}

export interface Prescription {
  medication: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface DoctorSchedule {
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  available: boolean
}

export interface OperatingHours {
  [key: string]: {
    open: string
    close: string
    isOpen: boolean
  }
}

export enum BloodType {
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
}

// Auth-related types
export interface AuthCredentials {
  email: string
  password: string
}

export interface SignUpData extends AuthCredentials {
  firstName: string
  lastName: string
  role: UserRole
  clinicName?: string // For clinic registration
}

export interface AuthSession {
  user: User
  accessToken: string
  refreshToken?: string
  expiresAt: string
}

export interface AuthState {
  user: User | null
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
}
