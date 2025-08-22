import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../modules/auth/services'
import type { User, UserRole, AuthSession } from '../../core/types'
import type { SignInFormData, SignUpFormData } from '../../modules/auth/types'

/**
 * Authentication composable following Vue 3 Composition API patterns
 * Provides reactive authentication state and methods
 */
export function useAuth() {
  const router = useRouter()

  // Reactive state
  const user = ref<User | null>(null)
  const session = ref<AuthSession | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const isAuthenticated = computed(() => !!user.value && !!session.value)
  const userRole = computed(() => user.value?.role)
  const isPatient = computed(() => userRole.value === UserRole.PATIENT)
  const isClinic = computed(() => userRole.value === UserRole.CLINIC)
  const isDoctor = computed(() => userRole.value === UserRole.DOCTOR)

  /**
   * Initialize auth state (call this in app setup)
   */
  const initialize = async () => {
    loading.value = true
    error.value = null

    try {
      const userResponse = await authService.getCurrentUser()
      if (userResponse.success && userResponse.data) {
        user.value = userResponse.data

        const sessionResponse = await authService.getSession()
        if (sessionResponse.success && sessionResponse.data) {
          session.value = sessionResponse.data
        }
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err)
      error.value = err instanceof Error ? err.message : 'Authentication initialization failed'
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign in patient
   */
  const signInPatient = async (credentials: SignInFormData) => {
    loading.value = true
    error.value = null

    try {
      const response = await authService.signInPatient(credentials)

      if (response.success && response.data) {
        user.value = response.data
        const sessionResponse = await authService.getSession()
        if (sessionResponse.success && sessionResponse.data) {
          session.value = sessionResponse.data
        }
        return { success: true }
      } else {
        error.value = response.error || 'Sign in failed'
        return { success: false, error: error.value }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign in clinic
   */
  const signInClinic = async (credentials: SignInFormData) => {
    loading.value = true
    error.value = null

    try {
      const response = await authService.signInClinic(credentials)

      if (response.success && response.data) {
        user.value = response.data
        const sessionResponse = await authService.getSession()
        if (sessionResponse.success && sessionResponse.data) {
          session.value = sessionResponse.data
        }
        return { success: true }
      } else {
        error.value = response.error || 'Sign in failed'
        return { success: false, error: error.value }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign in doctor
   */
  const signInDoctor = async (credentials: SignInFormData) => {
    loading.value = true
    error.value = null

    try {
      const response = await authService.signInDoctor(credentials)

      if (response.success && response.data) {
        user.value = response.data
        const sessionResponse = await authService.getSession()
        if (sessionResponse.success && sessionResponse.data) {
          session.value = sessionResponse.data
        }
        return { success: true }
      } else {
        error.value = response.error || 'Sign in failed'
        return { success: false, error: error.value }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign up patient
   */
  const signUpPatient = async (data: SignUpFormData) => {
    loading.value = true
    error.value = null

    try {
      const response = await authService.signUpPatient(data)

      if (response.success) {
        return { success: true }
      } else {
        error.value = response.error || 'Sign up failed'
        return { success: false, error: error.value }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign out
   */
  const signOut = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await authService.signOut()

      if (response.success) {
        user.value = null
        session.value = null
        await router.push('/')
        return { success: true }
      } else {
        error.value = response.error || 'Sign out failed'
        return { success: false, error: error.value }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
      error.value = errorMessage
      // Still clear state and redirect even if sign out fails
      user.value = null
      session.value = null
      await router.push('/')
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset password
   */
  const resetPassword = async (email: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await authService.resetPassword(email)

      if (response.success) {
        return { success: true }
      } else {
        error.value = response.error || 'Password reset failed'
        return { success: false, error: error.value }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if user has specific role
   */
  const hasRole = (role: UserRole): boolean => {
    return userRole.value === role
  }

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Require authentication - redirect to login if not authenticated
   */
  const requireAuth = async (requiredRole?: UserRole) => {
    if (!isAuthenticated.value) {
      await router.push('/signin')
      return false
    }

    if (requiredRole && !hasRole(requiredRole)) {
      await router.push('/unauthorized')
      return false
    }

    return true
  }

  return {
    // State
    user: readonly(user),
    session: readonly(session),
    loading: readonly(loading),
    error: readonly(error),

    // Computed
    isAuthenticated,
    userRole,
    isPatient,
    isClinic,
    isDoctor,

    // Methods
    initialize,
    signInPatient,
    signInClinic,
    signInDoctor,
    signUpPatient,
    signOut,
    resetPassword,
    hasRole,
    clearError,
    requireAuth,
  }
}
