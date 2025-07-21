<template>
  <div class="patient-dashboard">
    <div class="dashboard-header">
      <h1>Patient Dashboard</h1>
      <div class="user-info">
        <span>Welcome, {{ patientName }}</span>
        <button @click="signOut" class="logout-btn">Logout</button>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Upcoming Appointments</h3>
          <p class="stat-number">{{ upcomingAppointments }}</p>
        </div>
        <div class="stat-card">
          <h3>Past Appointments</h3>
          <p class="stat-number">{{ pastAppointments }}</p>
        </div>
        <div class="stat-card">
          <h3>Medical Records</h3>
          <p class="stat-number">{{ medicalRecords }}</p>
        </div>
      </div>

      <div class="actions-section">
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <button @click="bookAppointment" class="action-btn primary">
            Book Appointment
          </button>
          <button @click="viewMedicalHistory" class="action-btn secondary">
            View Medical History
          </button>
          <button @click="updateProfile" class="action-btn secondary">
            Update Profile
          </button>
        </div>
      </div>

      <div class="recent-activity">
        <h2>Recent Activity</h2>
        <div v-if="recentActivity.length === 0" class="no-activity">
          <p>No recent activity</p>
        </div>
        <div v-else class="activity-list">
          <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
            <div class="activity-icon">📋</div>
            <div class="activity-content">
              <h4>{{ activity.title }}</h4>
              <p>{{ activity.description }}</p>
              <span class="activity-date">{{ formatDate(activity.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../services/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()

// Reactive data
const patientName = ref('Patient')
const upcomingAppointments = ref(0)
const pastAppointments = ref(0)
const medicalRecords = ref(0)
const recentActivity = ref([])

// Methods
const signOut = async () => {
  const confirmed = confirm('Are you sure you want to log out?')
  if (!confirmed) return

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

const bookAppointment = () => {
  // Navigate to appointment booking page
  console.log('Navigate to appointment booking')
}

const viewMedicalHistory = () => {
  // Navigate to medical history page
  console.log('Navigate to medical history')
}

const updateProfile = () => {
  // Navigate to profile update page
  console.log('Navigate to profile update')
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString()
}

const loadPatientData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get patient data
    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('email', user.email)
      .single()

    if (patientData) {
      patientName.value = patientData.name || 'Patient'
    }

    // Load mock data for now
    upcomingAppointments.value = 2
    pastAppointments.value = 5
    medicalRecords.value = 3
    recentActivity.value = [
      {
        id: 1,
        title: 'Appointment Scheduled',
        description: 'Your appointment with Dr. Smith has been confirmed for next week.',
        date: new Date()
      },
      {
        id: 2,
        title: 'Medical Record Updated',
        description: 'Your latest test results have been added to your medical records.',
        date: new Date(Date.now() - 86400000) // 1 day ago
      }
    ]
  } catch (error) {
    console.error('Error loading patient data:', error)
  }
}

onMounted(() => {
  loadPatientData()
})
</script>

<style scoped>
.patient-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.dashboard-header h1 {
  color: #2c3e50;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logout-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover {
  background-color: #c0392b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  color: #7f8c8d;
  font-size: 16px;
}

.stat-number {
  font-size: 2.5em;
  font-weight: bold;
  color: #3498db;
  margin: 0;
}

.actions-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.actions-section h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.action-btn.primary {
  background-color: #3498db;
  color: white;
}

.action-btn.primary:hover {
  background-color: #2980b9;
}

.action-btn.secondary {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.action-btn.secondary:hover {
  background-color: #bdc3c7;
}

.recent-activity {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.recent-activity h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.no-activity {
  text-align: center;
  color: #7f8c8d;
  padding: 40px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  border: 1px solid #ecf0f1;
  border-radius: 6px;
}

.activity-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.activity-content h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
  font-size: 16px;
}

.activity-content p {
  margin: 0 0 5px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.activity-date {
  color: #95a5a6;
  font-size: 12px;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr !important;
  }

  .action-buttons {
    flex-direction: column !important;
    gap: 10px !important;
  }
}
</style>
