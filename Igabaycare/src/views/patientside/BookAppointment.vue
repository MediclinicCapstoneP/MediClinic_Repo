<template>
    <div class="patient-home-layout">
        <PatientSidebar />
        <main class="patient-home-container">
            <div class="book-appointment-container">
                <h2>Book Appointment</h2>
                <form class="book-appointment-form">
                    <div class="form-group">
                        <label for="doctor">Doctor/Clinic</label>
                        <input type="text" id="doctor" class="form-control" placeholder="Select doctor or clinic" />
                    </div>
                    <div class="form-group">
                        <label for="date">Date</label>
                        <input type="date" id="date" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label for="time">Time</label>
                        <input type="time" id="time" class="form-control" />
                    </div>
                    <div class="form-group">
                        <label for="reason">Reason for Visit</label>
                        <textarea id="reason" class="form-control"
                            placeholder="Describe your reason for visit"></textarea>
                    </div>
                    <button class="btn btn-primary" type="submit">Book Appointment</button>
                </form>
            </div>
        </main>
    </div>
</template>

<script setup>
import PatientSidebar from '../../components/patientside/PatientSidebar.vue'
</script>

<style scoped>
.book-appointment-container {
    max-width: 500px;
    margin: 2rem auto;
    background: #fff;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
}

.book-appointment-form .form-group {
    margin-bottom: 1.2rem;
}

.btn-primary {
    background: #007bff;
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    padding: 0.7rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
}
</style>
