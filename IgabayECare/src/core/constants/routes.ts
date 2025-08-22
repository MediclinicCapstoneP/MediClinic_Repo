/**
 * Route constants for the application
 * Centralized route definitions for better maintainability
 */

// Auth routes
export const AUTH_ROUTES = {
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  CLINIC_SIGN_IN: '/clinic-signin',
  CLINIC_SIGN_UP: '/clinic-signup',
  DOCTOR_SIGN_IN: '/doctor-signin',
  DOCTOR_SIGN_UP: '/doctor-signup',
  RESET_PASSWORD: '/reset-password',
  AUTH_CALLBACK: '/auth/callback',
} as const

// Patient routes
export const PATIENT_ROUTES = {
  DASHBOARD: '/patient/dashboard',
  HOME: '/patient/home',
  APPOINTMENTS: '/patient/appointments',
  HISTORY: '/patient/history',
  PROFILE: '/patient/profile',
  NEARBY_CLINICS: '/patient/nearby-clinics',
} as const

// Clinic routes
export const CLINIC_ROUTES = {
  DASHBOARD: '/clinic/dashboard',
  HOME: '/clinic/home',
  DOCTORS: '/clinic/doctors',
  PATIENTS: '/clinic/patients',
  APPOINTMENTS: '/clinic/appointments',
  SETTINGS: '/clinic/settings',
  MANAGE: '/clinic/manage',
} as const

// Doctor routes
export const DOCTOR_ROUTES = {
  DASHBOARD: '/doctor/dashboard',
  APPOINTMENTS: '/doctor/appointments',
  PATIENTS: '/doctor/patients',
  SCHEDULE: '/doctor/schedule',
  PROFILE: '/doctor/profile',
} as const

// General routes
export const GENERAL_ROUTES = {
  HOME: '/',
  LANDING: '/landing',
  ABOUT: '/about',
  LEARN_MORE: '/learn-more',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/404',
} as const

// UI Kit routes (for development/demo)
export const UIKIT_ROUTES = {
  BASE: '/uikit',
  BUTTON: '/uikit/button',
  INPUT: '/uikit/input',
  CARD: '/uikit/card',
  FORM: '/uikit/form',
  TABLE: '/uikit/table',
  CHART: '/uikit/chart',
} as const

// All routes combined
export const ROUTES = {
  ...AUTH_ROUTES,
  ...PATIENT_ROUTES,
  ...CLINIC_ROUTES,
  ...DOCTOR_ROUTES,
  ...GENERAL_ROUTES,
  ...UIKIT_ROUTES,
} as const

// Route path helpers
export const getPatientRoute = (path: keyof typeof PATIENT_ROUTES) => PATIENT_ROUTES[path]
export const getClinicRoute = (path: keyof typeof CLINIC_ROUTES) => CLINIC_ROUTES[path]
export const getDoctorRoute = (path: keyof typeof DOCTOR_ROUTES) => DOCTOR_ROUTES[path]
export const getAuthRoute = (path: keyof typeof AUTH_ROUTES) => AUTH_ROUTES[path]
export const getGeneralRoute = (path: keyof typeof GENERAL_ROUTES) => GENERAL_ROUTES[path]
