import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LandingPage from '../views/LandingPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/landing',
      name: 'landing',
      component: LandingPage,
    },
    {
      path: '/learn-more',
      name: 'learn-more',
      component: () => import('../views/LearnMore.vue'),
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
      // TODO: Verify if AboutView.vue exists and update path if needed
    },
    // Clinic routes
    {
      path: '/clinic/dashboard',
      name: 'clinic-dashboard',
      component: () => import('../views/clinic/ClinicDashboard.vue'),
    },
    {
      path: '/clinic/home',
      name: 'clinic-home',
      component: () => import('../views/clinic/ClinicHome.vue'),
    },
    {
      path: '/clinic/doctors',
      name: 'clinic-doctors',
      component: () => import('../views/clinic/ClinicDoctors.vue'),
    },
    {
      path: '/clinic/patients',
      name: 'clinic-patients',
      component: () => import('../views/clinic/ClinicPatients.vue'),
    },
    {
      path: '/clinic/settings',
      name: 'clinic-settings',
      component: () => import('../views/clinic/ClinicSettings.vue'),
    },
    {
      path: '/clinic/manage',
      name: 'manage-clinic',
      component: () => import('../views/clinic/ManageClinic.vue'),
    },
    {
      path: '/clinic/appointment',
      name: 'clinic-appointment',
      component: () => import('../views/clinic/Appointment.vue'),
    },
    // Doctor routes
    {
      path: '/doctor/dashboard',
      name: 'doctor-dashboard',
      component: () => import('../views/doctor/DoctorDashboard.vue'),
    },
    {
      path: '/doctor/appointments',
      name: 'doctor-appointments',
      component: () => import('../views/doctor/DoctorAppointments.vue'),
    },
    // Patient routes
    {
      path: '/patient/dashboard',
      name: 'patient-dashboard',
      component: () => import('../views/patient/PatientDashboard.vue'),
    },
    {
      path: '/patient/home',
      name: 'patient-home',
      component: () => import('../views/patient/PatientHome.vue'),
    },
    {
      path: '/patient/appointments',
      name: 'patient-appointments',
      component: () => import('../views/patient/PatientAppointments.vue'),
    },
    {
      path: '/patient/history',
      name: 'patient-history',
      component: () => import('../views/patient/PatientHistory.vue'),
    },
    {
      path: '/patient/profile',
      name: 'patient-profile',
      component: () => import('../views/patient/PatientProfile.vue'),
    },
    {
      path: '/patient/nearby-clinics',
      name: 'nearby-clinics',
      component: () => import('../views/patient/NearbyClinic.vue'),
    },
    // UI Kit routes
    {
      path: '/uikit/button',
      name: 'button',
      component: () => import('../views/uikit/ButtonDoc.vue'),
    },
    {
      path: '/uikit/chart',
      name: 'chart',
      component: () => import('../views/uikit/ChartDoc.vue'),
    },
    {
      path: '/uikit/file',
      name: 'file',
      component: () => import('../views/uikit/FileDoc.vue'),
    },
    {
      path: '/uikit/form',
      name: 'form',
      component: () => import('../views/uikit/FormLayout.vue'),
    },
    {
      path: '/uikit/input',
      name: 'input',
      component: () => import('../views/uikit/InputDoc.vue'),
    },
    {
      path: '/uikit/list',
      name: 'list',
      component: () => import('../views/uikit/ListDoc.vue'),
    },
    {
      path: '/uikit/media',
      name: 'media',
      component: () => import('../views/uikit/MediaDoc.vue'),
    },
    {
      path: '/uikit/menu',
      name: 'menu',
      component: () => import('../views/uikit/MenuDoc.vue'),
    },
    {
      path: '/uikit/messages',
      name: 'messages',
      component: () => import('../views/uikit/MessagesDoc.vue'),
    },
    {
      path: '/uikit/misc',
      name: 'misc',
      component: () => import('../views/uikit/MiscDoc.vue'),
    },
    {
      path: '/uikit/overlay',
      name: 'overlay',
      component: () => import('../views/uikit/OverlayDoc.vue'),
    },
    {
      path: '/uikit/panel',
      name: 'panel',
      component: () => import('../views/uikit/PanelsDoc.vue'),
    },
    {
      path: '/uikit/table',
      name: 'table',
      component: () => import('../views/uikit/TableDoc.vue'),
    },
    {
      path: '/uikit/timeline',
      name: 'timeline',
      component: () => import('../views/uikit/TimelineDoc.vue'),
    },
    {
      path: '/uikit/tree',
      name: 'tree',
      component: () => import('../views/uikit/TreeDoc.vue'),
    },
  ],
})

export default router
