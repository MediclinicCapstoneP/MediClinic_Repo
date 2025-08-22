import type { AppointmentType } from '../../../../core/types/common.types'

export interface BookAppointmentProps {
  isOpen: boolean
  clinicId: string
  clinicName: string
}

export interface BookAppointmentFormData {
  selectedDate: string
  selectedTime: string
  appointmentType: AppointmentType
  notes: string
}

export interface BookAppointmentEmits {
  close: []
  success: [appointmentId: string]
}

export interface CreateAppointmentData {
  patient_id: string
  clinic_id: string
  appointment_date: string
  appointment_time: string
  appointment_type: AppointmentType
  patient_notes: string
  duration_minutes: number
}
