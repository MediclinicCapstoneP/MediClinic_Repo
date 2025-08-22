<template>
  <div v-if="loading" class="p-6">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <Loader2 class="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Loading Profile</h3>
        <p class="text-gray-600">Please wait while we fetch your information...</p>
      </div>
    </div>
  </div>

  <div v-else-if="error" class="p-6">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white rounded-lg shadow-md p-8 text-center">
        <AlertTriangle class="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Error Loading Profile</h3>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <Button @click="() => window.location.reload()">Try Again</Button>
      </div>
    </div>
  </div>

  <div v-else class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Patient Profile</h1>
        <p class="text-gray-600">Manage your personal and medical information</p>
      </div>
      <div class="flex space-x-2">
        <Button v-if="isEditing" variant="outline" @click="handleCancel">Cancel</Button>
        <Button
          :variant="isEditing ? 'gradient' : 'outline'"
          @click="() => (isEditing ? handleSave() : setIsEditing(true))"
          :loading="isSaving"
        >
          <template v-if="isEditing">
            <Save size="16" class="mr-2" />
            Save Changes
          </template>
          <template v-else>
            <Edit size="16" class="mr-2" />
            Edit Profile
          </template>
        </Button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-center space-x-2">
        <AlertCircle size="20" class="text-red-600" />
        <span class="text-red-800">{{ error }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Profile Section -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Profile Picture -->
        <Card>
          <CardContent class="p-6 text-center">
            <ProfilePicture
              :currentImageUrl="patientData.profile_picture_url || undefined"
              :currentImagePath="patientData.profile_picture_path || undefined"
              :userId="patientData.user_id"
              userType="patient"
              size="xl"
              @imageUpdate="handleProfilePictureUpdate"
              @imageDelete="handleProfilePictureDelete"
              :disabled="!isEditing"
              class="mx-auto"
            />
            <h3 class="text-xl font-semibold text-gray-900 mt-4">
              {{ patientData.first_name }} {{ patientData.last_name }}
            </h3>
            <p class="text-gray-600">{{ patientData.email }}</p>
          </CardContent>
        </Card>

        <!-- Quick Stats -->
        <Card>
          <CardHeader>
            <h3 class="text-lg font-semibold text-gray-900">Quick Stats</h3>
          </CardHeader>
          <CardContent class="pt-0">
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Blood Type</span>
                <span class="font-medium">{{ patientData.blood_type || 'Not specified' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Allergies</span>
                <span class="font-medium">{{ patientData.allergies || 'None' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Active Medications</span>
                <span class="font-medium">{{ patientData.medications || 'None' }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Tab Navigation -->
        <Card>
          <CardContent class="p-0">
            <div class="flex border-b">
              <button
                @click="() => setActiveTab('personal')"
                :class="[
                  'flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'personal'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                ]"
              >
                <User size="16" class="mr-2 inline" />
                Personal Info
              </button>
              <button
                @click="() => setActiveTab('medical')"
                :class="[
                  'flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'medical'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                ]"
              >
                <Heart size="16" class="mr-2 inline" />
                Medical Info
              </button>
              <button
                @click="() => setActiveTab('settings')"
                :class="[
                  'flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'settings'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                ]"
              >
                <AlertTriangle size="16" class="mr-2 inline" />
                Settings
              </button>
            </div>
          </CardContent>
        </Card>

        <!-- Tab Content -->
        <Card v-if="activeTab === 'personal'">
          <CardHeader>
            <h3 class="text-lg font-semibold text-gray-900">Personal Information</h3>
          </CardHeader>
          <CardContent class="pt-0 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                :value="patientData.first_name"
                @input="(e) => handleInputChange('first_name', e.target.value)"
                :disabled="!isEditing"
              />
              <Input
                label="Last Name"
                :value="patientData.last_name"
                @input="(e) => handleInputChange('last_name', e.target.value)"
                :disabled="!isEditing"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                :value="patientData.email"
                @input="(e) => handleInputChange('email', e.target.value)"
                :disabled="!isEditing"
              />
              <Input
                label="Phone Number"
                :value="patientData.phone || ''"
                @input="(e) => handleInputChange('phone', e.target.value)"
                :disabled="!isEditing"
              />
            </div>

            <Input
              label="Date of Birth"
              type="date"
              :value="patientData.date_of_birth || ''"
              @input="(e) => handleInputChange('date_of_birth', e.target.value)"
              :disabled="!isEditing"
            />

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                :value="patientData.address || ''"
                @input="(e) => handleInputChange('address', e.target.value)"
                :disabled="!isEditing"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                rows="2"
              ></textarea>
            </div>

            <Input
              label="Emergency Contact"
              :value="patientData.emergency_contact || ''"
              @input="(e) => handleInputChange('emergency_contact', e.target.value)"
              :disabled="!isEditing"
            />
          </CardContent>
        </Card>

        <Card v-if="activeTab === 'medical'">
          <CardHeader>
            <h3 class="text-lg font-semibold text-gray-900">Medical Information</h3>
          </CardHeader>
          <CardContent class="pt-0 space-y-4">
            <Input
              label="Blood Type"
              :value="patientData.blood_type || ''"
              @input="(e) => handleInputChange('blood_type', e.target.value)"
              :disabled="!isEditing"
              placeholder="e.g., O+, A-, B+, AB-"
            />

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
              <textarea
                :value="patientData.allergies || ''"
                @input="(e) => handleInputChange('allergies', e.target.value)"
                :disabled="!isEditing"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                rows="2"
                placeholder="List any allergies (e.g., Penicillin, Peanuts, Latex)"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
              <textarea
                :value="patientData.medications || ''"
                @input="(e) => handleInputChange('medications', e.target.value)"
                :disabled="!isEditing"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                rows="3"
                placeholder="List current medications with dosages"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
              <textarea
                :value="patientData.medical_conditions || ''"
                @input="(e) => handleInputChange('medical_conditions', e.target.value)"
                :disabled="!isEditing"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                rows="3"
                placeholder="List any chronic conditions or medical history"
              ></textarea>
            </div>
          </CardContent>
        </Card>

        <Card v-if="activeTab === 'settings'">
          <CardHeader>
            <h3 class="text-lg font-semibold text-gray-900">Account Settings</h3>
          </CardHeader>
          <CardContent class="pt-0 space-y-6">
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div class="flex items-start">
                <AlertTriangle class="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 class="text-sm font-medium text-yellow-800">Danger Zone</h4>
                  <p class="text-sm text-yellow-700 mt-1">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              @click="handleDeleteAccount"
              class="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 size="16" class="mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { Loader2, AlertTriangle, Save, Edit, AlertCircle, User, Heart, Trash2 } from 'lucide-vue-next';
import Button from '../../shared/components/ui/Button/Button.vue';
import Card from '../../shared/components/ui/Card/Card.vue';
import CardHeader from '../../shared/components/ui/Card/CardHeader.vue';
import CardContent from '../../shared/components/ui/Card/CardContent.vue';
import Input from '../../shared/components/ui/Input/Input.vue';
import ProfilePicture from '../../shared/components/ui/ProfilePicture/ProfilePicture.vue';
import { authService } from '../../services/auth-service';
import { patientService } from '../../services/patient-service';

// State
const activeTab = ref('personal');
const isEditing = ref(false);
const isSaving = ref(false);
const loading = ref(true);
const error = ref('');

interface PatientData {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  blood_type?: string;
  allergies?: string;
  medications?: string;
  medical_conditions?: string;
  profile_picture_url?: string;
  profile_picture_path?: string;
  [key: string]: any;
}

const patientData = reactive<PatientData>({
  user_id: '',
  first_name: '',
  last_name: '',
  email: ''
});

// Methods
const setActiveTab = (tab: string) => {
  activeTab.value = tab;
};

const setIsEditing = (value: boolean) => {
  isEditing.value = value;
};

const handleInputChange = (field: string, value: string) => {
  patientData[field] = value;
};

const sanitizeDataForDatabase = (data: PatientData) => {
  const sanitized = { ...data };
  // Remove any fields that shouldn't be sent to the database
  delete sanitized.profile_picture_url;
  return sanitized;
};

const handleSave = async () => {
  try {
    isSaving.value = true;
    error.value = '';

    const sanitizedData = sanitizeDataForDatabase(patientData);
    await patientService.updatePatientProfile(sanitizedData);

    isEditing.value = false;
  } catch (err: any) {
    error.value = err.message || 'Failed to save profile changes';
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  // Reset any changes by reloading the data
  loadPatientData();
  isEditing.value = false;
};

const handleProfilePictureUpdate = (imageUrl: string, imagePath: string) => {
  patientData.profile_picture_url = imageUrl;
  patientData.profile_picture_path = imagePath;
};

const handleProfilePictureDelete = () => {
  patientData.profile_picture_url = '';
  patientData.profile_picture_path = '';
};

const handleDeleteAccount = async () => {
  if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    return;
  }

  try {
    loading.value = true;
    await authService.deleteAccount();
    // Redirect to login page after successful deletion
    window.location.href = '/login';
  } catch (err: any) {
    error.value = err.message || 'Failed to delete account';
    loading.value = false;
  }
};

const loadPatientData = async () => {
  try {
    loading.value = true;
    error.value = '';

    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const patientProfile = await patientService.getPatientProfile(user.id);

    // Update the reactive object with the fetched data
    Object.assign(patientData, patientProfile);
  } catch (err: any) {
    error.value = err.message || 'Failed to load profile data';
  } finally {
    loading.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  loadPatientData();
});
</script>
