import { SupabaseService } from '../../shared/services/api/SupabaseService'
import type { ApiResponse, AppointmentStatus } from '../../core/types'

export interface Appointment {
  id: string
  patient_id: string
  clinic_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  reason?: string
  notes?: string
  consultation_fee?: number
  payment_status?: 'pending' | 'paid' | 'refunded'
  created_at: string
  updated_at: string
}

export interface AppointmentCreateData {
  patient_id: string
  clinic_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  reason?: string
  consultation_fee?: number
}

/**
 * Appointment Service following SOLID principles
 * - SRP: Handles only appointment-related operations
 * - OCP: Can be extended for additional appointment functionality
 * - LSP: Implements consistent service interface
 * - ISP: Provides focused appointment operations
 * - DIP: Depends on SupabaseService abstraction
 */
export class AppointmentService {
  private supabaseService: SupabaseService

  constructor() {
    this.supabaseService = new SupabaseService()
  }

  /**
   * Create new appointment
   */
  async createAppointment(
    appointmentData: AppointmentCreateData,
  ): Promise<ApiResponse<Appointment>> {
    try {
      const data = {
        ...appointmentData,
        status: AppointmentStatus.SCHEDULED,
        payment_status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const result = await this.supabaseService.insert<Appointment>('appointments', data)

      if (!result.success || !result.data?.[0]) {
        return {
          success: false,
          error: result.error || 'Failed to create appointment',
          data: null as any,
        }
      }

      return {
        success: true,
        data: result.data[0],
        error: undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create appointment',
        data: null as any,
      }
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId: string): Promise<ApiResponse<Appointment | null>> {
    try {
      const result = await this.supabaseService.query<Appointment>('appointments', {
        filter: { id: appointmentId },
        limit: 1,
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to fetch appointment',
          data: null,
        }
      }

      return {
        success: true,
        data: result.data?.[0] || null,
        error: undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get appointment',
        data: null,
      }
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(
    appointmentId: string,
    updates: Partial<Appointment>,
  ): Promise<ApiResponse<Appointment>> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      const result = await this.supabaseService.update<Appointment>('appointments', updateData, {
        id: appointmentId,
      })

      if (!result.success || !result.data?.[0]) {
        return {
          success: false,
          error: result.error || 'Failed to update appointment',
          data: null as any,
        }
      }

      return {
        success: true,
        data: result.data[0],
        error: undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update appointment',
        data: null as any,
      }
    }
  }

  /**
   * Get appointments for patient
   */
  async getPatientAppointments(
    patientId: string,
    options?: {
      status?: AppointmentStatus
      limit?: number
      offset?: number
      startDate?: string
      endDate?: string
    },
  ): Promise<ApiResponse<Appointment[]>> {
    try {
      const filters: Record<string, any> = { patient_id: patientId }

      if (options?.status) {
        filters.status = options.status
      }

      const result = await this.supabaseService.query<Appointment>('appointments', {
        filter: filters,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        order: { column: 'appointment_date', ascending: false },
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get patient appointments',
          data: [],
        }
      }

      return {
        success: true,
        data: result.data || [],
        error: undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get patient appointments',
        data: [],
      }
    }
  }

  /**
   * Get appointments for clinic
   */
  async getClinicAppointments(
    clinicId: string,
    options?: {
      status?: AppointmentStatus
      doctorId?: string
      limit?: number
      offset?: number
      date?: string
    },
  ): Promise<ApiResponse<Appointment[]>> {
    try {
      const filters: Record<string, any> = { clinic_id: clinicId }

      if (options?.status) {
        filters.status = options.status
      }

      if (options?.doctorId) {
        filters.doctor_id = options.doctorId
      }

      if (options?.date) {
        filters.appointment_date = options.date
      }

      const result = await this.supabaseService.query<Appointment>('appointments', {
        filter: filters,
        limit: options?.limit || 50,
        offset: options?.offset || 0,
        order: { column: 'appointment_date', ascending: true },
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get clinic appointments',
          data: [],
        }
      }

      return {
        success: true,
        data: result.data || [],
        error: undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get clinic appointments',
        data: [],
      }
    }
  }

  /**
   * Get appointments for doctor
   */
  async getDoctorAppointments(
    doctorId: string,
    options?: {
      status?: AppointmentStatus
      limit?: number
      offset?: number
      date?: string
    },
  ): Promise<ApiResponse<Appointment[]>> {
    try {
      const filters: Record<string, any> = { doctor_id: doctorId }

      if (options?.status) {
        filters.status = options.status
      }

      if (options?.date) {
        filters.appointment_date = options.date
      }

      const result = await this.supabaseService.query<Appointment>('appointments', {
        filter: filters,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        order: { column: 'appointment_date', ascending: true },
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to get doctor appointments',
          data: [],
        }
      }

      return {
        success: true,
        data: result.data || [],
        error: undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get doctor appointments',
        data: [],
      }
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: string,
    reason?: string,
  ): Promise<ApiResponse<Appointment>> {
    try {
      const updates = {
        status: AppointmentStatus.CANCELLED,
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
        updated_at: new Date().toISOString(),
      }

      return this.updateAppointment(appointmentId, updates)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel appointment',
        data: null as any,
      }
    }
  }

  /**
   * Complete appointment
   */
  async completeAppointment(
    appointmentId: string,
    notes?: string,
  ): Promise<ApiResponse<Appointment>> {
    try {
      const updates = {
        status: AppointmentStatus.COMPLETED,
        notes,
        updated_at: new Date().toISOString(),
      }

      return this.updateAppointment(appointmentId, updates)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete appointment',
        data: null as any,
      }
    }
  }

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newTime: string,
  ): Promise<ApiResponse<Appointment>> {
    try {
      const updates = {
        appointment_date: newDate,
        appointment_time: newTime,
        status: AppointmentStatus.RESCHEDULED,
        updated_at: new Date().toISOString(),
      }

      return this.updateAppointment(appointmentId, updates)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reschedule appointment',
        data: null as any,
      }
    }
  }

  /**
   * Check appointment availability
   */
  async checkAvailability(
    doctorId: string,
    date: string,
    time: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.supabaseService.query<Appointment>('appointments', {
        filter: {
          doctor_id: doctorId,
          appointment_date: date,
          appointment_time: time,
          status: AppointmentStatus.SCHEDULED,
        },
        limit: 1,
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to check availability',
          data: false,
        }
      }

      // Available if no existing appointment found
      const isAvailable = !result.data || result.data.length === 0

      return {
        success: true,
        data: isAvailable,
        error: undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check availability',
        data: false,
      }
    }
  }

  /**
   * Delete appointment
   */
  async deleteAppointment(appointmentId: string): Promise<ApiResponse<null>> {
    try {
      const result = await this.supabaseService.delete('appointments', { id: appointmentId })

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to delete appointment',
          data: null,
        }
      }

      return {
        success: true,
        data: null,
        error: undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete appointment',
        data: null,
      }
    }
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService()
