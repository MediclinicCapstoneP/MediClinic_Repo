import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../services/supabase' // adjust path if needed
import Login from '../views/Login.vue'
import RegisterPatient from '../views/RegisterPatient.vue'
import Landing from '../views/Landing.vue'
import RegisterClinic from '../views/RegisterClinic.vue'

const routes = [
  { path: '/', name: 'Landing', component: Landing },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register-patient', name: 'RegisterPatient', component: RegisterPatient },
  { path: '/register-clinic', name: 'RegisterClinic', component: RegisterClinic },
  
  // Dashboard routes
  { path: '/clinic-dashboard', name: 'ClinicDashboard', component: () => import('../views/clinicside/ClinicDashboard.vue') },
  { path: '/patient-dashboard', name: 'PatientDashboard', component: () => import('../views/patientside/PatientDashboard.vue') },
  { path: '/doctor-dashboard', name: 'DoctorDashboard', component: () => import('../views/doctorsside/DoctorDashboard.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard to redirect logged-in users to their role-specific home
router.beforeEach(async (to, from, next) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      next()
      return
    }

    if (!user) {
      // No logged-in user: allow public pages
      next()
      return
    }

    const email = user.email

    // Check if the email exists in clinics table
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (clinicError) {
      console.error('Error checking clinic:', clinicError)
    } else if (clinicData) {
      // User is a clinic
      if (to.path === '/login' || to.path.startsWith('/register')) {
        return next('/clinic-dashboard')
      }
      next()
      return
    }

    // Check if the email exists in patients table
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (patientError) {
      console.error('Error checking patient:', patientError)
    } else if (patientData) {
      // User is a patient
      if (to.path === '/login' || to.path.startsWith('/register')) {
        return next('/patient-dashboard')
      }
      next()
      return
    }

    // Check if the email exists in doctors table
    const { data: doctorData, error: doctorError } = await supabase
      .from('doctors')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (doctorError) {
      console.error('Error checking doctor:', doctorError)
    } else if (doctorData) {
      // User is a doctor
      if (to.path === '/login' || to.path.startsWith('/register')) {
        return next('/doctor-dashboard')
      }
      next()
      return
    }

    // If user exists but not found in any role table, allow navigation
    // This could happen if user registration is incomplete
    next()
    
  } catch (err) {
    console.error('Unexpected error in navigation guard:', err)
    // On error, allow navigation to prevent blocking the app
    next()
  }
})

export default router