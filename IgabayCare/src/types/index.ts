export interface User {
  id: string;
  email: string;
  role: 'patient' | 'clinic' | 'doctor';
  createdAt: string;
  profile?: PatientProfile | ClinicProfile | DoctorProfile;
}

export interface PatientProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  emergencyContact: string;
  profilePicture?: string;
  medicalHistory: MedicalRecord[];
}

export interface ClinicProfile {
  id: string;
  userId: string;
  clinicName: string;
  address: string;
  phoneNumber: string;
  email: string;
  license: string;
  accreditation: string;
  description: string;
  services: string[];
  operatingHours: OperatingHours;
  verified: boolean;
  doctors: Doctor[];
}

export interface DoctorProfile {
  id: string;
  userId: string;
  clinicId: string;
  fullName: string;
  specialization: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  yearsExperience?: number;
  availability?: string;
  status: 'active' | 'on-leave' | 'inactive';
  rating: number;
  totalPatients: number;
  profilePictureUrl?: string;
  profilePicturePath?: string;
  username?: string;
  isClinicCreated: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  clinicId: string;
  name: string;
  specialization: string;
  schedule: DoctorSchedule[];
  consultationFee: number;
}

export interface DoctorSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface OperatingHours {
  monday: { open: string; close: string; };
  tuesday: { open: string; close: string; };
  wednesday: { open: string; close: string; };
  thursday: { open: string; close: string; };
  friday: { open: string; close: string; };
  saturday: { open: string; close: string; };
  sunday: { open: string; close: string; };
}

export interface Appointment {
  id: string;
  patientId: string;
  clinicId: string;
  doctorId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  consultationFee: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  date: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  notes: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'payment' | 'reminder' | 'system';
  read: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  isBot: boolean;
  timestamp: string;
}