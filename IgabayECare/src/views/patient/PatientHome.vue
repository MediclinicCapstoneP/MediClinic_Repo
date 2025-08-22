<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Home step - Clinic List -->
    <div v-if="step === 'home'">
      <div class="mb-6">
        <div class="relative max-w-md">
          <Input
            type="text"
            placeholder="Search clinics, specialties, or location..."
            v-model="searchTerm"
            class="w-full pr-10"
            :icon="Search"
          />
          <button
            v-if="searchTerm"
            @click="searchTerm = ''"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
          >
            <X class="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card v-for="stat in stats" :key="stat.title" class="hover:shadow-md transition">
          <CardContent class="p-4">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm text-gray-500">{{ stat.title }}</p>
                <p class="text-2xl font-bold">{{ stat.value }}</p>
                <p :class="`text-xs ${stat.changeType === 'positive' ? 'text-green-500' : 'text-gray-500'}`">
                  {{ stat.change }}
                </p>
              </div>
              <div :class="`p-3 rounded-full ${stat.bgColor}`">
                <component :is="stat.icon" :class="`h-6 w-6 ${stat.color}`" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 class="text-xl font-bold mb-4">Available Clinic</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          v-for="clinic in mockNearbyClinics"
          :key="clinic.id"
          class="hover:shadow-xl transition overflow-hidden"
        >
          <div class="h-40 overflow-hidden">
            <img
              :src="clinic.image"
              :alt="clinic.name"
              class="w-full h-full object-cover transition-transform hover:scale-105"
            />
          </div>
          <CardContent class="p-4">
            <div class="flex items-start justify-between mb-2">
              <h3 class="font-semibold text-lg line-clamp-2">{{ clinic.name }}</h3>
              <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs whitespace-nowrap ml-2">
                {{ clinic.openNow ? '✓ Open Now' : 'Closed' }}
              </span>
            </div>
            <div class="flex items-center mb-2">
              <Star class="h-4 w-4 text-yellow-500 mr-1" />
              <span class="text-sm font-medium">{{ clinic.rating }}</span>
              <span class="text-xs text-gray-500 ml-1">({{ clinic.reviewCount }} reviews)</span>
            </div>
            <div class="flex items-center text-sm text-gray-600 mb-2">
              <MapPin class="h-4 w-4 mr-1" />
              <span>{{ clinic.address }} • {{ clinic.distance }}</span>
            </div>
            <div class="flex items-center text-sm text-gray-600 mb-2">
              <Clock class="h-4 w-4 mr-1" />
              <span>{{ clinic.estimatedTime }}</span>
            </div>
            <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ clinic.description }}</p>
            <div class="flex flex-wrap gap-1 mb-3">
              <span
                v-for="(specialty, index) in clinic.specialties.slice(0, 3)"
                :key="index"
                class="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs"
              >
                {{ specialty }}
              </span>
            </div>
            <Button class="w-full" @click="handleClinicClick(clinic.id)">View Details</Button>
          </CardContent>
        </Card>
      </div>

      <h2 class="text-xl font-bold mb-4">Available Clinics</h2>
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard v-for="i in 6" :key="i" />
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="clinic in filteredClinics"
          :key="clinic.id"
          @click="handleClinicClick(clinic.id)"
          class="cursor-pointer hover:shadow-xl transition rounded-2xl overflow-hidden"
        >
          <Card>
            <CardContent class="p-4">
              <div class="flex justify-between items-center mb-2">
                <h3 class="font-semibold text-lg">{{ clinic.clinic_name }}</h3>
                <span :class="`px-2 py-1 rounded-full text-xs ${getStatusColor(clinic.status)}`">
                  {{ clinic.status === 'approved' ? '✓ Verified' : clinic.status }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-2">
                {{ clinic.description || getSpecialization(clinic) }}
              </p>
              <p class="text-sm text-gray-500">{{ formatAddress(clinic) }}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Clinic Details step -->
    <div v-if="step === 'clinic-details' && selectedClinic" class="space-y-6">
      <!-- Header with image for nearby clinics -->
      <div v-if="nearbyClinic" class="h-64 rounded-xl overflow-hidden mb-6">
        <img
          :src="nearbyClinic.image"
          :alt="selectedClinic.clinic_name"
          class="w-full h-full object-cover"
        />
      </div>

      <div class="flex justify-between items-start">
        <div>
          <h2 class="text-2xl font-bold mb-2">{{ selectedClinic.clinic_name }}</h2>
          <p class="text-gray-600 mb-2">{{ selectedClinic.description || getSpecialization(selectedClinic) }}</p>
          <p class="text-sm text-gray-500 mb-4">{{ formatAddress(selectedClinic) }}</p>
        </div>

        <div v-if="nearbyClinic" class="text-right">
          <div class="flex items-center justify-end mb-2">
            <Star class="h-5 w-5 text-yellow-500 mr-1" />
            <span class="text-lg font-medium">{{ nearbyClinic.rating }}</span>
            <span class="text-sm text-gray-500 ml-1">({{ nearbyClinic.reviewCount }} reviews)</span>
          </div>
          <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            {{ nearbyClinic.openNow ? '✓ Open Now' : 'Closed' }}
          </span>
        </div>
      </div>

      <!-- Additional details for nearby clinics -->
      <div v-if="nearbyClinic" class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        <Card>
          <CardContent class="p-4">
            <h3 class="font-semibold mb-3">Contact Information</h3>
            <div class="space-y-2">
              <div v-if="nearbyClinic.phone" class="flex items-center">
                <Phone class="h-4 w-4 mr-2 text-gray-500" />
                <span>{{ nearbyClinic.phone }}</span>
              </div>
              <div v-if="nearbyClinic.website" class="flex items-center">
                <ExternalLink class="h-4 w-4 mr-2 text-gray-500" />
                <a :href="`https://${nearbyClinic.website}`" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
                  {{ nearbyClinic.website }}
                </a>
              </div>
              <div class="flex items-center">
                <MapPin class="h-4 w-4 mr-2 text-gray-500" />
                <span>{{ nearbyClinic.address }} • {{ nearbyClinic.distance }}</span>
              </div>
              <div class="flex items-center">
                <Clock class="h-4 w-4 mr-2 text-gray-500" />
                <span>{{ nearbyClinic.estimatedTime }}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4">
            <h3 class="font-semibold mb-3">Services</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(service, index) in nearbyClinic.services"
                :key="index"
                class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
              >
                {{ service }}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="mt-6">
        <Button @click="step = 'book'" class="mr-4">Book Appointment</Button>
        <Button variant="ghost" @click="step = 'home'">Back</Button>
      </div>
    </div>

    <!-- Booking Form step -->
    <div v-if="step === 'book' && selectedClinic" class="max-w-md mx-auto">
      <h2 class="text-xl font-bold mb-4">Booking for {{ selectedClinic.clinic_name }}</h2>
      <div class="mb-3">
        <label class="text-sm">Choose Date</label>
        <Input type="date" v-model="date" />
      </div>
      <div class="mb-3">
        <label class="text-sm">Choose Time</label>
        <Input type="time" v-model="time" />
      </div>
      <div class="mb-3">
        <label class="text-sm">Pay Booking Fee</label><br />
        <Button @click="paymentDone = true" :disabled="paymentDone">
          {{ paymentDone ? '✔ Fee Paid' : 'Pay Now' }}
        </Button>
      </div>
      <Button
        @click="confirmBooking"
        class="mr-4"
      >
        Confirm Booking
      </Button>
      <Button variant="ghost" @click="step = 'clinic-details'">Back</Button>
    </div>

    <!-- Confirmation step -->
    <div v-if="step === 'confirm'" class="text-center py-12">
      <h2 class="text-2xl font-bold text-green-600 mb-2">Appointment Confirmed!</h2>
      <p class="text-gray-600 mb-4">You will receive a booking notification soon.</p>
      <Button @click="resetBooking">Return to Home</Button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { Card, CardContent } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import { SkeletonCard } from '../../shared/components/ui/Skeleton';
import { clinicService, type ClinicProfile } from '../../features/auth/utils/clinicService';
import { Search, MapPin, Calendar, History, Heart, TrendingUp, Clock, Star, Users, Activity, Award, Shield, Phone, Mail, ExternalLink, X } from 'lucide-vue-next';

type Step = 'home' | 'clinic-details' | 'book' | 'confirm';

// Mock data for nearby clinics
const mockNearbyClinics = [
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

const mockClinics: ClinicProfile[] = [
  {
    id: '1',
    user_id: 'mock-user-1',
    clinic_name: 'QuickCare Medical Center',
    email: 'info@quickcare.com',
    phone: '+1 234-567-8901',
    address: '123 Main Street',
    city: 'City Center',
    state: 'State',
    zip_code: '12345',
    specialties: ['General Medicine'],
    description: 'Fast and reliable general healthcare services.',
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'mock-user-2',
    clinic_name: 'Heart & Vascular Institute',
    email: 'contact@heartinstitute.com',
    phone: '+1 234-567-8902',
    address: '456 Health Avenue',
    city: 'Medical District',
    state: 'State',
    zip_code: '12346',
    specialties: ['Cardiology'],
    description: 'Expert heart and vascular care by top specialists.',
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export default defineComponent({
  name: 'PatientHome',
  components: {
    Card,
    CardContent,
    Button,
    Input,
    SkeletonCard,
    Search,
    MapPin,
    Calendar,
    History,
    Heart,
    TrendingUp,
    Clock,
    Star,
    Users,
    Activity,
    Award,
    Shield,
    Phone,
    Mail,
    ExternalLink,
    X
  },
  props: {
    onNavigate: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const hoveredCard = ref<string | null>(null);
    const clinics = ref<ClinicProfile[]>([]);
    const loading = ref(true);
    const searchTerm = ref('');
    const step = ref<Step>('home');
    const selectedClinic = ref<ClinicProfile | null>(null);
    const date = ref('');
    const time = ref('');
    const paymentDone = ref(false);

    const stats = [
      {
        title: 'Total Visits',
        value: '12',
        change: '+2',
        changeType: 'positive',
        icon: Activity,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Upcoming',
        value: '2',
        change: 'This week',
        changeType: 'neutral',
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      },
      {
        title: 'Clinics Visited',
        value: '4',
        change: 'This year',
        changeType: 'neutral',
        icon: Users,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      }
    ];

    onMounted(async () => {
      try {
        loading.value = true;
        const result = await clinicService.getPublicClinics();
        if (result.success && result.clinics) {
          clinics.value = result.clinics;
        } else {
          clinics.value = mockClinics;
        }
      } catch (error) {
        clinics.value = mockClinics;
      } finally {
        loading.value = false;
      }
    });

    const handleClinicClick = (clinicId: string | number) => {
      // For regular clinics (string ID)
      const clinic = clinics.value.find(c => c.id === clinicId);
      if (clinic) {
        selectedClinic.value = clinic;
        step.value = 'clinic-details';
        return;
      }

      // For nearby clinics (number ID)
      const nearbyClinic = mockNearbyClinics.find(c => c.id === clinicId);
      if (nearbyClinic) {
        // Convert nearby clinic to the format expected by the app
        const convertedClinic: ClinicProfile = {
          id: String(nearbyClinic.id),
          user_id: `nearby-${nearbyClinic.id}`,
          clinic_name: nearbyClinic.name,
          email: '',
          phone: nearbyClinic.phone || '',
          address: nearbyClinic.address,
          city: '',
          state: '',
          zip_code: '',
          specialties: nearbyClinic.specialties,
          description: nearbyClinic.description,
          status: 'approved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        selectedClinic.value = convertedClinic;
        step.value = 'clinic-details';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'approved': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const formatAddress = (clinic: ClinicProfile) => {
      const parts = [clinic.address, clinic.city, clinic.state, clinic.zip_code].filter(Boolean);
      return parts.join(', ');
    };

    const getSpecialization = (clinic: ClinicProfile) => {
      if (clinic.specialties && clinic.specialties.length > 0) {
        return clinic.specialties.join(', ');
      }
      if (clinic.custom_specialties && clinic.custom_specialties.length > 0) {
        return clinic.custom_specialties.join(', ');
      }
      return 'General Medicine';
    };

    const filteredClinics = computed(() => {
      if (!searchTerm.value) return clinics.value;
      const searchLower = searchTerm.value.toLowerCase();
      return clinics.value.filter(clinic => {
        return (
          clinic.clinic_name.toLowerCase().includes(searchLower) ||
          (clinic.address && clinic.address.toLowerCase().includes(searchLower)) ||
          (clinic.city && clinic.city.toLowerCase().includes(searchLower)) ||
          (clinic.description && clinic.description.toLowerCase().includes(searchLower)) ||
          (clinic.specialties && clinic.specialties.some(s => s.toLowerCase().includes(searchLower))) ||
          (clinic.custom_specialties && clinic.custom_specialties.some(s => s.toLowerCase().includes(searchLower)))
        );
      });
    });

    const nearbyClinic = computed(() => {
      if (!selectedClinic.value || !selectedClinic.value.user_id?.startsWith('nearby-')) return null;
      const nearbyClinicId = Number(selectedClinic.value.user_id?.replace('nearby-', ''));
      return mockNearbyClinics.find(c => c.id === nearbyClinicId) || null;
    });

    const confirmBooking = () => {
      if (date.value && time.value && paymentDone.value) {
        step.value = 'confirm';
      } else {
        alert('Please complete all fields and payment');
      }
    };

    const resetBooking = () => {
      step.value = 'home';
      date.value = '';
      time.value = '';
      paymentDone.value = false;
    };

    return {
      hoveredCard,
      clinics,
      loading,
      searchTerm,
      step,
      selectedClinic,
      date,
      time,
      paymentDone,
      stats,
      mockNearbyClinics,
      filteredClinics,
      nearbyClinic,
      handleClinicClick,
      getStatusColor,
      formatAddress,
      getSpecialization,
      confirmBooking,
      resetBooking,
      // Icons
      Search,
      MapPin,
      Calendar,
      History,
      Heart,
      TrendingUp,
      Clock,
      Star,
      Users,
      Activity,
      Award,
      Shield,
      Phone,
      Mail,
      ExternalLink,
      X
    };
  }
});
</script>
