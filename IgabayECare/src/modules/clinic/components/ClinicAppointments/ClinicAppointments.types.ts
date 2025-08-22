import type { AppointmentType } from '../../../../core/types/common.types'

export interface Patient {
  name: string
  phone: string
  email: string
  age: number
  reason: string
}

export interface Appointment {
  id: number
  time: string
  patient: Patient
  doctor: string
  doctorId?: string
  type: string
  status: 'confirmed' | 'in-progress' | 'waiting' | 'completed' | 'cancelled'
  duration: number
  fee: number
  notes: string
}

export interface ClinicAppointmentsProps {}

export interface ClinicAppointmentsEmits {
  appointmentUpdated: [appointmentId: number]
  doctorAssigned: [appointmentId: number, doctorId: string]
}
