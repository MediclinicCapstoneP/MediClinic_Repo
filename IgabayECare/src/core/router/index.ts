import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { ROUTES } from '../constants/routes'
import { authGuard, guestGuard, patientGuard, clinicGuard, doctorGuard } from './guards'

/**
 * Main application router configuration
 * Following modular architecture with proper guards and lazy loading
 */

// General routes
const generalRoutes: RouteRecordRaw[] = [
  {
    path: ROUTES.HOME,
    name: 'home',
    component: () => import('../../views/HomeView.vue'),
    beforeEnter: guestGuard,
  },
  {
    path: ROUTES.LANDING,
    name: 'landing',
    component: () => import('../../views/LandingPage.vue'),
  },
  {
    path: ROUTES.ABOUT,
    name: 'about',
    component: () => import('../../views/AboutView.vue'),
  },
  {
    path: ROUTES.LEARN_MORE,
    name: 'learn-more',
    component: () => import('../../views/LearnMore.vue'),
  },
  {
    path: ROUTES.UNAUTHORIZED,
    name: 'unauthorized',
    component: () => import('../../views/UnauthorizedView.vue'),
  },
]

// Auth routes - no authentication required, but redirect if already authenticated
const authRoutes: RouteRecordRaw[] = [
  {
    path: ROUTES.SIGN_IN,
    name: 'signin',
    component: () => import('../../modules/auth/views/SignInPage.vue'),
    beforeEnter: guestGuard,
  },
  {
    path: ROUTES.SIGN_UP,
    name: 'signup',
    component: () => import('../../modules/auth/views/SignUpPage.vue'),
    beforeEnter: guestGuard,
  },
  {
    path: ROUTES.CLINIC_SIGN_IN,
    name: 'clinic-signin',
    component: () => import('../../modules/auth/views/ClinicSignInPage.vue'),
    beforeEnter: guestGuard,
  },
  {
    path: ROUTES.CLINIC_SIGN_UP,
    name: 'clinic-signup',
    component: () => import('../../modules/auth/views/ClinicSignUpPage.vue'),
    beforeEnter: guestGuard,
  },
  {
    path: ROUTES.DOCTOR_SIGN_IN,
    name: 'doctor-signin',
    component: () => import('../../modules/auth/views/DoctorSignInPage.vue'),
    beforeEnter: guestGuard,
  },
  {
    path: ROUTES.DOCTOR_SIGN_UP,
    name: 'doctor-signup',
    component: () => import('../../modules/auth/views/DoctorSignUpPage.vue'),
    beforeEnter: guestGuard,
  },
  {
    path: ROUTES.AUTH_CALLBACK,
    name: 'auth-callback',
    component: () => import('../../modules/auth/views/AuthCallback.vue'),
  },
]

// Patient routes - require patient authentication
const patientRoutes: RouteRecordRaw[] = [
  {
    path: ROUTES.PATIENT_DASHBOARD,
    name: 'patient-dashboard',
    component: () => import('../../modules/patient/views/PatientDashboard.vue'),
    beforeEnter: patientGuard,
  },
  {
    path: ROUTES.PATIENT_HOME,
    name: 'patient-home',
    component: () => import('../../modules/patient/views/PatientHome.vue'),
    beforeEnter: patientGuard,
  },
  {
    path: ROUTES.PATIENT_APPOINTMENTS,
    name: 'patient-appointments',
    component: () => import('../../modules/patient/views/PatientAppointments.vue'),
    beforeEnter: patientGuard,
  },
  {
    path: ROUTES.PATIENT_HISTORY,
    name: 'patient-history',
    component: () => import('../../modules/patient/views/PatientHistory.vue'),
    beforeEnter: patientGuard,
  },
  {
    path: ROUTES.PATIENT_PROFILE,
    name: 'patient-profile',
    component: () => import('../../modules/patient/views/PatientProfile.vue'),
    beforeEnter: patientGuard,
  },
  {
    path: ROUTES.NEARBY_CLINICS,
    name: 'nearby-clinics',
    component: () => import('../../modules/patient/views/NearbyClinic.vue'),
    beforeEnter: patientGuard,
  },
]

// Clinic routes - require clinic authentication
const clinicRoutes: RouteRecordRaw[] = [
  {
    path: ROUTES.CLINIC_DASHBOARD,
    name: 'clinic-dashboard',
    component: () => import('../../modules/clinic/views/ClinicDashboard.vue'),
    beforeEnter: clinicGuard,
  },
  {
    path: ROUTES.CLINIC_HOME,
    name: 'clinic-home',
    component: () => import('../../modules/clinic/views/ClinicHome.vue'),
    beforeEnter: clinicGuard,
  },
  {
    path: ROUTES.CLINIC_DOCTORS,
    name: 'clinic-doctors',
    component: () => import('../../modules/clinic/views/ClinicDoctors.vue'),
    beforeEnter: clinicGuard,
  },
  {
    path: ROUTES.CLINIC_PATIENTS,
    name: 'clinic-patients',
    component: () => import('../../modules/clinic/views/ClinicPatients.vue'),
    beforeEnter: clinicGuard,
  },
  {
    path: ROUTES.CLINIC_APPOINTMENTS,
    name: 'clinic-appointments',
    component: () => import('../../modules/clinic/views/ClinicAppointments.vue'),
    beforeEnter: clinicGuard,
  },
  {
    path: ROUTES.CLINIC_SETTINGS,
    name: 'clinic-settings',
    component: () => import('../../modules/clinic/views/ClinicSettings.vue'),
    beforeEnter: clinicGuard,
  },
  {
    path: ROUTES.CLINIC_MANAGE,
    name: 'clinic-manage',
    component: () => import('../../modules/clinic/views/ManageClinic.vue'),
    beforeEnter: clinicGuard,
  },
]

// Doctor routes - require doctor authentication
const doctorRoutes: RouteRecordRaw[] = [
  {
    path: ROUTES.DOCTOR_DASHBOARD,
    name: 'doctor-dashboard',
    component: () => import('../../modules/doctor/views/DoctorDashboard.vue'),
    beforeEnter: doctorGuard,
  },
  {
    path: ROUTES.DOCTOR_APPOINTMENTS,
    name: 'doctor-appointments',
    component: () => import('../../modules/doctor/views/DoctorAppointments.vue'),
    beforeEnter: doctorGuard,
  },
]

// UI Kit routes (for development)
const uiKitRoutes: RouteRecordRaw[] = [
  {
    path: ROUTES.BUTTON,
    name: 'button-demo',
    component: () => import('../../views/uikit/ButtonDoc.vue'),
  },
  {
    path: ROUTES.INPUT,
    name: 'input-demo',
    component: () => import('../../views/uikit/InputDoc.vue'),
  },
  {
    path: ROUTES.CARD,
    name: 'card-demo',
    component: () => import('../../views/uikit/CardDoc.vue'),
  },
  {
    path: ROUTES.FORM,
    name: 'form-demo',
    component: () => import('../../views/uikit/FormLayout.vue'),
  },
  {
    path: ROUTES.TABLE,
    name: 'table-demo',
    component: () => import('../../views/uikit/TableDoc.vue'),
  },
  {
    path: ROUTES.CHART,
    name: 'chart-demo',
    component: () => import('../../views/uikit/ChartDoc.vue'),
  },
]

// Combine all routes
const routes: RouteRecordRaw[] = [
  ...generalRoutes,
  ...authRoutes,
  ...patientRoutes,
  ...clinicRoutes,
  ...doctorRoutes,
  ...uiKitRoutes,
  // Catch-all route for 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../../views/NotFoundView.vue'),
  },
]

// Create router instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Return to top for new pages, restore position for back/forward
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// Global navigation guards
router.beforeEach(async (to, from, next) => {
  // Add loading indicator if needed
  // You can emit events here for global loading states
  next()
})

router.afterEach((to, from) => {
  // Update page title, analytics, etc.
  if (to.meta?.title) {
    document.title = `${to.meta.title} - IgabayECare`
  } else {
    document.title = 'IgabayECare - Healthcare Management System'
  }
})

export default router
