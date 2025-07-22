<template>
    <div class="patient-home-layout">
        <aside class="sidebar">
            <div class="sidebar-header">
                <img src="/favicon.ico" alt="iGabayAtiCare Logo" class="sidebar-logo" />
                <h2>iGabayAtiCare</h2>
            </div>
            <nav class="sidebar-nav">
                <ul>
                    <li :class="{ active: currentPage === 'home' }" @click="goTo('home')">
                        <span>🏠</span> Home
                    </li>
                    <li :class="{ active: currentPage === 'clinics' }" @click="goTo('clinics')">
                        <span>🏥</span> Browse Clinics
                    </li>
                    <li :class="{ active: currentPage === 'appointments' }" @click="goTo('appointments')">
                        <span>📅</span> My Appointments
                    </li>
                    <li :class="{ active: currentPage === 'records' }" @click="goTo('records')">
                        <span>📄</span> Medical Records
                    </li>
                    <li :class="{ active: currentPage === 'profile' }" @click="goTo('profile')">
                        <span>👤</span> Profile
                    </li>
                    <li @click="openAIChat">
                        <span>🤖</span> Chat with AI
                    </li>
                    <li @click="logout">
                        <span>🚪</span> Logout
                    </li>
                </ul>
            </nav>
        </aside>
        <main class="patient-home-container">
            <div class="home-banner">
                <div class="banner-content">
                    <h1>Welcome to iGabayAtiCare</h1>
                    <p>Your health, your care, your way. Browse clinics, book appointments, and manage your health
                        records all in one place.</p>
                </div>
                <div class="home-actions">
                    <button class="appointments-btn" @click="goToAppointments">My Appointments</button>
                </div>
            </div>

            <section class="clinic-search-section">
                <input v-model="searchQuery" class="clinic-search-input" type="text"
                    placeholder="Search clinics by name, location, or specialty..." />
            </section>

            <section class="clinic-list-section">
                <h2>Browse Clinics</h2>
                <div v-if="filteredClinics.length === 0" class="no-clinics">No clinics found.</div>
                <div v-else class="clinic-list">
                    <div v-for="clinic in filteredClinics" :key="clinic.id" class="clinic-card">
                        <h3>{{ clinic.name }}</h3>
                        <p>{{ clinic.address }}</p>
                        <button class="view-btn" @click="viewClinic(clinic.id)">View Clinic</button>
                    </div>
                </div>
            </section>

            <button class="ai-chat-btn" @click="openAIChat" title="Chat with AI">
                🤖
            </button>
        </main>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')
const currentPage = ref('home')

// Placeholder clinics data
const clinics = ref([
    { id: 1, name: 'Sunrise Medical Clinic', address: '123 Main St, Cityville' },
    { id: 2, name: 'HealthFirst Family Clinic', address: '456 Oak Ave, Townsville' },
    { id: 3, name: 'Wellness Center', address: '789 Pine Rd, Villagetown' },
])

const filteredClinics = computed(() => {
    if (!searchQuery.value) return clinics.value
    const q = searchQuery.value.toLowerCase()
    return clinics.value.filter(
        c => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)
    )
})

function goToAppointments() {
    router.push('/patient-appointments')
    currentPage.value = 'appointments'
}

function viewClinic(id) {
    // Navigate to clinic details page (to be implemented)
    router.push(`/clinic/${id}`)
    currentPage.value = 'clinics'
}

function openAIChat() {
    // Placeholder for opening AI chat
    alert('AI chat coming soon!')
}

function logout() {
    // Placeholder for logout logic
    alert('Logging out...')
    router.push('/login')
}

function goTo(page) {
    currentPage.value = page
    switch (page) {
        case 'home':
            router.push('/patient-home')
            break
        case 'clinics':
            // Stay on this page or implement a separate clinics page
            break
        case 'appointments':
            router.push('/patient-appointments')
            break
        case 'records':
            router.push('/patient-medical-records')
            break
        case 'profile':
            router.push('/patient-profile')
            break
        default:
            break
    }
}
</script>

<style scoped>
.patient-home-layout {
    display: flex;
    min-height: 100vh;
    background: #f4f8fb;
}

.sidebar {
    width: 230px;
    background: #fff;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem 1rem 1rem;
    min-height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 10;
}

.sidebar-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
}

.sidebar-logo {
    width: 48px;
    height: 48px;
    margin-bottom: 0.5rem;
}

.sidebar-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
    width: 100%;
}

.sidebar-nav li {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.8rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    color: #2c3e50;
    font-weight: 500;
    margin-bottom: 0.3rem;
    transition: background 0.2s, color 0.2s;
}

.sidebar-nav li.active,
.sidebar-nav li:hover {
    background: #007bff;
    color: #fff;
}

.patient-home-container {
    flex: 1;
    margin-left: 230px;
    padding: 2rem 1rem 4rem 1rem;
    position: relative;
    background: #f4f8fb;
}

.home-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(90deg, #e0eafc 0%, #cfdef3 100%);
    border-radius: 1.2rem;
    box-shadow: 0 4px 24px 0 rgba(31, 38, 135, 0.10);
    padding: 2rem 2.5rem;
    margin-bottom: 2.5rem;
    gap: 2rem;
}

.banner-content h1 {
    margin: 0 0 0.5rem 0;
    color: #007bff;
    font-size: 2.1rem;
    font-weight: 700;
}

.banner-content p {
    margin: 0;
    color: #555;
    font-size: 1.1rem;
}

.home-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.appointments-btn {
    background: #007bff;
    color: #fff;
    border: none;
    border-radius: 0.7rem;
    padding: 0.9rem 2rem;
    font-weight: 600;
    font-size: 1.1rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.08);
    transition: background 0.2s;
}

.appointments-btn:hover {
    background: #0056b3;
}

.clinic-search-section {
    margin-bottom: 2rem;
}

.clinic-search-input {
    width: 100%;
    padding: 1rem 1.2rem;
    border: 1px solid #d1d5db;
    border-radius: 0.9rem;
    font-size: 1.1rem;
    background: #f9fafb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.clinic-list-section {
    margin-bottom: 2rem;
}

.clinic-list-section h2 {
    color: #2c3e50;
    margin-bottom: 1.2rem;
    font-size: 1.3rem;
    font-weight: 600;
}

.clinic-list {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
}

.clinic-card {
    background: #fff;
    border-radius: 1rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
    padding: 1.5rem 1.2rem;
    min-width: 250px;
    flex: 1 1 250px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    transition: box-shadow 0.2s, transform 0.2s;
}

.clinic-card:hover {
    box-shadow: 0 8px 32px rgba(0, 123, 255, 0.13);
    transform: translateY(-2px) scale(1.03);
}

.clinic-card h3 {
    margin: 0 0 0.5rem 0;
    color: #007bff;
    font-size: 1.2rem;
    font-weight: 600;
}

.clinic-card p {
    margin: 0 0 1rem 0;
    color: #555;
    font-size: 1rem;
}

.view-btn {
    background: #3498db;
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1.2rem;
    font-weight: 500;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s;
}

.view-btn:hover {
    background: #217dbb;
}

.no-clinics {
    color: #888;
    text-align: center;
    padding: 2rem;
    background: #f9fafb;
    border-radius: 0.7rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.ai-chat-btn {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #fff;
    border: 2px solid #007bff;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    font-size: 2rem;
    color: #007bff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    cursor: pointer;
    z-index: 1000;
    transition: background 0.2s, color 0.2s;
}

.ai-chat-btn:hover {
    background: #007bff;
    color: #fff;
}

@media (max-width: 900px) {
    .sidebar {
        width: 60px;
        padding: 1rem 0.3rem 1rem 0.3rem;
    }

    .sidebar-header h2 {
        display: none;
    }

    .patient-home-container {
        margin-left: 60px;
    }

    .sidebar-nav li span+span {
        display: none;
    }

    .home-banner {
        flex-direction: column;
        align-items: flex-start;
        padding: 1.2rem 1rem;
        gap: 1rem;
    }
}
</style>
