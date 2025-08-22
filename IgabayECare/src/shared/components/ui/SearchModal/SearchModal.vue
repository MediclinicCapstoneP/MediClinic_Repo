<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold text-gray-900">Search Results</h2>
          <button
            @click="emit('close')"
            class="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X :size="24" />
          </button>
        </div>

        <!-- Search Bar -->
        <form @submit.prevent="handleSearch" class="relative">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" :size="20" />
            <input
              v-model="query"
              type="text"
              placeholder="Search doctors, clinics, specialties..."
              class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autofocus
            />
          </div>
        </form>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200">
        <button
          @click="activeTab = 'all'"
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeTab === 'all'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          All ({{ filteredDoctors.length + filteredClinics.length }})
        </button>
        <button
          @click="activeTab = 'doctors'"
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeTab === 'doctors'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          Doctors ({{ filteredDoctors.length }})
        </button>
        <button
          @click="activeTab = 'clinics'"
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeTab === 'clinics'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          Clinics ({{ filteredClinics.length }})
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Doctors Section -->
        <div
          v-if="(activeTab === 'all' || activeTab === 'doctors') && filteredDoctors.length > 0"
          class="mb-8"
        >
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Doctors</h3>
          <div class="space-y-4">
            <div
              v-for="doctor in filteredDoctors"
              :key="doctor.id"
              @click="handleDoctorSelect(doctor)"
              class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <img
                  v-if="doctor.image"
                  :src="doctor.image"
                  :alt="doctor.name"
                  class="w-full h-full rounded-full object-cover"
                />
                <User v-else :size="24" class="text-gray-400" />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-900 truncate">{{ doctor.name }}</h4>
                <p class="text-sm text-gray-600 mb-1">{{ doctor.specialties.join(', ') }}</p>
                <div class="flex items-center space-x-4 text-sm text-gray-500">
                  <div v-if="doctor.rating" class="flex items-center">
                    <Star :size="14" class="text-yellow-400 mr-1" />
                    <span>{{ doctor.rating }}</span>
                  </div>
                  <span v-if="doctor.experience">{{ doctor.experience }} experience</span>
                  <div v-if="doctor.location" class="flex items-center">
                    <MapPin :size="14" class="mr-1" />
                    <span>{{ doctor.location }}</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Book Appointment
              </Button>
            </div>
          </div>
        </div>

        <!-- Clinics Section -->
        <div v-if="(activeTab === 'all' || activeTab === 'clinics') && filteredClinics.length > 0">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Clinics</h3>
          <div class="space-y-4">
            <div
              v-for="clinic in filteredClinics"
              :key="clinic.id"
              @click="handleClinicSelect(clinic)"
              class="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <img
                  v-if="clinic.image"
                  :src="clinic.image"
                  :alt="clinic.name"
                  class="w-full h-full rounded-lg object-cover"
                />
                <Building v-else :size="24" class="text-gray-400" />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-900 truncate">{{ clinic.name }}</h4>
                <div class="flex items-center text-sm text-gray-600 mb-1">
                  <MapPin :size="14" class="mr-1" />
                  <span class="truncate">{{ clinic.location }}</span>
                </div>
                <p class="text-sm text-gray-600 mb-2">{{ clinic.specialties.join(', ') }}</p>
                <div v-if="clinic.rating" class="flex items-center">
                  <Star :size="14" class="text-yellow-400 mr-1" />
                  <span class="text-sm text-gray-600">{{ clinic.rating }}</span>
                </div>
              </div>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div
          v-if="filteredDoctors.length === 0 && filteredClinics.length === 0"
          class="text-center py-12"
        >
          <Search :size="48" class="text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
          <p class="text-gray-600">Try adjusting your search terms or browse our categories</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Search, X, MapPin, Star, User, Building } from 'lucide-vue-next';
import Button from '../Button/Button.vue';
import type {
  SearchModalProps,
  SearchModalEmits,
  Doctor,
  Clinic,
  SearchTab
} from './SearchModal.types';

const props = defineProps<SearchModalProps>();
const emit = defineEmits<SearchModalEmits>();

const query = ref(props.searchQuery);
const activeTab = ref<SearchTab>('all');

// Mock data
const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Roselo Alagase M.D',
    specialties: ['General Physician'],
    image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=100',
    rating: 4.8,
    experience: '15 years',
    location: 'Metro Manila'
  },
  {
    id: '2',
    name: 'Dr. Phoebe Katez Campasas MD',
    specialties: ['General Physician', 'Occupational Medicine'],
    image: 'https://images.pexels.com/photos/4167541/pexels-photo-4167541.jpeg?auto=compress&cs=tinysrgb&w=100',
    rating: 4.6,
    experience: '12 years',
    location: 'Quezon City'
  }
];

const mockClinics: Clinic[] = [
  {
    id: '1',
    name: 'Dr. Albert John Bromeo Clinic at Metro Antipolo Hospital and Medical Center',
    location: 'Mayamot, CITY OF ANTIPOLO, RIZAL, REGION IV-A (CALABARZON)',
    specialties: ['General Medicine', 'Emergency Care', 'Surgery'],
    image: 'https://images.pexels.com/photos/247786/pexels-photo-247786.jpeg?auto=compress&cs=tinysrgb&w=100',
    rating: 4.6
  },
  {
    id: '2',
    name: 'QuickCare Medical Center',
    location: 'Downtown, Metro Manila',
    specialties: ['Urgent Care', 'General Medicine', 'Pediatrics'],
    image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=100',
    rating: 4.4
  }
];

const filteredDoctors = computed(() =>
  mockDoctors.filter(doctor =>
    doctor.name.toLowerCase().includes(query.value.toLowerCase()) ||
    doctor.specialties.some(specialty =>
      specialty.toLowerCase().includes(query.value.toLowerCase())
    )
  )
);

const filteredClinics = computed(() =>
  mockClinics.filter(clinic =>
    clinic.name.toLowerCase().includes(query.value.toLowerCase()) ||
    clinic.specialties.some(specialty =>
      specialty.toLowerCase().includes(query.value.toLowerCase())
    )
  )
);

const handleSearch = () => {
  emit('search', query.value);
};

const handleDoctorSelect = (doctor: Doctor) => {
  emit('doctorSelect', doctor);
};

const handleClinicSelect = (clinic: Clinic) => {
  emit('clinicSelect', clinic);
};

// Watch for prop changes
watch(() => props.searchQuery, (newQuery) => {
  query.value = newQuery;
});
</script>
