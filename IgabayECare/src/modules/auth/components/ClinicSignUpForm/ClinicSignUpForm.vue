<template>
  <div>
    <!-- Map Modal -->
    <ClinicMapModal
      :open="isMapOpen"
      @close="isMapOpen = false"
      :selectedLocation="clinicLocation"
      @locationSelect="handleLocationSelect"
    />

    <!-- Success State -->
    <div
      v-if="success"
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full text-center">
        <div class="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle class="h-8 w-8 text-green-600" />
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
        <p class="text-gray-600 mb-6">
          We've sent a verification email to {{ formData.email }}. Please check your email and click the verification link to complete your clinic registration.
        </p>
        <AppButton
          @click="resendVerificationEmail"
          variant="outline"
          class="mr-2"
        >
          Resend Verification Email
        </AppButton>
        <AppButton @click="$router.push('/clinic-signin')" variant="gradient">
          Go to Sign In
        </AppButton>
      </div>
    </div>

    <!-- Main Form -->
    <div
      v-else
      class="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-8">
          <div class="mx-auto h-16 w-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
            <Building class="h-8 w-8 text-secondary-600" />
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Register Your Clinic</h1>
          <p class="text-gray-600">Join our healthcare platform and start managing your clinic</p>
        </div>

        <!-- Progress Bar -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div v-for="step in 6" :key="step" class="flex items-center">
              <div
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step <= currentStep ? 'bg-secondary-600 text-white' : 'bg-gray-200 text-gray-600'
                ]"
              >
                {{ step }}
              </div>
              <div
                v-if="step < 6"
                :class="[
                  'w-12 h-1 mx-2',
                  step < currentStep ? 'bg-secondary-600' : 'bg-gray-200'
                ]"
              />
            </div>
          </div>
          <div class="flex justify-between text-xs text-gray-500 mt-2">
            <span>Basic Info</span>
            <span>Contact</span>
            <span>Specialties</span>
            <span>Services</span>
            <span>Business</span>
            <span>Hours</span>
          </div>
        </div>

        <AppCard class="bg-white shadow-xl border-0">
          <template #header>
            <div class="text-center pb-4">
              <h3 class="text-xl font-semibold text-gray-900">
                Step {{ currentStep }} of 6:
                {{ stepTitles[currentStep - 1] }}
              </h3>
            </div>
          </template>

          <template #content>
            <!-- Error Message -->
            <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <div class="flex items-center space-x-2">
                <AlertCircle :size="20" class="text-red-600" />
                <span class="text-red-800 text-sm">{{ error }}</span>
              </div>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-6">
              <!-- Step 1: Basic Information -->
              <div v-if="currentStep === 1" class="space-y-6">
                <AppInput
                  label="Clinic Name"
                  v-model="formData.clinic_name"
                  required
                  :disabled="isLoading"
                />

                <AppInput
                  label="Email Address"
                  type="email"
                  v-model="formData.email"
                  required
                  :disabled="isLoading"
                />

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label="Password"
                    type="password"
                    v-model="formData.password"
                    required
                    :disabled="isLoading"
                  />
                  <AppInput
                    label="Confirm Password"
                    type="password"
                    v-model="formData.confirmPassword"
                    required
                    :disabled="isLoading"
                  />
                </div>

                <p v-if="passwordMismatch" class="text-red-600 text-sm">
                  Passwords do not match
                </p>
              </div>

              <!-- Step 2: Contact Information -->
              <div v-if="currentStep === 2" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label="Phone Number"
                    v-model="formData.phone"
                    :disabled="isLoading"
                  />
                  <AppInput
                    label="Website"
                    v-model="formData.website"
                    :disabled="isLoading"
                  />
                </div>

                <AppInput
                  label="Address"
                  v-model="formData.address"
                  :disabled="isLoading"
                />

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <AppInput
                    label="City"
                    v-model="formData.city"
                    :disabled="isLoading"
                  />
                  <AppInput
                    label="State"
                    v-model="formData.state"
                    :disabled="isLoading"
                  />
                  <AppInput
                    label="ZIP Code"
                    v-model="formData.zip_code"
                    :disabled="isLoading"
                  />
                </div>

                <!-- Location selector -->
                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Clinic Location
                  </label>
                  <div class="flex items-center space-x-4">
                    <AppButton
                      type="button"
                      variant="outline"
                      @click="isMapOpen = true"
                      :disabled="isLoading"
                    >
                      Select Clinic Location
                    </AppButton>
                    <div v-if="clinicLocation" class="text-sm text-gray-700">
                      Selected: {{ clinicLocation.lat.toFixed(6) }}, {{ clinicLocation.lng.toFixed(6) }}
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">
                    This location will help patients find your clinic on the map.
                  </p>
                </div>
              </div>

              <!-- Step 3: Medical Specialties -->
              <div v-if="currentStep === 3" class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-3">
                    Medical Specialties
                  </label>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label v-for="specialty in availableSpecialties" :key="specialty" class="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        :checked="formData.specialties.includes(specialty)"
                        @change="toggleSpecialty(specialty)"
                        class="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                      />
                      <span class="text-sm text-gray-700">{{ specialty }}</span>
                    </label>
                  </div>
                  <AppInput
                    label="Other Specialties (comma-separated)"
                    :modelValue="formData.custom_specialties.join(', ')"
                    @update:modelValue="updateCustomSpecialties"
                    placeholder="e.g., Sports Medicine, Geriatrics"
                    :disabled="isLoading"
                    class="mt-4"
                  />
                </div>
              </div>

              <!-- Step 4: Medical Services -->
              <div v-if="currentStep === 4" class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-3">
                    Medical Services Offered
                  </label>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <label v-for="service in availableServices" :key="service" class="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        :checked="formData.services.includes(service)"
                        @change="toggleService(service)"
                        class="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                      />
                      <span class="text-sm text-gray-700">{{ service }}</span>
                    </label>
                  </div>
                  <AppInput
                    label="Other Services (comma-separated)"
                    :modelValue="formData.custom_services.join(', ')"
                    @update:modelValue="updateCustomServices"
                    placeholder="e.g., Acupuncture, Massage Therapy"
                    :disabled="isLoading"
                    class="mt-4"
                  />
                </div>
              </div>

              <!-- Step 5: Business Information -->
              <div v-if="currentStep === 5" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label="Medical License Number"
                    v-model="formData.license_number"
                    :disabled="isLoading"
                  />
                  <AppInput
                    label="Accreditation Number"
                    v-model="formData.accreditation"
                    :disabled="isLoading"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label="Tax ID"
                    v-model="formData.tax_id"
                    :disabled="isLoading"
                  />
                  <AppInput
                    label="Year Established"
                    type="number"
                    v-model="formData.year_established"
                    :disabled="isLoading"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AppInput
                    label="Number of Doctors"
                    type="number"
                    v-model="formData.number_of_doctors"
                    :disabled="isLoading"
                  />
                  <AppInput
                    label="Number of Staff"
                    type="number"
                    v-model="formData.number_of_staff"
                    :disabled="isLoading"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Clinic Description
                  </label>
                  <textarea
                    v-model="formData.description"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:bg-gray-50"
                    rows="3"
                    placeholder="Describe your clinic's mission, values, and what makes you unique..."
                    :disabled="isLoading"
                  />
                </div>
              </div>

              <!-- Step 6: Operating Hours -->
              <div v-if="currentStep === 6" class="space-y-6">
                <div>
                  <h4 class="text-lg font-medium text-gray-900 mb-4">Operating Hours</h4>
                  <div class="space-y-4">
                    <div v-for="day in daysOfWeek" :key="day" class="flex items-center space-x-4">
                      <div class="w-24 text-sm font-medium text-gray-700 capitalize">
                        {{ day }}
                      </div>
                      <div class="flex items-center space-x-2">
                        <input
                          type="time"
                          v-model="formData.operating_hours[day].open"
                          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
                          :disabled="isLoading"
                        />
                        <span class="text-gray-500">to</span>
                        <input
                          type="time"
                          v-model="formData.operating_hours[day].close"
                          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
                          :disabled="isLoading"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Review Information -->
                <div>
                  <h4 class="text-lg font-medium text-gray-900 mb-4">Review Information</h4>
                  <div class="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <p><strong>Clinic Name:</strong> {{ formData.clinic_name }}</p>
                    <p><strong>Email:</strong> {{ formData.email }}</p>
                    <p><strong>Phone:</strong> {{ formData.phone || 'Not provided' }}</p>
                    <p><strong>Address:</strong> {{ formData.address || 'Not provided' }}</p>
                    <p>
                      <strong>Location:</strong>
                      {{ clinicLocation ? `${clinicLocation.lat.toFixed(6)}, ${clinicLocation.lng.toFixed(6)}` : 'Not selected' }}
                    </p>
                    <p>
                      <strong>Specialties:</strong>
                      {{ [...formData.specialties, ...formData.custom_specialties].join(', ') || 'None' }}
                    </p>
                    <p>
                      <strong>Services:</strong>
                      {{ [...formData.services, ...formData.custom_services].join(', ') || 'None' }}
                    </p>
                    <p><strong>License:</strong> {{ formData.license_number || 'Not provided' }}</p>
                  </div>
                </div>
              </div>

              <!-- Navigation Buttons -->
              <div class="flex justify-between pt-6">
                <div class="flex space-x-2">
                  <AppButton
                    v-if="currentStep > 1"
                    type="button"
                    variant="outline"
                    @click="previousStep"
                    :disabled="isLoading"
                  >
                    Previous
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="outline"
                    @click="clearFormData"
                    :disabled="isLoading"
                  >
                    Clear Form Data
                  </AppButton>
                </div>

                <div class="flex space-x-2">
                  <AppButton
                    v-if="currentStep < 6"
                    type="button"
                    variant="gradient"
                    @click="nextStep"
                    :disabled="isLoading"
                  >
                    Next
                  </AppButton>
                  <AppButton
                    v-else
                    type="submit"
                    variant="gradient"
                    :loading="isLoading"
                  >
                    Complete Registration
                  </AppButton>
                </div>
              </div>
            </form>

            <!-- Sign In Links -->
            <div class="mt-6 text-center">
              <p class="text-sm text-gray-600">
                Already have a clinic account?
                <router-link
                  to="/clinic-signin"
                  class="font-medium text-secondary-600 hover:text-secondary-500 transition-colors"
                >
                  Sign in here
                </router-link>
              </p>
            </div>

            <div class="mt-4 text-center">
              <p class="text-sm text-gray-600">
                Are you a patient?
                <router-link
                  to="/signup"
                  class="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Register here
                </router-link>
              </p>
            </div>
          </template>
        </AppCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Building, CheckCircle, AlertCircle } from 'lucide-vue-next';
import { AppButton } from '../../../../shared/components/ui/Button/Button.vue';
import { AppInput } from '../../../../shared/components/ui/Input/Input.vue';
import { AppCard } from '../../../../shared/components/ui/Card/Card.vue';
import { AuthService } from '../../services/AuthService';
import ClinicMapModal from '../../../../shared/components/maps/ClinicMapModal/ClinicMapModal.vue';

interface Props {
  onSuccess?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  onSuccess: undefined
});

const router = useRouter();
const authService = new AuthService();

// Reactive state
const currentStep = ref(1);
const isLoading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);
const isMapOpen = ref(false);
const clinicLocation = ref<{ lat: number; lng: number } | null>(null);

// Form data with localStorage persistence
const formData = ref(() => {
  const saved = localStorage.getItem('clinicSignUpData');
  return saved
    ? JSON.parse(saved)
    : {
        // Step 1: Basic Information
        clinic_name: '',
        email: '',
        password: '',
        confirmPassword: '',

        // Step 2: Contact Information
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',

        // Step 3: Medical Specialties
        specialties: [],
        custom_specialties: [],

        // Step 4: Medical Services
        services: [],
        custom_services: [],

        // Step 5: Business Information
        license_number: '',
        accreditation: '',
        tax_id: '',
        year_established: '',
        number_of_doctors: '',
        number_of_staff: '',
        description: '',

        // Step 6: Operating Hours
        operating_hours: {
          monday: { open: '08:00', close: '18:00' },
          tuesday: { open: '08:00', close: '18:00' },
          wednesday: { open: '08:00', close: '18:00' },
          thursday: { open: '08:00', close: '18:00' },
          friday: { open: '08:00', close: '18:00' },
          saturday: { open: '09:00', close: '16:00' },
          sunday: { open: '10:00', close: '14:00' },
        },
      };
});

// Constants
const stepTitles = [
  'Basic Information',
  'Contact Information',
  'Medical Specialties',
  'Medical Services',
  'Business Information',
  'Operating Hours'
];

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const availableSpecialties = [
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Internal Medicine',
  'Family Medicine',
  'Emergency Medicine',
  'Surgery',
  'Obstetrics & Gynecology',
  'Ophthalmology',
  'ENT (Ear, Nose, Throat)',
  'Radiology',
  'Anesthesiology',
  'Pathology',
  'Oncology',
  'Endocrinology',
  'Gastroenterology',
  'Pulmonology',
  'Nephrology',
  'Rheumatology',
  'Infectious Disease',
  'Physical Medicine',
];

const availableServices = [
  'General Consultation',
  'Vaccination',
  'Physical Therapy',
  'Laboratory Tests',
  'Imaging (X-Ray, MRI, CT)',
  'Surgery',
  'Emergency Care',
  'Preventive Care',
  'Telemedicine',
  'Home Care',
  'Dental Care',
  'Mental Health Services',
  "Women's Health",
  "Men's Health",
  'Pediatric Care',
  'Geriatric Care',
  'Chronic Disease Management',
  'Pain Management',
  'Rehabilitation',
  'Nutrition Counseling',
  'Smoking Cessation',
  'Weight Management',
  'Travel Medicine',
  'Occupational Health',
];

// Computed properties
const passwordMismatch = computed(() => {
  return formData.value.password &&
         formData.value.confirmPassword &&
         formData.value.password !== formData.value.confirmPassword;
});

// Methods
const handleLocationSelect = (location: { lat: number; lng: number }) => {
  clinicLocation.value = location;
  isMapOpen.value = false;
};

const toggleSpecialty = (specialty: string) => {
  if (formData.value.specialties.includes(specialty)) {
    formData.value.specialties = formData.value.specialties.filter((s: string) => s !== specialty);
  } else {
    formData.value.specialties.push(specialty);
  }
};

const updateCustomSpecialties = (value: string) => {
  formData.value.custom_specialties = value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s);
};

const toggleService = (service: string) => {
  if (formData.value.services.includes(service)) {
    formData.value.services = formData.value.services.filter((s: string) => s !== service);
  } else {
    formData.value.services.push(service);
  }
};

const updateCustomServices = (value: string) => {
  formData.value.custom_services = value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s);
};

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const nextStep = () => {
  if (currentStep.value < 6) {
    currentStep.value++;
  }
};

const clearFormData = () => {
  localStorage.removeItem('clinicSignUpData');
  formData.value = {
    clinic_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    specialties: [],
    custom_specialties: [],
    services: [],
    custom_services: [],
    license_number: '',
    accreditation: '',
    tax_id: '',
    year_established: '',
    number_of_doctors: '',
    number_of_staff: '',
    description: '',
    operating_hours: {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '18:00' },
      saturday: { open: '09:00', close: '16:00' },
      sunday: { open: '10:00', close: '14:00' },
    },
  };
  clinicLocation.value = null;
  currentStep.value = 1;
};

const resendVerificationEmail = async () => {
  try {
    await authService.resendVerificationEmail(formData.value.email);
  } catch (err) {
    console.error('Error resending verification email:', err);
  }
};

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;

  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = 'Passwords do not match';
    isLoading.value = false;
    return;
  }

  try {
    const result = await authService.signUpClinic({
      clinic_name: formData.value.clinic_name,
      email: formData.value.email,
      password: formData.value.password,
      phone: formData.value.phone || undefined,
      website: formData.value.website || undefined,
      address: formData.value.address || undefined,
      city: formData.value.city || undefined,
      state: formData.value.state || undefined,
      zip_code: formData.value.zip_code || undefined,
      license_number: formData.value.license_number || undefined,
      accreditation: formData.value.accreditation || undefined,
      tax_id: formData.value.tax_id || undefined,
      year_established: formData.value.year_established ? parseInt(formData.value.year_established) : undefined,
      specialties: formData.value.specialties,
      custom_specialties: formData.value.custom_specialties,
      services: formData.value.services,
      custom_services: formData.value.custom_services,
      operating_hours: formData.value.operating_hours,
      number_of_doctors: formData.value.number_of_doctors ? parseInt(formData.value.number_of_doctors) : undefined,
      number_of_staff: formData.value.number_of_staff ? parseInt(formData.value.number_of_staff) : undefined,
      description: formData.value.description || undefined,
      location: clinicLocation.value || undefined,
    });

    if (result.success) {
      success.value = true;
      localStorage.removeItem('clinicSignUpData');
      setTimeout(() => {
        router.push('/clinic-signin');
        props.onSuccess?.();
      }, 3000);
    } else {
      error.value = result.error || 'Registration failed';
    }
  } catch (err) {
    console.error('Registration error:', err);
    error.value = 'An unexpected error occurred';
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  // Persist form data on changes
  const saveFormData = () => {
    localStorage.setItem('clinicSignUpData', JSON.stringify(formData.value));
  };

  // Watch for form data changes
  const unwatchFormData = watch(formData, saveFormData, { deep: true });

  onUnmounted(unwatchFormData);
});
</script>
