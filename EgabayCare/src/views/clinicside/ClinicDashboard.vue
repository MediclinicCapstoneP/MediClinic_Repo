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
          <li @click="logout">🚪 Logout</li>
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
            <p>You have {{ stats.appointments }} upcoming appointments and {{ stats.doctors }} doctors registered.</p>
          </div>
  
          <div v-else-if="selected === 'bookings'">
            <h4>Appointments</h4>
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
  
  <script>
  import { supabase } from '../../services/supabase'
  
  export default {
    data() {
      return {
        selected: 'dashboard',
        clinicName: 'Clinic ABC',
        stats: {
          appointments: 5,
          doctors: 3
        }
      }
    },
    methods: {
      async logout() {
        const confirmed = confirm('Are you sure you want to log out?')
        if (!confirmed) return
        
        try {
          const { error } = await supabase.auth.signOut()
          if (error) {
            console.error('Error logging out:', error)
            alert('Error logging out: ' + error.message)
          } else {
            this.$router.push('/')
          }
        } catch (err) {
          console.error('Logout error:', err)
          alert('Error during logout')
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .clinic-dashboard {
    display: flex;
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
      flex-direction: column;
    }
  
    .sidebar {
      width: 100%;
      flex-direction: row;
      justify-content: space-around;
      padding: 1rem;
    }
  
    .sidebar ul {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  
    .main-content {
      padding: 1rem;
    }
  }
  </style>
  