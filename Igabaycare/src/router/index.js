import { createRouter, createWebHistory } from 'vue-router'
import Landing from '../views/Landing.vue'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: Landing,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register-patient',
      name: 'register-patient',
      component: () => import('../views/RegisterPatient.vue'),
    },
    {
      path: '/register-clinic',
      name: 'register-clinic',
      component: () => import('../views/RegisterClinic.vue'),
    },
    {
      path: '/clinic-dashboard',
      name: 'clinic-dashboard',
      component: () => import('../views/clinicside/ClinicDashboard.vue'),
    },
    {
      path: '/patient-homepage',
      name: 'patient-homepage',
      component: () => import('../views/patientside/Homepage.vue'),
    },
    {
      path: '/patient-appointments',
      name: 'patient-appointments',
      component: () => import('../views/patientside/MyAppointments.vue'),
    },
    {
      path: '/patient-medical-records',
      name: 'patient-medical-records',
      component: () => import('../views/patientside/MedicalRecords.vue'),
    },
    {
      path: '/patient-profile',
      name: 'patient-profile',
      component: () => import('../views/patientside/PatientProfile.vue'),
    },
    {
      path: '/patient-book-appointment',
      name: 'patient-book-appointment',
      component: () => import('../views/patientside/BookAppointment.vue'),
    },
    {
      path: '/doctor-dashboard',
      name: 'doctor-dashboard',
      component: () => import('../views/doctorsside/DoctorDashboard.vue'),
    },
    {
      path: '/clinic-appointments',
      name: 'clinic-appointments',
      component: () => import('../views/clinicside/AssignDoctor.vue'),
    },
  ],
})

export default router
