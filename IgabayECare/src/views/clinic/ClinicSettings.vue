<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Save, Camera, Clock, DollarSign, Shield, Bell, Edit, Loader2, AlertTriangle } from 'lucide-vue-next';
import Button from '../../components/ui/Button.vue';
import Input from '../../components/ui/Input.vue';
import { Card, CardContent, CardHeader } from '../../components/ui/Card.vue';
import { roleBasedAuthService } from '../../features/auth/utils/roleBasedAuthService';
import { clinicService, type ClinicProfile } from '../../features/auth/utils/clinicService';

const isEditing = ref(false);
const isSaving = ref(false);
const isLoading = ref(true);
const error = ref<string | null>(null);

const clinicData = ref<ClinicProfile>({
  id: '',
  user_id: '',
  clinic_name: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  license_number: '',
  accreditation: '',
  tax_id: '',
  year_established: undefined,
  specialties: [],
  custom_specialties: [],
  services: [],
  custom_services: [],
  operating_hours: {
    monday: { open: '08:00', close: '18:00' },
    tuesday: { open: '08:00', close: '18:00' },
    wednesday: { open: '08:00', close: '18:00' },
    thursday: { open: '08:00', close: '18:00' },
    friday: { open: '08:00', close: '18:00' },
    saturday: { open: '09:00', close: '16:00' },
    sunday: { open: '10:00', close: '14:00' },
  },
  number_of_doctors: 0,
  number_of_staff: 0,
  description: '',
  status: 'pending',
  created_at: '',
  updated_at: '',
});

const originalData = ref<ClinicProfile | null>(null);

const settings = ref({
  paymentBeforeBooking: true,
  emailNotifications: true,
  smsNotifications: false,
  bookingConfirmation: true,
  autoValidation: true,
});

const stats = ref({
  totalDoctors: 0,
  totalPatients: 0,
  thisMonth: 0,
  status: 'pending',
});

// Fetch clinic data from Supabase
onMounted(async () => {
  try {
    isLoading.value = true;
    error.value = null;

    const currentUser = await roleBasedAuthService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'clinic') {
      error.value = 'No authenticated clinic user found. Please sign in as a clinic.';
      return;
    }

    if (!currentUser.user || !currentUser.user.id) {
      error.value = 'Invalid user session. Please sign in again.';
      return;
    }

    console.log('Fetching clinic data for user:', currentUser.user.id);

    const clinicResult = await clinicService.getClinicByUserId(currentUser.user.id);
    if (clinicResult.success && clinicResult.clinic) {
      // Convert null values to empty strings for inputs
      const sanitizedClinic = {
        ...clinicResult.clinic,
        phone: clinicResult.clinic.phone || '',
        website: clinicResult.clinic.website || '',
        address: clinicResult.clinic.address || '',
        city: clinicResult.clinic.city || '',
        state: clinicResult.clinic.state || '',
        zip_code: clinicResult.clinic.zip_code || '',
        license_number: clinicResult.clinic.license_number || '',
        accreditation: clinicResult.clinic.accreditation || '',
        tax_id: clinicResult.clinic.tax_id || '',
        description: clinicResult.clinic.description || '',
      };

      clinicData.value = sanitizedClinic;
      originalData.value = { ...sanitizedClinic };

      // Set stats based on clinic data
      stats.value = {
        totalDoctors: clinicData.value.number_of_doctors || 0,
        totalPatients: 0, // This would come from a separate API call
        thisMonth: 0, // This would come from a separate API call
        status: clinicData.value.status || 'pending',
      };
    } else {
      error.value = clinicResult.error || 'Failed to fetch clinic data';
    }
  } catch (err) {
    console.error('Error fetching clinic data:', err);
    error.value = 'An unexpected error occurred. Please try again later.';
  } finally {
    isLoading.value = false;
  }
});

const handleEdit = () => {
  isEditing.value = true;
};

const handleCancel = () => {
  if (originalData.value) {
    clinicData.value = { ...originalData.value };
  }
  isEditing.value = false;
};

const handleSave = async () => {
  try {
    isSaving.value = true;
    error.value = null;

    if (!clinicData.value.id) {
      error.value = 'Cannot update: Missing clinic ID';
      return;
    }

    const updateResult = await clinicService.updateClinic(clinicData.value.id, clinicData.value);
    if (updateResult.success) {
      originalData.value = { ...clinicData.value };
      isEditing.value = false;
    } else {
      error.value = updateResult.error || 'Failed to update clinic information';
    }
  } catch (err) {
    console.error('Error updating clinic:', err);
    error.value = 'An unexpected error occurred while saving. Please try again.';
  } finally {
    isSaving.value = false;
  }
};

const handleSettingChange = (setting: string, value: boolean) => {
  settings.value = {
    ...settings.value,
    [setting]: value,
  };
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'suspended':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Clinic Settings</h1>
        <p class="text-gray-600">Manage your clinic profile and preferences</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-blue-500" />
      <span class="ml-2 text-gray-600">Loading clinic information...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
      <AlertTriangle class="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
      <div>
        <h3 class="text-sm font-medium text-red-800">Error</h3>
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content - 2/3 width on large screens -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Clinic Profile Card -->
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold">Clinic Profile</h2>
              <p class="text-sm text-gray-500">Manage your clinic's information</p>
            </div>
            <div class="flex space-x-2">
              <Button 
                v-if="!isEditing" 
                @click="handleEdit" 
                variant="outline" 
                size="sm"
              >
                <Edit class="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button 
                v-if="isEditing" 
                @click="handleCancel" 
                variant="outline" 
                size="sm"
              >
                Cancel
              </Button>
              <Button 
                v-if="isEditing" 
                @click="handleSave" 
                variant="default" 
                size="sm"
                :disabled="isSaving"
              >
                <Save v-if="!isSaving" class="h-4 w-4 mr-2" />
                <Loader2 v-else class="h-4 w-4 mr-2 animate-spin" />
                Save Changes
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-6">
              <!-- Clinic Status -->
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500">Clinic Status</p>
                  <div class="mt-1 flex items-center">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                      :class="getStatusColor(stats.status)"
                    >
                      {{ getStatusText(stats.status) }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center space-x-4">
                  <div class="text-center">
                    <p class="text-2xl font-semibold">{{ stats.totalDoctors }}</p>
                    <p class="text-xs text-gray-500">Doctors</p>
                  </div>
                  <div class="text-center">
                    <p class="text-2xl font-semibold">{{ stats.totalPatients }}</p>
                    <p class="text-xs text-gray-500">Patients</p>
                  </div>
                  <div class="text-center">
                    <p class="text-2xl font-semibold">{{ stats.thisMonth }}</p>
                    <p class="text-xs text-gray-500">This Month</p>
                  </div>
                </div>
              </div>

              <!-- Basic Information -->
              <div>
                <h3 class="text-base font-medium mb-3">Basic Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                    <Input 
                      v-model="clinicData.clinic_name" 
                      :disabled="!isEditing" 
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <Input 
                      v-model="clinicData.email" 
                      type="email" 
                      :disabled="!isEditing" 
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <Input 
                      v-model="clinicData.phone" 
                      :disabled="!isEditing" 
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <Input 
                      v-model="clinicData.website" 
                      :disabled="!isEditing" 
                      class="w-full"
                    />
                  </div>
                </div>
              </div>

              <!-- Address Information -->
              <div>
                <h3 class="text-base font-medium mb-3">Address</h3>
                <div class="grid grid-cols-1 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <Input 
                      v-model="clinicData.address" 
                      :disabled="!isEditing" 
                      class="w-full"
                    />
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <Input 
                        v-model="clinicData.city" 
                        :disabled="!isEditing" 
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                      <Input 
                        v-model="clinicData.state" 
                        :disabled="!isEditing" 
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                      <Input 
                        v-model="clinicData.zip_code" 
                        :disabled="!isEditing" 
                        class="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Legal Information -->
              <div>
                <h3 class="text-base font-medium mb-3">Legal Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                    <Input 
                      v-model="clinicData.license_number" 
                      :disabled="!isEditing" 
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                    <Input 
                      v-model="clinicData.tax_id" 
                      :disabled="!isEditing" 
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Accreditation</label>
                    <Input 
                      v-model="clinicData.accreditation" 
                      :disabled="!isEditing" 
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Year Established</label>
                    <Input 
                      v-model="clinicData.year_established" 
                      type="number" 
                      :disabled="!isEditing" 
                      class="w-full"
                    />
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Clinic Description</label>
                <textarea
                  v-model="clinicData.description"
                  :disabled="!isEditing"
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Sidebar - 1/3 width on large screens -->
      <div class="space-y-6">
        <!-- Settings Card -->
        <Card>
          <CardHeader>
            <h2 class="text-xl font-semibold">Preferences</h2>
            <p class="text-sm text-gray-500">Configure your clinic settings</p>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <!-- Payment Settings -->
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="bg-blue-100 p-2 rounded-full">
                    <DollarSign class="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p class="font-medium">Payment Before Booking</p>
                    <p class="text-sm text-gray-500">Require payment to confirm appointments</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="settings.paymentBeforeBooking" 
                    class="sr-only peer"
                    @change="handleSettingChange('paymentBeforeBooking', settings.paymentBeforeBooking)"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <!-- Notification Settings -->
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="bg-blue-100 p-2 rounded-full">
                    <Bell class="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p class="font-medium">Email Notifications</p>
                    <p class="text-sm text-gray-500">Receive email for new appointments</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="settings.emailNotifications" 
                    class="sr-only peer"
                    @change="handleSettingChange('emailNotifications', settings.emailNotifications)"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <!-- SMS Settings -->
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="bg-blue-100 p-2 rounded-full">
                    <Bell class="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p class="font-medium">SMS Notifications</p>
                    <p class="text-sm text-gray-500">Receive text messages for updates</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="settings.smsNotifications" 
                    class="sr-only peer"
                    @change="handleSettingChange('smsNotifications', settings.smsNotifications)"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <!-- Booking Confirmation -->
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="bg-blue-100 p-2 rounded-full">
                    <Shield class="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p class="font-medium">Booking Confirmation</p>
                    <p class="text-sm text-gray-500">Manually confirm each appointment</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="settings.bookingConfirmation" 
                    class="sr-only peer"
                    @change="handleSettingChange('bookingConfirmation', settings.bookingConfirmation)"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <!-- Auto Validation -->
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="bg-blue-100 p-2 rounded-full">
                    <Clock class="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p class="font-medium">Auto Validation</p>
                    <p class="text-sm text-gray-500">Automatically validate appointments</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    v-model="settings.autoValidation" 
                    class="sr-only peer"
                    @change="handleSettingChange('autoValidation', settings.autoValidation)"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Profile Photo Card -->
        <Card>
          <CardHeader>
            <h2 class="text-xl font-semibold">Clinic Logo</h2>
            <p class="text-sm text-gray-500">Upload your clinic logo</p>
          </CardHeader>
          <CardContent>
            <div class="flex flex-col items-center justify-center space-y-4">
              <div class="h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                <!-- Placeholder for clinic logo -->
                <Camera class="h-12 w-12 text-gray-400" />
              </div>
              <Button variant="outline" size="sm">
                <Camera class="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
              <p class="text-xs text-gray-500 text-center">
                Recommended: 300x300px JPG, PNG, or GIF (max 2MB)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>