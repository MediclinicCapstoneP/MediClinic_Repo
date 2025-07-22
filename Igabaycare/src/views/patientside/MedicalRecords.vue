<template>
    <div class="patient-home-layout">
        <PatientSidebar />
        <main class="patient-home-container">
            <div class="medical-records-container">
                <h2>Medical Records</h2>
                <div class="records-placeholder">
                    <p>Your medical records will appear here.</p>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup>
import PatientSidebar from '../../components/patientside/PatientSidebar.vue'
</script>

<style scoped>
.medical-records-container {
    max-width: 700px;
    margin: 2rem auto;
    background: #fff;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
}

.records-placeholder {
    padding: 2rem;
    text-align: center;
    color: #888;
    background: #f9f9f9;
    border-radius: 0.7rem;
}
</style>
