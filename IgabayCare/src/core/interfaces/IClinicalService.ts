/**
 * Abstract interfaces for clinical services following SOLID principles
 * Interface Segregation Principle: Specific interfaces for clinical operations
 */

import { ServiceResult } from './IAuthService';

// Clinical profile interfaces
export interface IClinicProfile {
  id: string;
  userId: string;
  clinicName: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  licenseNumber?: string;
  accreditation?: string;
  taxId?: string;
  yearEstablished?: number;
  specialties: string[];
  customSpecialties: string[];
  services: string[];
  customServices: string[];
  operatingHours: IOperatingHours;
  numberOfDoctors?: number;
  numberOfStaff?: number;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface IDoctorProfile {
  id: string;
  userId: string;
  clinicId?: string;
  firstName: string;
  lastName: string;
  specialization: string;
  licenseNumber: string;
  yearsOfExperience: number;
  education: string[];
  certifications: string[];
  consultationFee: number;
  languages: string[];
  biography: string;
  schedule: IDoctorSchedule[];
  availability: boolean;
  rating: number;
  totalConsultations: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPatientProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  emergencyContact: string;
  bloodType: string;
  allergies: string;
  medications: string;
  medicalConditions: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IOperatingHours {
  monday: { open: string; close: string; isOpen: boolean };
  tuesday: { open: string; close: string; isOpen: boolean };
  wednesday: { open: string; close: string; isOpen: boolean };
  thursday: { open: string; close: string; isOpen: boolean };
  friday: { open: string; close: string; isOpen: boolean };
  saturday: { open: string; close: string; isOpen: boolean };
  sunday: { open: string; close: string; isOpen: boolean };
}

export interface IDoctorSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxAppointments: number;
}

// Clinical service interfaces
export interface IClinicService {
  getClinic(clinicId: string): Promise<ServiceResult<IClinicProfile>>;
  getClinicByUserId(userId: string): Promise<ServiceResult<IClinicProfile>>;
  createClinic(data: Omit<IClinicProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<IClinicProfile>>;
  updateClinic(clinicId: string, data: Partial<IClinicProfile>): Promise<ServiceResult<IClinicProfile>>;
  deleteClinic(clinicId: string): Promise<ServiceResult>;
  searchClinics(criteria: IClinicSearchCriteria): Promise<ServiceResult<IClinicProfile[]>>;
}

export interface IDoctorService {
  getDoctor(doctorId: string): Promise<ServiceResult<IDoctorProfile>>;
  getDoctorByUserId(userId: string): Promise<ServiceResult<IDoctorProfile>>;
  getDoctorsByClinic(clinicId: string): Promise<ServiceResult<IDoctorProfile[]>>;
  createDoctor(data: Omit<IDoctorProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<IDoctorProfile>>;
  updateDoctor(doctorId: string, data: Partial<IDoctorProfile>): Promise<ServiceResult<IDoctorProfile>>;
  deleteDoctor(doctorId: string): Promise<ServiceResult>;
  searchDoctors(criteria: IDoctorSearchCriteria): Promise<ServiceResult<IDoctorProfile[]>>;
}

export interface IPatientService {
  getPatient(patientId: string): Promise<ServiceResult<IPatientProfile>>;
  getPatientByUserId(userId: string): Promise<ServiceResult<IPatientProfile>>;
  createPatient(data: Omit<IPatientProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<IPatientProfile>>;
  updatePatient(patientId: string, data: Partial<IPatientProfile>): Promise<ServiceResult<IPatientProfile>>;
  deletePatient(patientId: string): Promise<ServiceResult>;
}

// Search criteria interfaces
export interface IClinicSearchCriteria {
  location?: string;
  specialty?: string;
  name?: string;
  radius?: number;
  coordinates?: { lat: number; lng: number };
  verified?: boolean;
  hasAvailableSlots?: boolean;
}

export interface IDoctorSearchCriteria {
  specialization?: string;
  clinicId?: string;
  availability?: boolean;
  rating?: number;
  experience?: number;
  language?: string;
}

// Specialty management interface
export interface ISpecialtyService {
  getStandardSpecialties(): Promise<ServiceResult<string[]>>;
  getClinicSpecialties(clinicId: string): Promise<ServiceResult<string[]>>;
  addSpecialtyToClinic(clinicId: string, specialty: string, isCustom: boolean): Promise<ServiceResult>;
  removeSpecialtyFromClinic(clinicId: string, specialty: string): Promise<ServiceResult>;
  replaceClinicSpecialties(clinicId: string, standardSpecialties: string[], customSpecialties: string[]): Promise<ServiceResult>;
}

// Verification service interface
export interface IVerificationService {
  verifyClinic(clinicId: string): Promise<ServiceResult>;
  verifyDoctor(doctorId: string): Promise<ServiceResult>;
  getVerificationStatus(entityType: 'clinic' | 'doctor', entityId: string): Promise<ServiceResult<string>>;
  requestVerification(entityType: 'clinic' | 'doctor', entityId: string, documents: File[]): Promise<ServiceResult>;
}