<template>
    <div class="container py-4">
        <h2 class="mb-4">Appointments</h2>
        <div class="card shadow-sm">
            <div class="card-body">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>Appointment ID</th>
                            <th>Patient Name</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Assign Doctor</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="appt in appointments" :key="appt.id">
                            <td>{{ appt.id }}</td>
                            <td>{{ appt.patient }}</td>
                            <td>{{ appt.date }}</td>
                            <td>{{ appt.time }}</td>
                            <td>
                                <select v-model="appt.selectedDoctor" class="form-select">
                                    <option disabled value="">Select Doctor</option>
                                    <option v-for="doc in doctors" :key="doc.id" :value="doc.name">{{ doc.name }}
                                    </option>
                                </select>
                            </td>
                            <td>
                                <button class="btn btn-success btn-sm" @click="assignDoctor(appt)">Assign</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <button class="btn btn-secondary mt-3" @click="goBack">Back to Dashboard</button>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const appointments = ref([
    { id: 1, patient: 'John Doe', date: '2024-06-10', time: '10:00 AM', selectedDoctor: '' },
    { id: 2, patient: 'Jane Smith', date: '2024-06-11', time: '2:00 PM', selectedDoctor: '' },
])

const doctors = ref([
    { id: 1, name: 'Dr. Alice' },
    { id: 2, name: 'Dr. Bob' },
    { id: 3, name: 'Dr. Carol' },
])

function assignDoctor(appt) {
    if (!appt.selectedDoctor) {
        alert('Please select a doctor.')
        return
    }
    alert(`Assigned ${appt.selectedDoctor} to appointment #${appt.id}`)
}

function goBack() {
    router.push('/clinic-dashboard')
}
</script>

<style scoped>
.table {
    margin-bottom: 0;
}
</style>
