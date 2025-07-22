<template>
    <div class="patient-home-layout">
        <PatientSidebar />
        <main class="patient-home-container">
            <div class="patient-profile-container">
                <h2>My Profile</h2>
                <form class="profile-form">
                    <div class="form-group">
                        <label for="name">Full Name</label>
                        <input type="text" id="name" class="form-control" placeholder="Your name" />
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" class="form-control" placeholder="Your email" />
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone</label>
                        <input type="text" id="phone" class="form-control" placeholder="Your phone" />
                    </div>
                    <div class="form-group">
                        <label for="address">Address</label>
                        <input type="text" id="address" class="form-control" placeholder="Your address" />
                    </div>
                    <button class="btn btn-primary" type="submit">Update Profile</button>
                </form>
            </div>
        </main>
    </div>
</template>

<script setup>
import PatientSidebar from '../../components/patientside/PatientSidebar.vue'
</script>

<style scoped>
.patient-profile-container {
    max-width: 500px;
    margin: 2rem auto;
    background: #fff;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
}

.profile-form .form-group {
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
