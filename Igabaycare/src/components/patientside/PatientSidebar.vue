<template>
    <aside class="sidebar">
        <div class="sidebar-header">
            <img src="/favicon.ico" alt="iGabayAtiCare Logo" class="sidebar-logo" />
            <h2>iGabayAtiCare</h2>
        </div>
        <nav class="sidebar-nav">
            <ul>
                <li :class="{ active: isActive('home') }" @click="goTo('home')">
                    <span>🏠</span> Home
                </li>
                <li :class="{ active: isActive('appointments') }" @click="goTo('appointments')">
                    <span>📅</span> My Appointments
                </li>
                <li :class="{ active: isActive('records') }" @click="goTo('records')">
                    <span>📄</span> Medical Records
                </li>
                <li :class="{ active: isActive('profile') }" @click="goTo('profile')">
                    <span>👤</span> Profile
                </li>
                <li @click="logout">
                    <span>🚪</span> Logout
                </li>
            </ul>
        </nav>
    </aside>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

function goTo(page) {
    switch (page) {
        case 'home':
            router.push('/patient-homepage')
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
function logout() {
    alert('Logging out...')
    router.push('/login')
}
function isActive(page) {
    switch (page) {
        case 'home':
            return route.path === '/patient-homepage'
        case 'appointments':
            return route.path === '/patient-appointments'
        case 'records':
            return route.path === '/patient-medical-records'
        case 'profile':
            return route.path === '/patient-profile'
        default:
            return false
    }
}
</script>

<style scoped>
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

@media (max-width: 900px) {
    .sidebar {
        width: 60px;
        padding: 1rem 0.3rem 1rem 0.3rem;
    }

    .sidebar-header h2 {
        display: none;
    }

    .sidebar-nav li span+span {
        display: none;
    }
}
</style>
