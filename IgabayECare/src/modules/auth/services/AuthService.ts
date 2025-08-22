import { SupabaseService } from '../../../shared/services/api/SupabaseService'
import type {
  ApiResponse,
  User,
  AuthCredentials,
  SignUpData,
  AuthSession,
} from '../../../core/types'
import { UserRole } from '../../../core/types'
import type {
  SignInFormData,
  SignUpFormData,
  ClinicSignUpFormData,
  DoctorSignUpFormData,
} from '../types'

/**
 * Authentication Service following SOLID principles
 * - SRP: Handles only authentication-related operations
 * - OCP: Can be extended for different auth providers
 * - LSP: Implements consistent auth interface
 * - ISP: Provides focused auth operations
 * - DIP: Depends on SupabaseService abstraction
 */
export class AuthService {
  private supabaseService: SupabaseService

  constructor() {
    this.supabaseService = new SupabaseService()
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const userResponse = await this.supabaseService.getCurrentUser()

      if (!userResponse.success || !userResponse.data) {
        return {
          success: false,
          error: 'No authenticated user found',
          data: null,
        }
      }

      const user = this.transformSupabaseUser(userResponse.data)
      return {
        success: true,
        data: user,
        error: undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current user',
        data: null,
      }
    }
  }

  /**
   * Patient sign in
   */
  async signInPatient(credentials: SignInFormData): Promise<ApiResponse<User>> {
    return this.signIn(credentials, UserRole.PATIENT)
  }

  /**
   * Clinic sign in
   */
  async signInClinic(credentials: SignInFormData): Promise<ApiResponse<User>> {
    return this.signIn(credentials, UserRole.CLINIC)
  }

  /**
   * Doctor sign in
   */
  async signInDoctor(credentials: SignInFormData): Promise<ApiResponse<User>> {
    return this.signIn(credentials, UserRole.DOCTOR)
  }

  /**
   * Patient sign up
   */
  async signUpPatient(data: SignUpFormData): Promise<ApiResponse<User>> {
    const signUpData: SignUpData = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: UserRole.PATIENT,
    }

    return this.signUp(signUpData)
  }

  /**
   * Clinic sign up
   */
  async signUpClinic(data: ClinicSignUpFormData): Promise<ApiResponse<User>> {
    const signUpData: SignUpData = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: UserRole.CLINIC,
      clinicName: data.clinicName,
    }

    return this.signUp(signUpData, {
      clinic_name: data.clinicName,
      phone: data.phone,
      website: data.website,
      address: data.address,
      city: data.city,
      state: data.state,
      zip_code: data.zipCode,
      license_number: data.licenseNumber,
      accreditation: data.accreditation,
      tax_id: data.taxId,
      year_established: data.yearEstablished,
      specialties: data.specialties,
      custom_specialties: data.customSpecialties,
      services: data.services,
      custom_services: data.customServices,
      operating_hours: data.operatingHours,
      number_of_doctors: data.numberOfDoctors,
      number_of_staff: data.numberOfStaff,
      description: data.description,
    })
  }

  /**
   * Doctor sign up
   */
  async signUpDoctor(data: DoctorSignUpFormData): Promise<ApiResponse<User>> {
    const signUpData: SignUpData = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: UserRole.DOCTOR,
    }

    return this.signUp(signUpData, {
      clinic_id: data.clinicId,
      specialization: data.specialization,
      license_number: data.licenseNumber,
      consultation_fee: data.consultationFee,
      experience: data.experience,
    })
  }

  /**
   * Sign out
   */
  async signOut(): Promise<ApiResponse<null>> {
    return this.supabaseService.signOut()
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<ApiResponse<null>> {
    return this.supabaseService.resetPassword(email)
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const sessionResponse = await this.supabaseService.getSession()
    return sessionResponse.success && !!sessionResponse.data
  }

  /**
   * Get current session
   */
  async getSession(): Promise<ApiResponse<AuthSession | null>> {
    const sessionResponse = await this.supabaseService.getSession()

    if (!sessionResponse.success || !sessionResponse.data) {
      return {
        success: false,
        error: 'No active session',
        data: null,
      }
    }

    // Transform Supabase session to our AuthSession type
    const authSession: AuthSession = {
      user: this.transformSupabaseUser(sessionResponse.data.user),
      accessToken: sessionResponse.data.access_token,
      refreshToken: sessionResponse.data.refresh_token,
      expiresAt: new Date(sessionResponse.data.expires_at! * 1000).toISOString(),
    }

    return {
      success: true,
      data: authSession,
      error: undefined,
    }
  }

  /**
   * Private method for generic sign in
   */
  private async signIn(
    credentials: AuthCredentials,
    expectedRole: UserRole,
  ): Promise<ApiResponse<User>> {
    try {
      const response = await this.supabaseService.signInWithPassword(
        credentials.email,
        credentials.password,
      )

      if (!response.success || !response.data?.user) {
        return {
          success: false,
          error: response.error || 'Sign in failed',
          data: null as any,
        }
      }

      const user = this.transformSupabaseUser(response.data.user)

      // Verify user role
      if (user.role !== expectedRole) {
        // Sign out the user since they're using wrong sign in method
        await this.supabaseService.signOut()
        return {
          success: false,
          error: `This account is registered as ${user.role}. Please use the correct sign in method.`,
          data: null as any,
        }
      }

      return {
        success: true,
        data: user,
        error: undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
        data: null as any,
      }
    }
  }

  /**
   * Private method for generic sign up
   */
  private async signUp(
    data: SignUpData,
    additionalMetadata?: Record<string, any>,
  ): Promise<ApiResponse<User>> {
    try {
      const metadata = {
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        clinic_name: data.clinicName,
        ...additionalMetadata,
      }

      const response = await this.supabaseService.signUpWithPassword(
        data.email,
        data.password,
        metadata,
      )

      if (!response.success || !response.data?.user) {
        return {
          success: false,
          error: response.error || 'Sign up failed',
          data: null as any,
        }
      }

      const user = this.transformSupabaseUser(response.data.user)

      return {
        success: true,
        data: user,
        error: undefined,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
        data: null as any,
      }
    }
  }

  /**
   * Transform Supabase user to our User type
   */
  private transformSupabaseUser(supabaseUser: any): User {
    const metadata = supabaseUser.user_metadata || {}

    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: metadata.role || UserRole.PATIENT,
      emailVerified: !!supabaseUser.email_confirmed_at,
      lastLoginAt: supabaseUser.last_sign_in_at,
      createdAt: supabaseUser.created_at,
      updatedAt: supabaseUser.updated_at,
      profile: {
        firstName: metadata.first_name || '',
        lastName: metadata.last_name || '',
        fullName: `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim(),
        avatar: metadata.avatar_url,
      },
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
