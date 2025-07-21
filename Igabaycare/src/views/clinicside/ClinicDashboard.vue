<template>
  <div class="clinic-dashboard">
    <!-- Sidebar -->
    <nav class="sidebar">
      <h3 class="logo">iGabayAtiCare</h3>
      <ul>
        <li :class="{ active: selected === 'dashboard' }" @click="selected = 'dashboard'">🏥 Dashboard</li>
        <li :class="{ active: selected === 'bookings' }" @click="selected = 'bookings'">📅 Appointments</li>
        <li :class="{ active: selected === 'doctors' }" @click="selected = 'doctors'">👨‍⚕️ Doctors</li>
        <li :class="{ active: selected === 'profile' }" @click="selected = 'profile'">📝 Profile</li>
        <li @click="signOut">🚪 Logout</li>
      </ul>
    </nav>

    <!-- Main Content -->
    <div class="main-content">
      <header class="dashboard-header">
        <h2>Welcome, {{ clinicName }}</h2>
        <p>Manage your clinic below.</p>
      </header>

      <div class="content-body">
        <div v-if="selected === 'dashboard'">
          <h4>Overview</h4>
          <div class="row g-4 mb-4">
            <div class="col-12 col-md-6">
              <div class="card text-center shadow-sm">
                <div class="card-body">
                  <h5 class="card-title">Upcoming Appointments</h5>
                  <p class="display-6 fw-bold text-primary mb-0">{{ stats.appointments }}</p>
                  <p class="mb-0">appointments scheduled</p>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="card text-center shadow-sm">
                <div class="card-body">
                  <h5 class="card-title">Available Slots</h5>
                  <p class="display-6 fw-bold text-success mb-0">{{ stats.availableSlots || 8 }}</p>
                  <p class="mb-0">slots open for booking</p>
                </div>
              </div>
            </div>
          </div>
          <p>You have {{ stats.appointments }} upcoming appointments and {{ stats.doctors }} doctors registered.</p>
        </div>

        <div v-else-if="selected === 'bookings'">
          <h4>Appointments</h4>
          <button class="btn btn-primary mb-3" @click="goToAppointments">Manage Appointments</button>
          <p>[List of appointments will go here]</p>
        </div>

        <div v-else-if="selected === 'doctors'">
          <h4>Doctors</h4>
          <p>[Doctor management section]</p>
        </div>

        <div v-else-if="selected === 'profile'">
          <h4>Clinic Profile</h4>
          <p>[Profile editing will go here]</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { supabase } from '../../supabase'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const selected = ref('dashboard')
const clinicName = ref('Clinic ABC')
const stats = ref({ appointments: 5, doctors: 3 })

async function signOut() {
  const confirmed = confirm('Are you sure you want to log out?')
  if (!confirmed) return
  const { error } = await supabase.auth.signOut()
  if (!error) {
    router.push('/')
  } else {
    alert('Error logging out: ' + error.message)
    console.error('Sign out error:', error)
  }
}

function goToAppointments() {
  router.push('/clinic-appointments')
}
</script>

<style scoped>
.clinic-dashboard {
  display: flex;
  flex-direction: row;
  height: 100vh;
  font-family: 'Segoe UI', sans-serif;
}

.sidebar {
  width: 240px;
  background: #007bff;
  color: #fff;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.sidebar .logo {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 2rem;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li {
  padding: 0.7rem 1rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.sidebar li:hover,
.sidebar li.active {
  background-color: #0056b3;
}

.main-content {
  flex-grow: 1;
  background: #f8f9fa;
  padding: 2rem;
  overflow-y: auto;
}

.dashboard-header h2 {
  margin-bottom: 0.5rem;
}

.content-body {
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .clinic-dashboard {
    flex-direction: column !important;
    height: auto;
  }

  .sidebar {
    width: 100% !important;
    flex-direction: row !important;
    justify-content: space-around !important;
    padding: 1rem !important;
  }

  .sidebar ul {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 0.5rem !important;
  }

  .main-content {
    padding: 1rem !important;
  }
}
</style>
