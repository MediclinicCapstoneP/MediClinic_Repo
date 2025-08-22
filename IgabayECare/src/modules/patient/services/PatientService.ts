import { SupabaseService } from '../../shared/services/api/SupabaseService'
import type { ApiResponse, PatientProfile } from '../../core/types'

/**
 * Patient Service following SOLID principles
 * - SRP: Handles only patient-related operations
 * - OCP: Can be extended for additional patient functionality
 * - LSP: Implements consistent service interface
 * - ISP: Provides focused patient operations
 * - DIP: Depends on SupabaseService abstraction
 */
export class PatientService {
  private supabaseService: SupabaseService

  constructor() {
    this.supabaseService = new SupabaseService()
  }

  /**
   * Create or update patient profile
   */
  async upsertPatient(patientData: Partial<PatientProfile>): Promise<ApiResponse<PatientProfile>> {
    try {
      const result = await this.supabaseService.insert<PatientProfile>('patients', patientData)

      if (!result.success || !result.data?.[0]) {
        return {
          success: false,
          error: result.error || 'Failed to create patient profile',
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
        error: error instanceof Error ? error.message : 'Failed to upsert patient',
        data: null as any,
      }
    }
  }

  /**
   * Get patient by ID
   */
  async getPatientById(patientId: string): Promise<ApiResponse<PatientProfile | null>> {
    try {
      const result = await this.supabaseService.query<PatientProfile>('patients', {
        filter: { id: patientId },
        limit: 1,
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to fetch patient',
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
        error: error instanceof Error ? error.message : 'Failed to get patient',
        data: null,
      }
    }
  }

  /**
   * Get patient by user ID
   */
  async getPatientByUserId(userId: string): Promise<ApiResponse<PatientProfile | null>> {
    try {
      const result = await this.supabaseService.query<PatientProfile>('patients', {
        filter: { user_id: userId },
        limit: 1,
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to fetch patient',
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
        error: error instanceof Error ? error.message : 'Failed to get patient by user ID',
        data: null,
      }
    }
  }

  /**
   * Update patient profile
   */
  async updatePatient(
    patientId: string,
    updates: Partial<PatientProfile>,
  ): Promise<ApiResponse<PatientProfile>> {
    try {
      const result = await this.supabaseService.update<PatientProfile>('patients', updates, {
        id: patientId,
      })

      if (!result.success || !result.data?.[0]) {
        return {
          success: false,
          error: result.error || 'Failed to update patient',
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
        error: error instanceof Error ? error.message : 'Failed to update patient',
        data: null as any,
      }
    }
  }

  /**
   * Search patients (for clinic use)
   */
  async searchPatients(options: {
    clinicId: string
    query?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<PatientProfile[]>> {
    try {
      const filters: Record<string, any> = {}

      // Add clinic filter for security
      if (options.clinicId) {
        // TODO: Implement proper patient-clinic relationship filtering
        // For now, get all patients - this should be restricted by clinic access
      }

      const result = await this.supabaseService.query<PatientProfile>('patients', {
        filter: filters,
        limit: options.limit || 20,
        offset: options.offset || 0,
        order: { column: 'created_at', ascending: false },
      })

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to search patients',
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
        error: error instanceof Error ? error.message : 'Failed to search patients',
        data: [],
      }
    }
  }

  /**
   * Get patient medical history
   */
  async getPatientMedicalHistory(patientId: string): Promise<ApiResponse<any[]>> {
    try {
      // TODO: Implement medical history retrieval
      // This would query medical_records table

      return {
        success: true,
        data: [],
        error: undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get medical history',
        data: [],
      }
    }
  }

  /**
   * Add medical record
   */
  async addMedicalRecord(recordData: {
    patientId: string
    doctorId: string
    clinicId: string
    diagnosis: string
    treatment: string
    prescription?: any[]
    notes?: string
  }): Promise<ApiResponse<any>> {
    try {
      const result = await this.supabaseService.insert('medical_records', recordData)

      if (!result.success || !result.data?.[0]) {
        return {
          success: false,
          error: result.error || 'Failed to add medical record',
          data: null,
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
        error: error instanceof Error ? error.message : 'Failed to add medical record',
        data: null,
      }
    }
  }

  /**
   * Delete patient
   */
  async deletePatient(patientId: string): Promise<ApiResponse<null>> {
    try {
      const result = await this.supabaseService.delete('patients', { id: patientId })

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to delete patient',
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
        error: error instanceof Error ? error.message : 'Failed to delete patient',
        data: null,
      }
    }
  }

  /**
   * Get patient appointments
   */
  async getPatientAppointments(
    patientId: string,
    options?: {
      status?: string
      limit?: number
      offset?: number
    },
  ): Promise<ApiResponse<any[]>> {
    try {
      const filters: Record<string, any> = { patient_id: patientId }

      if (options?.status) {
        filters.status = options.status
      }

      const result = await this.supabaseService.query('appointments', {
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
}

// Export singleton instance
export const patientService = new PatientService()
