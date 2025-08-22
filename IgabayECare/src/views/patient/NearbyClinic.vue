<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { MapPin, Navigation, Star, Clock, Phone, Globe, Filter, Search, Heart, Share2, List, Grid } from 'lucide-vue-next';
import Button from '../../components/ui/Button.vue';
import { Card, CardContent } from '../../components/ui/Card.vue';
import Input from '../../components/ui/Input.vue';
import ClinicMap from '../../components/patient/ClinicMap.vue';
import { BookAppointment } from '../../components/patient/BookAppointment.vue';

interface Clinic {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: string;
  rating: number;
  reviewCount: number;
  estimatedTime: string;
  specialties: string[];
  openNow: boolean;
  phone: string;
  website: string;
  image: string;
  description: string;
  services: string[];
}

interface ClinicForBooking {
  id: string;
  name: string;
}

const userLocation = ref<{ lat: number; lng: number } | null>(null);
const loading = ref(false);
const searchTerm = ref('');
const selectedSpecialty = ref('all');
const showOpenOnly = ref(false);
const hoveredClinic = ref<number | null>(null);
const selectedClinic = ref<number | null>(null);
const viewMode = ref<'list' | 'grid'>('list');
const showRouting = ref(false);
const bookingModalOpen = ref(false);
const selectedClinicForBooking = ref<ClinicForBooking | null>(null);

const mockNearbyClinics: Clinic[] = [
  {
    id: 1,
    name: 'OASIS DIAGNOSTIC & LABORATORY CENTER',
    address: 'Bogo City, Cebu',
    lat: 11.048747,
    lng: 124.003222,
    distance: '0.3 km',
    rating: 4.6,
    reviewCount: 127,
    estimatedTime: '5 min walk',
    specialties: ['Laboratory Services', 'Diagnostic Tests', 'Blood Tests'],
    openNow: true,
    phone: '+63 (555) 123-4567',
    website: 'www.oasisdiagnostic.com',
    image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Comprehensive diagnostic and laboratory services with modern equipment.',
    services: ['Blood Tests', 'Urinalysis', 'X-Ray', 'ECG', 'Ultrasound']
  },
  {
    id: 2,
    name: 'Bogo Clinical Laboratory',
    address: 'Bogo City, Cebu',
    lat: 11.048754,
    lng: 124.001291,
    distance: '0.8 km',
    rating: 4.8,
    reviewCount: 89,
    estimatedTime: '10 min walk',
    specialties: ['Clinical Laboratory', 'Medical Tests', 'Health Screening'],
    openNow: true,
    phone: '+63 (555) 234-5678',
    website: 'www.bogoclinical.com',
    image: 'https://images.pexels.com/photos/4167541/pexels-photo-4167541.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Professional clinical laboratory services for accurate medical testing.',
    services: ['Complete Blood Count', 'Chemistry Tests', 'Microbiology', 'Immunology']
  },
  {
    id: 3,
    name: 'Verdida Optical Clinic',
    address: 'Bogo City, Cebu',
    lat: 11.048754,
    lng: 124.001291,
    distance: '1.1 km',
    rating: 4.7,
    reviewCount: 156,
    estimatedTime: '15 min walk',
    specialties: ['Optical Services', 'Eye Care', 'Vision Correction'],
    openNow: true,
    phone: '+63 (555) 345-6789',
    website: 'www.verdidoptical.com',
    image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Professional optical services for vision care and eyewear.',
    services: ['Eye Examinations', 'Contact Lens Fitting', 'Eyeglass Prescription', 'Vision Therapy']
  },
  {
    id: 4,
    name: 'Mayol Dental Clinic',
    address: 'Bogo City, Cebu',
    lat: 11.049110,
    lng: 124.004254,
    distance: '1.5 km',
    rating: 4.5,
    reviewCount: 234,
    estimatedTime: '20 min walk',
    specialties: ['Dental Care', 'Oral Surgery', 'Orthodontics'],
    openNow: true,
    phone: '+63 (555) 456-7890',
    website: 'www.mayoldental.com',
    image: 'https://images.pexels.com/photos/247786/pexels-photo-247786.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Comprehensive dental care services for all ages.',
    services: ['Dental Check-ups', 'Tooth Extraction', 'Root Canal', 'Dental Implants', 'Braces']
  }
];

const specialties = [
  'all',
  'Laboratory Services',
  'Clinical Laboratory',
  'Optical Services',
  'Dental Care',
  'Diagnostic Tests',
  'Medical Tests'
];

// Request user location on mount
onMounted(() => {
  const getCurrentLocation = () => {
    loading.value = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation.value = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          loading.value = false;
        },
        (error) => {
          console.error('Error getting location:', error);
          loading.value = false;
          if (error.code === error.PERMISSION_DENIED) {
            alert('Location permission denied. Please allow location to see nearby clinics.');
          } else {
            alert('Unable to get your location. Please enable location services.');
          }
        }
      );
    } else {
      loading.value = false;
      alert('Geolocation is not supported by this browser.');
    }
  };

  getCurrentLocation();
});

const filteredClinics = computed(() => {
  return mockNearbyClinics.filter((clinic) => {
    const matchesSearch =
      clinic.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      clinic.address.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      clinic.specialties.some((s) => s.toLowerCase().includes(searchTerm.value.toLowerCase()));

    const matchesSpecialty = selectedSpecialty.value === 'all' || clinic.specialties.includes(selectedSpecialty.value);
    const matchesOpenStatus = !showOpenOnly.value || clinic.openNow;

    return matchesSearch && matchesSpecialty && matchesOpenStatus;
  });
});

const handleBookAppointment = (clinicId: number) => {
  const clinic = mockNearbyClinics.find((c) => c.id === clinicId);
  if (clinic) {
    selectedClinicForBooking.value = {
      id: clinicId.toString(),
      name: clinic.name
    };
    bookingModalOpen.value = true;
  }
};

const handleGetDirections = (clinic: Clinic) => {
  // TODO: Implement directions functionality
  console.log('Getting directions to:', clinic.name);
};

const handleClinicMapClick = (clinic: Clinic) => {
  selectedClinic.value = clinic.id;
  const element = document.getElementById(`clinic-${clinic.id}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Nearby Clinics</h1>
      <p class="text-gray-600">Find healthcare providers close to your location</p>
    </div>

    <!-- Search and Filters -->
    <div class="mb-6 space-y-4">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <Input
            type="text"
            placeholder="Search clinics, specialties, or location..."
            v-model="searchTerm"
          >
            <template #prefix>
              <Search size="20" class="text-gray-400" />
            </template>
          </Input>
        </div>
        <div class="flex gap-2">
          <select
            v-model="selectedSpecialty"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option v-for="specialty in specialties" :key="specialty" :value="specialty">
              {{ specialty === 'all' ? 'All Specialties' : specialty }}
            </option>
          </select>
          <Button
            :variant="showOpenOnly ? 'gradient' : 'outline'"
            @click="showOpenOnly = !showOpenOnly"
            class="flex items-center gap-2"
          >
            <Clock size="16" />
            Open Now
          </Button>
          <div class="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              @click="viewMode = 'list'"
              :class="[
                'px-3 py-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              ]"
            >
              <List size="16" />
            </button>
            <button
              @click="viewMode = 'grid'"
              :class="[
                'px-3 py-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              ]"
            >
              <Grid size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Map -->
    <Card class="mb-6">
      <CardContent class="p-0">
        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Interactive Map View</h3>
            <p class="text-sm text-gray-600">Click on markers to see clinic details</p>
          </div>
          <Button
            v-if="userLocation"
            :variant="showRouting ? 'gradient' : 'outline'"
            size="sm"
            @click="showRouting = !showRouting"
            class="flex items-center gap-2"
          >
            <Navigation size="16" />
            {{ showRouting ? 'Hide Route' : 'Show Route' }}
          </Button>
        </div>
        <ClinicMap
          :userLocation="userLocation"
          :nearestClinicFound="filteredClinics.length > 0 ? filteredClinics[0] : null"
          :showRouting="showRouting"
        />
      </CardContent>
    </Card>

    <!-- Results Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">
        Clinics Near You ({{ filteredClinics.length }})
      </h2>
      <div class="text-sm text-gray-500">Sorted by distance</div>
    </div>

    <!-- Nearby Clinics List -->
    <div class="space-y-4">
      <Card v-if="filteredClinics.length === 0">
        <CardContent class="p-8 text-center">
          <MapPin size="48" class="text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No clinics found</h3>
          <p class="text-gray-600">Try adjusting your search criteria or location</p>
        </CardContent>
      </Card>

      <div
        v-for="clinic in filteredClinics"
        :key="clinic.id"
        :id="`clinic-${clinic.id}`"
        :class="[
          'transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer',
          hoveredClinic === clinic.id ? 'ring-2 ring-primary-200' : '',
          selectedClinic === clinic.id ? 'ring-2 ring-primary-500' : ''
        ]"
        @mouseenter="hoveredClinic = clinic.id"
        @mouseleave="hoveredClinic = null"
        @click="selectedClinic = clinic.id"
      >
        <Card class="overflow-hidden border border-gray-200 hover:border-primary-300 transition-all duration-300">
          <CardContent class="p-0">
            <div class="flex flex-col md:flex-row">
              <div class="w-full md:w-48 h-48 md:h-auto flex-shrink-0 relative group overflow-hidden">
                <img
                  :src="clinic.image"
                  :alt="clinic.name"
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button class="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors">
                    <Heart size="16" class="text-red-500" />
                  </button>
                </div>
              </div>

              <div class="flex-1 p-6">
                <div class="flex flex-col md:flex-row md:items-start justify-between h-full">
                  <div class="flex-1">
                    <div class="flex items-start justify-between mb-3">
                      <div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ clinic.name }}</h3>
                        <div class="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div class="flex items-center">
                            <MapPin size="14" class="mr-1" />
                            {{ clinic.address }}
                          </div>
                          <div class="flex items-center">
                            <Navigation size="14" class="mr-1" />
                            {{ clinic.distance }} • {{ clinic.estimatedTime }}
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center space-x-2">
                        <button class="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <Heart size="16" />
                        </button>
                        <button class="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Share2 size="16" />
                        </button>
                      </div>
                    </div>

                    <div class="flex items-center space-x-4 mb-3">
                      <div class="flex items-center">
                        <Star size="16" class="text-yellow-400 mr-1" />
                        <span class="text-sm font-medium">{{ clinic.rating }}</span>
                        <span class="text-sm text-gray-500 ml-1">({{ clinic.reviewCount }} reviews)</span>
                      </div>
                      <span
                        v-if="clinic.openNow"
                        class="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center"
                      >
                        <Clock size="12" class="mr-1" />
                        Open Now
                      </span>
                      <span
                        v-else
                        class="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full flex items-center"
                      >
                        <Clock size="12" class="mr-1" />
                        Closed
                      </span>
                    </div>

                    <p class="text-gray-600 mb-3">{{ clinic.description }}</p>

                    <div class="mb-4">
                      <h4 class="text-sm font-semibold text-gray-900 mb-2">Specialties:</h4>
                      <div class="flex flex-wrap gap-2">
                        <span
                          v-for="(specialty, index) in clinic.specialties"
                          :key="index"
                          class="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
                        >
                          {{ specialty }}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center space-x-4 text-sm text-gray-600">
                      <div class="flex items-center">
                        <Phone size="14" class="mr-1" />
                        {{ clinic.phone }}
                      </div>
                      <div class="flex items-center">
                        <Globe size="14" class="mr-1" />
                        {{ clinic.website }}
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-col space-y-3 mt-4 md:mt-0 md:ml-6">
                    <Button
                      variant="outline"
                      size="sm"
                      @click.stop="handleGetDirections(clinic)"
                      class="flex items-center justify-center"
                    >
                      <Navigation size="14" class="mr-2" />
                      Directions
                    </Button>
                    <Button
                      size="sm"
                      @click.stop="handleBookAppointment(clinic.id)"
                      class="flex items-center justify-center"
                    >
                      Book Appointment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Booking Appointment Modal -->
    <BookAppointment
      v-if="selectedClinicForBooking"
      :isOpen="bookingModalOpen"
      @close="bookingModalOpen = false"
      :clinicId="selectedClinicForBooking.id"
      :clinicName="selectedClinicForBooking.name"
    />
  </div>
</template>