<template>
  <div class="patient-home-layout">
    <PatientSidebar />
    <main class="patient-home-container">
      <div class="my-appointments-container">
        <h2>My Appointments</h2>
        <table class="appointments-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Doctor/Clinic</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2024-06-01</td>
              <td>10:00 AM</td>
              <td>Dr. Smith</td>
              <td>Upcoming</td>
            </tr>
            <tr>
              <td>2024-05-20</td>
              <td>2:00 PM</td>
              <td>Clinic A</td>
              <td>Completed</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<script setup>
import PatientSidebar from '../../components/patientside/PatientSidebar.vue'
</script>

<style scoped>
.my-appointments-container {
  max-width: 700px;
  margin: 2rem auto;
  background: #fff;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
}

.appointments-table {
  width: 100%;
  border-collapse: collapse;
}

.appointments-table th,
.appointments-table td {
  border: 1px solid #e0e0e0;
  padding: 0.7rem 1rem;
  text-align: left;
}

.appointments-table th {
  background: #f5f5f5;
}
</style>
