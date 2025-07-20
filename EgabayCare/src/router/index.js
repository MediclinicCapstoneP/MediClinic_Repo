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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard to redirect logged-in users
router.beforeEach(async (to, from, next) => {
  const { data } = await supabase.auth.getUser()
  const user = data.user

  // If not logged in, allow access to login/register pages
  if (!user) {
    next()
    return
  }

  // Fetch user profile from 'patients' or 'clinics' table
  let role = null
  // Try to find patient
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', user.id)
    .single()
  if (patient) role = 'patient'

  // Try to find clinic
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id')
    .eq('id', user.id)
    .single()
  if (clinic) role = 'clinic'

  // Redirect based on role
  if (to.path === '/login' || to.path === '/register-patient' || to.path === '/register-clinic') {
    if (role === 'patient') {
      next('/patient-home')
      return
    }
    if (role === 'clinic') {
      next('/clinic-home')
      return
    }
  }
  next()
})

export default router