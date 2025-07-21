<template>
  <div class="doctor-dashboard">
    <div class="dashboard-header">
      <h1>Doctor Dashboard</h1>
      <div class="user-info">
        <span>Welcome, Dr. {{ doctorName }}</span>
        <button @click="signOut" class="logout-btn">Logout</button>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Today's Appointments</h3>
          <p class="stat-number">{{ todayAppointments }}</p>
        </div>
        <div class="stat-card">
          <h3>Total Patients</h3>
          <p class="stat-number">{{ totalPatients }}</p>
        </div>
        <div class="stat-card">
          <h3>Pending Reports</h3>
          <p class="stat-number">{{ pendingReports }}</p>
        </div>
      </div>

      <div class="actions-section">
        <h2>Quick Actions</h2>
        <div class="action-buttons">
          <button @click="viewSchedule" class="action-btn primary">
            View Schedule
          </button>
          <button @click="managePatients" class="action-btn secondary">
            Manage Patients
          </button>
          <button @click="updateProfile" class="action-btn secondary">
            Update Profile
          </button>
        </div>
      </div>

      <div class="upcoming-appointments">
        <h2>Today's Appointments</h2>
        <div v-if="appointments.length === 0" class="no-appointments">
          <p>No appointments scheduled for today</p>
        </div>
        <div v-else class="appointments-list">
          <div v-for="appointment in appointments" :key="appointment.id" class="appointment-item">
            <div class="appointment-time">
              <span class="time">{{ appointment.time }}</span>
              <span class="duration">{{ appointment.duration }} min</span>
            </div>
            <div class="appointment-details">
              <h4>{{ appointment.patientName }}</h4>
              <p>{{ appointment.reason }}</p>
              <span class="appointment-type">{{ appointment.type }}</span>
            </div>
            <div class="appointment-actions">
              <button @click="startConsultation(appointment.id)" class="action-btn-small primary">
                Start
              </button>
              <button @click="reschedule(appointment.id)" class="action-btn-small secondary">
                Reschedule
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="recent-patients">
        <h2>Recent Patients</h2>
        <div v-if="recentPatients.length === 0" class="no-patients">
          <p>No recent patients</p>
        </div>
        <div v-else class="patients-list">
          <div v-for="patient in recentPatients" :key="patient.id" class="patient-item">
            <div class="patient-avatar">
              {{ patient.name.charAt(0) }}
            </div>
            <div class="patient-info">
              <h4>{{ patient.name }}</h4>
              <p>{{ patient.lastVisit }}</p>
            </div>
            <button @click="viewPatient(patient.id)" class="view-btn">
              View
            </button>
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
const doctorName = ref('Doctor')
const todayAppointments = ref(0)
const totalPatients = ref(0)
const pendingReports = ref(0)
const appointments = ref([])
const recentPatients = ref([])

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

const viewSchedule = () => {
  console.log('Navigate to schedule view')
}

const managePatients = () => {
  console.log('Navigate to patient management')
}

const updateProfile = () => {
  console.log('Navigate to profile update')
}

const startConsultation = (appointmentId) => {
  console.log('Start consultation for appointment:', appointmentId)
}

const reschedule = (appointmentId) => {
  console.log('Reschedule appointment:', appointmentId)
}

const viewPatient = (patientId) => {
  console.log('View patient:', patientId)
}

const loadDoctorData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get doctor data
    const { data: doctorData } = await supabase
      .from('doctors')
      .select('*')
      .eq('email', user.email)
      .single()

    if (doctorData) {
      doctorName.value = doctorData.name || 'Doctor'
    }

    // Load mock data for now
    todayAppointments.value = 4
    totalPatients.value = 127
    pendingReports.value = 3

    appointments.value = [
      {
        id: 1,
        time: '09:00 AM',
        duration: 30,
        patientName: 'John Smith',
        reason: 'Annual checkup',
        type: 'Regular'
      },
      {
        id: 2,
        time: '10:30 AM',
        duration: 45,
        patientName: 'Sarah Johnson',
        reason: 'Follow-up consultation',
        type: 'Follow-up'
      },
      {
        id: 3,
        time: '02:00 PM',
        duration: 60,
        patientName: 'Michael Brown',
        reason: 'Chronic condition review',
        type: 'Consultation'
      }
    ]

    recentPatients.value = [
      {
        id: 1,
        name: 'John Smith',
        lastVisit: '2 days ago'
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        lastVisit: '1 week ago'
      },
      {
        id: 3,
        name: 'Michael Brown',
        lastVisit: '3 days ago'
      }
    ]
  } catch (error) {
    console.error('Error loading doctor data:', error)
  }
}

onMounted(() => {
  loadDoctorData()
})
</script>

<style scoped>
.doctor-dashboard {
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  color: #27ae60;
  margin: 0;
}

.actions-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  background-color: #27ae60;
  color: white;
}

.action-btn.primary:hover {
  background-color: #229954;
}

.action-btn.secondary {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.action-btn.secondary:hover {
  background-color: #bdc3c7;
}

.upcoming-appointments,
.recent-patients {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.upcoming-appointments h2,
.recent-patients h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.no-appointments,
.no-patients {
  text-align: center;
  color: #7f8c8d;
  padding: 40px;
}

.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.appointment-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px;
  border: 1px solid #ecf0f1;
  border-radius: 6px;
}

.appointment-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.time {
  font-weight: bold;
  color: #2c3e50;
  font-size: 16px;
}

.duration {
  color: #7f8c8d;
  font-size: 12px;
}

.appointment-details {
  flex: 1;
}

.appointment-details h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.appointment-details p {
  margin: 0 0 5px 0;
  color: #7f8c8d;
}

.appointment-type {
  background-color: #3498db;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.appointment-actions {
  display: flex;
  gap: 10px;
}

.action-btn-small {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.action-btn-small.primary {
  background-color: #27ae60;
  color: white;
}

.action-btn-small.secondary {
  background-color: #ecf0f1;
  color: #2c3e50;
}

.patients-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.patient-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #ecf0f1;
  border-radius: 6px;
}

.patient-avatar {
  width: 40px;
  height: 40px;
  background-color: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.patient-info {
  flex: 1;
}

.patient-info h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.patient-info p {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.view-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.view-btn:hover {
  background-color: #2980b9;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .appointment-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .appointment-actions {
    align-self: stretch;
    justify-content: space-between;
  }
}
</style> 