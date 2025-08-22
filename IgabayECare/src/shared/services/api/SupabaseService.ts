import { createClient, type SupabaseClient, type User, type Session } from '@supabase/supabase-js'
import { BaseApiService } from '../base/BaseApiService'
import type { ApiResponse, SupabaseResponse, SupabaseAuthResponse } from '../../core/types'

/**
 * Supabase Service following SOLID principles
 * - SRP: Handles only Supabase-specific operations
 * - OCP: Extends BaseApiService, can be extended for specific implementations
 * - LSP: Can be substituted for BaseApiService where needed
 * - ISP: Provides focused interface for Supabase operations
 * - DIP: Depends on Supabase client interface, not concrete implementation
 */
export class SupabaseService extends BaseApiService {
  private client: SupabaseClient

  constructor() {
    super()

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    this.client = createClient(supabaseUrl, supabaseKey)
    this.setupAuthStateListener()
  }

  /**
   * Get current Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.client
  }

  /**
   * Get current session
   */
  async getSession(): Promise<ApiResponse<Session | null>> {
    try {
      const { data, error } = await this.client.auth.getSession()

      if (error) {
        return {
          success: false,
          error: error.message,
          data: null,
        }
      }

      return {
        success: true,
        data: data.session,
        error: undefined,
      }
    } catch (error) {
      return this.handleSupabaseError(error)
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const { data, error } = await this.client.auth.getUser()

      if (error) {
        return {
          success: false,
          error: error.message,
          data: null,
        }
      }

      return {
        success: true,
        data: data.user,
        error: undefined,
      }
    } catch (error) {
      return this.handleSupabaseError(error)
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<ApiResponse<SupabaseAuthResponse>> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return {
          success: false,
          error: error.message,
          data: null,
        }
      }

      // Set auth header for future requests
      if (data.session?.access_token) {
        this.setAuthHeader(data.session.access_token)
      }

      return {
        success: true,
        data,
        error: undefined,
      }
    } catch (error) {
      return this.handleSupabaseError(error)
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithPassword(
    email: string,
    password: string,
    metadata?: Record<string, any>,
  ): Promise<ApiResponse<SupabaseAuthResponse>> {
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        return {
          success: false,
          error: error.message,
          data: null,
        }
      }

      return {
        success: true,
        data,
        error: undefined,
      }
    } catch (error) {
      return this.handleSupabaseError(error)
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<ApiResponse<null>> {
    try {
      const { error } = await this.client.auth.signOut()

      if (error) {
        return {
          success: false,
          error: error.message,
          data: null,
        }
      }

      // Remove auth header
      this.removeAuthHeader()

      return {
        success: true,
        data: null,
        error: undefined,
      }
    } catch (error) {
      return this.handleSupabaseError(error)
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string, redirectTo?: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || `${window.location.origin}/reset-password`,
      })

      if (error) {
        return {
          success: false,
          error: error.message,
          data: null,
        }
      }

      return {
        success: true,
        data: null,
        error: undefined,
      }
    } catch (error) {
      return this.handleSupabaseError(error)
    }
  }

  /**
   * Query data from a table
   */
  async query<T = any>(
    table: string,
    options?: {
      select?: string
      filter?: Record<string, any>
      order?: { column: string; ascending?: boolean }
      limit?: number
      offset?: number
    },
  ): Promise<ApiResponse<T[]>> {
    try {
      let query = this.client.from(table).select(options?.select || '*')

      // Apply filters
      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      // Apply ordering
      if (options?.order) {
        query = query.order(options.order.column, {
          ascending: options.order.ascending ?? true,
        })
      }

      // Apply pagination
      if (options?.limit) {
        const from = options.offset || 0
        const to = from + options.limit - 1
        query = query.range(from, to)
      }

      const { data, error } = await query

      if (error) {
        return {
          success: false,
          error: error.message,
          data: [],
        }
      }

      return {
        success: true,
        data: data as T[],
        error: undefined,
      }
    } catch (error) {
      return this.handleSupabaseError(error)
    }
  }

  /**
   * Insert data into a table
   */
  async insert<T = any>(table: string, data: Partial<T> | Partial<T>[]): Promise<ApiResponse<T[]>> {
    try {
      const { data: result, error } = await this.client.from(table).insert(data).select()

      if (error) {
        return {
          success: false,
          error: error.message,
          data: [],
        }
      }

      return {
        success: true,
        data: result as T[],
        error: undefined,
      }
    } catch (error) {
      return this.handleSupabaseError(error)
    }
  }

  /**
   * Update data in a table
   */
  async update<T = any>(
    table: string,
    data: Partial<T>,
    filter: Record<string, any>,
  ): Promise<ApiResponse<T[]>> {
    try {
      let query = this.client.from(table).update(data)

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { data: result, error } = await query.select()

      if (error) {
        return {
          success: false,
          error: error.message,
          data: [],
        }
      }

      return {
        success: true,
        data: result as T[],
        error: undefined,
      }
    } catch (error) {
      return this.handleSupabaseError(error)
    }
  }

  /**
   * Delete data from a table
   */
  async delete<T = any>(table: string, filter: Record<string, any>): Promise<ApiResponse<T[]>> {
    try {
      let query = this.client.from(table).delete()

      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { data, error } = await query.select()

      if (error) {
        return {
          success: false,
          error: error.message,
          data: [],
        }
      }

      return {
        success: true,
        data: data as T[],
        error: undefined,
      }
    } catch (error) {
      return this.handleSupabaseError(error)
    }
  }

  /**
   * Setup auth state listener
   */
  private setupAuthStateListener(): void {
    this.client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.access_token) {
        this.setAuthHeader(session.access_token)
      } else if (event === 'SIGNED_OUT') {
        this.removeAuthHeader()
      }
    })
  }

  /**
   * Handle Supabase-specific errors
   */
  private handleSupabaseError(error: unknown): ApiResponse<null> {
    let message = 'A database error occurred'

    if (error instanceof Error) {
      message = error.message
    }

    return {
      success: false,
      error: message,
      data: null,
    }
  }
}
