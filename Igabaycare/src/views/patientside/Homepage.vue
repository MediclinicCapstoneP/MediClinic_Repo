<template>
  <div class="patient-home-layout">
    <PatientSidebar />
    <!-- Main Content -->
    <main class="patient-home-container">
      <!-- Header -->
      <header class="home-banner">
        <div class="banner-content">
          <h1>Welcome to iGabayAtiCare</h1>
          <p>Your health, your care, your way. Browse clinics, book appointments, and manage your health records all in
            one place.</p>
        </div>
        <div class="home-actions">
          <div class="avatar" :style="{ backgroundImage: `url('${avatarUrl}')` }"></div>
        </div>
      </header>
      <!-- Clinic Search -->
      <section class="clinic-search-section">
        <input v-model="clinicSearch" class="clinic-search-input" type="text"
          placeholder="Search for clinics by name, location, or specialty..." />
      </section>
      <!-- Featured Clinics -->
      <section class="clinic-list-section">
        <h2>Featured Clinics</h2>
        <div class="clinic-list">
          <div v-for="clinic in filteredFeaturedClinics" :key="clinic.name" class="clinic-card">
            <img :src="clinic.image" alt="Clinic image" class="clinic-img" />
            <h3>{{ clinic.name }}</h3>
            <p>{{ clinic.address }}</p>
          </div>
        </div>
      </section>
      <!-- Browse by Specialty -->
      <section class="specialty-list-section">
        <h2>Browse by Specialty</h2>
        <div class="specialty-list">
          <div v-for="spec in specialties" :key="spec.name" class="specialty-card">
            <img :src="spec.image" alt="Specialty image" class="specialty-img" />
            <span>{{ spec.name }}</span>
          </div>
        </div>
      </section>
      <!-- Nearby Clinics -->
      <section class="clinic-list-section">
        <h2>Nearby Clinics</h2>
        <div class="clinic-list">
          <div v-for="clinic in nearbyClinics" :key="clinic.name" class="clinic-card">
            <img :src="clinic.image" alt="Clinic image" class="clinic-img" />
            <h3>{{ clinic.name }}</h3>
            <p>{{ clinic.address }}</p>
            <span class="clinic-rating">{{ clinic.rating }}</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
defineOptions({ name: 'PatientHomepage' })
import { ref, computed } from 'vue'
import PatientSidebar from '../../components/patientside/PatientSidebar.vue'

const clinicSearch = ref('')
const avatarUrl = 'https://lh3.googleusercontent.com/aida-public/...your-avatar...'

const featuredClinics = ref([
  {
    name: 'City Center Clinic',
    address: '123 Main Street, Anytown',
    image: 'https://lh3.googleusercontent.com/aida-public/...'
  },
  {
    name: 'Uptown Medical Center',
    address: '456 Oak Avenue, Anytown',
    image: 'https://lh3.googleusercontent.com/aida-public/...'
  },
  {
    name: 'Eastside Health Clinic',
    address: '789 Pine Lane, Anytown',
    image: 'https://lh3.googleusercontent.com/aida-public/...'
  }
])

const specialties = ref([
  { name: 'General Practice', image: 'https://lh3.googleusercontent.com/aida-public/...' },
  { name: 'Pediatrics', image: 'https://lh3.googleusercontent.com/aida-public/...' },
  { name: 'Dermatology', image: 'https://lh3.googleusercontent.com/aida-public/...' },
  { name: 'Cardiology', image: 'https://lh3.googleusercontent.com/aida-public/...' },
  { name: 'Ophthalmology', image: 'https://lh3.googleusercontent.com/aida-public/...' }
])

const nearbyClinics = ref([
  {
    name: 'City Center Clinic',
    rating: '4.8 (120 reviews)',
    address: '123 Main Street, Anytown',
    image: 'https://lh3.googleusercontent.com/aida-public/...'
  },
  {
    name: 'Uptown Medical Center',
    rating: '4.5 (85 reviews)',
    address: '456 Oak Avenue, Anytown',
    image: 'https://lh3.googleusercontent.com/aida-public/...'
  },
  {
    name: 'Eastside Health Clinic',
    rating: '4.2 (60 reviews)',
    address: '789 Pine Lane, Anytown',
    image: 'https://lh3.googleusercontent.com/aida-public/...'
  }
])

const filteredFeaturedClinics = computed(() => {
  if (!clinicSearch.value) return featuredClinics.value
  const q = clinicSearch.value.toLowerCase()
  return featuredClinics.value.filter(
    c => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)
  )
})
</script>

<style scoped>
.patient-home-layout {
  display: flex;
  min-height: 100vh;
  background: #f4f8fb;
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

.avatar {
  background-size: cover;
  background-position: center;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  border: 2px solid #e0eafc;
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

.clinic-img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 0.7rem;
  margin-bottom: 0.7rem;
}

.clinic-rating {
  color: #888;
  font-size: 0.97rem;
  margin-top: 0.5rem;
}

.specialty-list-section {
  margin-bottom: 2rem;
}

.specialty-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
}

.specialty-card {
  background: #f0f2f5;
  border-radius: 0.7rem;
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  font-weight: 500;
  color: #2c3e50;
  font-size: 1rem;
}

.specialty-img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 0.5rem;
}

@media (max-width: 900px) {
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
