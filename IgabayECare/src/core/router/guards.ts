import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { authService } from '../../modules/auth/services'
import { UserRole } from '../types'
import { ROUTES } from '../constants/routes'

/**
 * Authentication guard - checks if user is authenticated
 */
export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  try {
    const isAuthenticated = await authService.isAuthenticated()

    if (!isAuthenticated) {
      // Redirect to appropriate sign-in page based on route
      if (to.path.startsWith('/clinic')) {
        next(ROUTES.CLINIC_SIGN_IN)
      } else if (to.path.startsWith('/doctor')) {
        next(ROUTES.DOCTOR_SIGN_IN)
      } else {
        next(ROUTES.SIGN_IN)
      }
      return
    }

    next()
  } catch (error) {
    console.error('Auth guard error:', error)
    next(ROUTES.SIGN_IN)
  }
}

/**
 * Role-based guard - checks if user has required role
 */
export const roleGuard = (requiredRole: UserRole) => {
  return async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ) => {
    try {
      const userResponse = await authService.getCurrentUser()

      if (!userResponse.success || !userResponse.data) {
        next(ROUTES.SIGN_IN)
        return
      }

      if (userResponse.data.role !== requiredRole) {
        next(ROUTES.UNAUTHORIZED)
        return
      }

      next()
    } catch (error) {
      console.error('Role guard error:', error)
      next(ROUTES.UNAUTHORIZED)
    }
  }
}

/**
 * Guest guard - redirects authenticated users away from guest-only pages
 */
export const guestGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  try {
    const isAuthenticated = await authService.isAuthenticated()

    if (isAuthenticated) {
      const userResponse = await authService.getCurrentUser()

      if (userResponse.success && userResponse.data) {
        // Redirect to appropriate dashboard based on user role
        switch (userResponse.data.role) {
          case UserRole.PATIENT:
            next(ROUTES.PATIENT_DASHBOARD)
            break
          case UserRole.CLINIC:
            next(ROUTES.CLINIC_DASHBOARD)
            break
          case UserRole.DOCTOR:
            next(ROUTES.DOCTOR_DASHBOARD)
            break
          default:
            next(ROUTES.HOME)
        }
        return
      }
    }

    next()
  } catch (error) {
    console.error('Guest guard error:', error)
    next()
  }
}

/**
 * Patient guard - specific role guard for patient routes
 */
export const patientGuard = roleGuard(UserRole.PATIENT)

/**
 * Clinic guard - specific role guard for clinic routes
 */
export const clinicGuard = roleGuard(UserRole.CLINIC)

/**
 * Doctor guard - specific role guard for doctor routes
 */
export const doctorGuard = roleGuard(UserRole.DOCTOR)
