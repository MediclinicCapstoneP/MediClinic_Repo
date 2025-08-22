<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  User,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Star,
  Loader2
} from 'lucide-vue-next';
import Button from '../../components/ui/Button.vue';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.vue';
import Input from '../../components/ui/Input.vue';
import Modal from '../../components/ui/Modal.vue';
import {
  doctorService,
  type DoctorProfile,
  type CreateDoctorData
} from '../../features/auth/utils/doctorService';
import { roleBasedAuthService } from '../../features/auth/utils/roleBasedAuthService';
import { clinicService } from '../../features/auth/utils/clinicService';

const defaultFormState = {
  full_name: '',
  specialization: '',
  email: '',
  phone: '',
  license_number: '',
  years_experience: '',
  availability: '',
  username: '',
  password: '',
  confirmPassword: ''
};

type FormState = typeof defaultFormState;

const doctors = ref<DoctorProfile[]>([]);
const loading = ref(true);
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedDoctor = ref<DoctorProfile | null>(null);
const submitting = ref(false);
const searchQuery = ref('');
const filterSpecialty = ref('all');
const currentClinic = ref<any>(null);
const availableSpecializations = ref<string[]>([]);
const clinicSpecializationsHint = ref<string | null>(null);

onMounted(async () => {
  await loadClinicData();
  await loadDoctors();
  await loadSpecializations();
});

const loadClinicData = async () => {
  try {
    const user = await roleBasedAuthService.getCurrentUser();
    if (user && user.clinic_id) {
      const clinicData = await clinicService.getClinicById(user.clinic_id);
      if (clinicData.success && clinicData.clinic) {
        currentClinic.value = clinicData.clinic;
      }
    }
  } catch (error) {
    console.error('Error loading clinic data:', error);
  }
};

const loadDoctors = async () => {
  try {
    loading.value = true;
    if (currentClinic.value && currentClinic.value.id) {
      const result = await doctorService.getDoctorsByClinicId(currentClinic.value.id);
      if (result.success && result.doctors) {
        doctors.value = result.doctors;
      }
    }
  } catch (error) {
    console.error('Error loading doctors:', error);
  } finally {
    loading.value = false;
  }
};

const loadSpecializations = async () => {
  try {
    // Common specializations
    const commonSpecializations = [
      'General Medicine',
      'Pediatrics',
      'Cardiology',
      'Dermatology',
      'Orthopedics',
      'Neurology',
      'Gynecology',
      'Ophthalmology',
      'Psychiatry',
      'Radiology',
      'Urology',
      'Endocrinology',
      'Gastroenterology',
      'Oncology',
      'Pulmonology'
    ];

    // If clinic has specializations, use those, otherwise use common ones
    if (
      currentClinic.value &&
      currentClinic.value.specializations &&
      currentClinic.value.specializations.length > 0
    ) {
      availableSpecializations.value = currentClinic.value.specializations;
      clinicSpecializationsHint.value = null;
    } else {
      availableSpecializations.value = commonSpecializations;
      clinicSpecializationsHint.value =
        'Note: Your clinic has no specializations set. You can add them in clinic settings.';
    }
  } catch (error) {
    console.error('Error loading specializations:', error);
    // Fallback to common specializations
    availableSpecializations.value = [
      'General Medicine',
      'Pediatrics',
      'Cardiology',
      'Dermatology',
      'Orthopedics'
    ];
  }
};

const handleAddDoctor = () => {
  showAddModal.value = true;
};

const handleEditDoctor = (doctor: DoctorProfile) => {
  selectedDoctor.value = doctor;
  showEditModal.value = true;
};

const handleDeleteDoctor = (doctor: DoctorProfile) => {
  selectedDoctor.value = doctor;
  showDeleteModal.value = true;
};

const handleAddSubmit = async (formData: FormState) => {
  if (!currentClinic.value || !currentClinic.value.id) return;

  try {
    submitting.value = true;

    // Split full name into first and last name
    const nameParts = formData.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const doctorData: CreateDoctorData = {
      first_name: firstName,
      last_name: lastName,
      email: formData.email,
      phone: formData.phone,
      specialty: formData.specialization,
      license_number: formData.license_number,
      years_of_experience: parseInt(formData.years_experience) || 0,
      availability: formData.availability,
      clinic_id: currentClinic.value.id,
      username: formData.username || formData.email,
      password: formData.password
    };

    const result = await doctorService.createDoctor(doctorData);
    if (result.success) {
      await loadDoctors();
      showAddModal.value = false;
    } else {
      alert(`Failed to add doctor: ${result.error}`);
    }
  } catch (error: any) {
    console.error('Error adding doctor:', error);
    alert(`Error adding doctor: ${error.message || 'Unknown error'}`);
  } finally {
    submitting.value = false;
  }
};

const handleEditSubmit = async (formData: FormState) => {
  if (!selectedDoctor.value || !selectedDoctor.value.id) return;

  try {
    submitting.value = true;

    // Split full name into first and last name
    const nameParts = formData.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const updateData: Partial<DoctorProfile> = {
      first_name: firstName,
      last_name: lastName,
      email: formData.email,
      phone: formData.phone,
      specialty: formData.specialization,
      license_number: formData.license_number,
      years_of_experience: parseInt(formData.years_experience) || 0,
      availability: formData.availability
    };

    const result = await doctorService.updateDoctor(selectedDoctor.value.id, updateData);
    if (result.success) {
      await loadDoctors();
      showEditModal.value = false;
      selectedDoctor.value = null;
    } else {
      alert(`Failed to update doctor: ${result.error}`);
    }
  } catch (error: any) {
    console.error('Error updating doctor:', error);
    alert(`Error updating doctor: ${error.message || 'Unknown error'}`);
  } finally {
    submitting.value = false;
  }
};

const handleDeleteSubmit = async () => {
  if (!selectedDoctor.value || !selectedDoctor.value.id) return;

  try {
    submitting.value = true;
    const result = await doctorService.deleteDoctor(selectedDoctor.value.id);
    if (result.success) {
      await loadDoctors();
      showDeleteModal.value = false;
      selectedDoctor.value = null;
    } else {
      alert(`Failed to delete doctor: ${result.error}`);
    }
  } catch (error: any) {
    console.error('Error deleting doctor:', error);
    alert(`Error deleting doctor: ${error.message || 'Unknown error'}`);
  } finally {
    submitting.value = false;
  }
};

const filteredDoctors = computed(() => {
  return doctors.value
    .filter(doctor => {
      const fullName = `${doctor.first_name} ${doctor.last_name}`;
      const matchesSearch = searchQuery.value
        ? fullName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          doctor.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          doctor.specialty.toLowerCase().includes(searchQuery.value.toLowerCase())
        : true;

      const matchesSpecialty =
        filterSpecialty.value === 'all' || doctor.specialty === filterSpecialty.value;

      return matchesSearch && matchesSpecialty;
    })
    .sort((a, b) => {
      // Sort by name
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
});

const specialties = computed(() => {
  const uniqueSpecialties = new Set<string>();
  doctors.value.forEach(doctor => {
    if (doctor.specialty) {
      uniqueSpecialties.add(doctor.specialty);
    }
  });
  return Array.from(uniqueSpecialties).sort();
});

const getInitialFormData = (doctor: DoctorProfile | null): FormState => {
  if (!doctor) return defaultFormState;

  return {
    full_name: `${doctor.first_name} ${doctor.last_name}`,
    specialization: doctor.specialty || '',
    email: doctor.email || '',
    phone: doctor.phone || '',
    license_number: doctor.license_number || '',
    years_experience: doctor.years_of_experience?.toString() || '',
    availability: doctor.availability || '',
    username: doctor.username || '',
    password: '',
    confirmPassword: ''
  };
};
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Doctor Management</h1>
        <p class="text-gray-600">Manage your clinic's medical staff</p>
      </div>
      <Button @click="handleAddDoctor" class="mt-4 md:mt-0" variant="default">
        <Plus class="h-4 w-4 mr-2" />
        Add Doctor
      </Button>
    </div>

    <!-- Filters -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="relative flex-grow">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          v-model="searchQuery"
          placeholder="Search doctors by name, email, or specialty"
          class="pl-10"
        />
      </div>
      <div class="w-full md:w-64">
        <select
          v-model="filterSpecialty"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Specialties</option>
          <option v-for="specialty in specialties" :key="specialty" :value="specialty">
            {{ specialty }}
          </option>
        </select>
      </div>
    </div>

    <!-- Doctors Grid -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-blue-500" />
    </div>

    <div v-else-if="filteredDoctors.length === 0" class="text-center py-12">
      <User class="h-12 w-12 mx-auto text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900">No doctors found</h3>
      <p class="mt-2 text-gray-500">
        {{ searchQuery || filterSpecialty !== 'all' ? 'Try adjusting your filters' : 'Add your first doctor to get started' }}
      </p>
      <Button @click="handleAddDoctor" class="mt-4" variant="default">
        <Plus class="h-4 w-4 mr-2" />
        Add Doctor
      </Button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="doctor in filteredDoctors" :key="doctor.id" class="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader class="pb-0 pt-6 px-6">
          <div class="flex justify-between items-start">
            <div class="flex items-center space-x-4">
              <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User class="h-6 w-6" />
              </div>
              <div>
                <CardTitle class="text-lg font-semibold">
                  Dr. {{ doctor.first_name }} {{ doctor.last_name }}
                </CardTitle>
                <p class="text-sm text-blue-600 font-medium">{{ doctor.specialty }}</p>
              </div>
            </div>
            <div class="relative">
              <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                <MoreHorizontal class="h-4 w-4" />
              </Button>
              <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                <div class="py-1">
                  <button
                    @click="handleEditDoctor(doctor)"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    @click="handleDeleteDoctor(doctor)"
                    class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent class="p-6">
          <div class="space-y-3">
            <div class="flex items-center text-sm">
              <Mail class="h-4 w-4 mr-2 text-gray-500" />
              <span>{{ doctor.email }}</span>
            </div>
            <div class="flex items-center text-sm">
              <Phone class="h-4 w-4 mr-2 text-gray-500" />
              <span>{{ doctor.phone || 'No phone number' }}</span>
            </div>
            <div class="flex items-center text-sm">
              <Calendar class="h-4 w-4 mr-2 text-gray-500" />
              <span>{{ doctor.availability || 'No availability set' }}</span>
            </div>
            <div class="pt-2 flex justify-between items-center">
              <div class="text-xs text-gray-500">
                License: {{ doctor.license_number }}
              </div>
              <div class="text-xs text-gray-500">
                {{ doctor.years_of_experience }} years exp.
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-2">
            <Button
              @click="handleEditDoctor(doctor)"
              variant="outline"
              size="sm"
              class="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Edit
            </Button>
            <Button
              @click="handleDeleteDoctor(doctor)"
              variant="outline"
              size="sm"
              class="text-red-600 border-red-200 hover:bg-red-50"
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Add Doctor Modal -->
    <Modal v-if="showAddModal" @close="showAddModal = false" title="Add New Doctor">
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <Input
              v-model="addForm.full_name"
              placeholder="Dr. John Doe"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Specialization *
            </label>
            <select
              v-model="addForm.specialization"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select specialization</option>
              <option v-for="specialization in availableSpecializations" :key="specialization" :value="specialization">
                {{ specialization }}
              </option>
            </select>
            <p v-if="clinicSpecializationsHint" class="mt-1 text-xs text-amber-600">
              {{ clinicSpecializationsHint }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <Input
              v-model="addForm.email"
              type="email"
              placeholder="doctor@example.com"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <Input
              v-model="addForm.phone"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
            <Input
              v-model="addForm.license_number"
              placeholder="MD12345"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
            <Input
              v-model="addForm.years_experience"
              type="number"
              placeholder="5"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Availability</label>
            <Input
              v-model="addForm.availability"
              placeholder="Mon-Fri: 9am-5pm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <Input
              v-model="addForm.username"
              placeholder="(Optional - email will be used if empty)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <Input
              v-model="addForm.password"
              type="password"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
            <Input
              v-model="addForm.confirmPassword"
              type="password"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div v-if="addForm.password && addForm.confirmPassword && !passwordsMatch" class="text-red-500 text-sm">
          Passwords do not match
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <Button
            @click="showAddModal = false"
            variant="outline"
            class="border-gray-300 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            @click="handleAddSubmit(addForm)"
            variant="default"
            :disabled="submitting || !requiredFilled || !passwordsMatch"
            class="relative"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 mr-2 animate-spin" />
            <span>Add Doctor</span>
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Edit Doctor Modal -->
    <Modal v-if="showEditModal" @close="showEditModal = false" title="Edit Doctor">
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <Input
              v-model="editForm.full_name"
              placeholder="Dr. John Doe"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Specialization *
            </label>
            <select
              v-model="editForm.specialization"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select specialization</option>
              <option v-for="specialization in availableSpecializations" :key="specialization" :value="specialization">
                {{ specialization }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <Input
              v-model="editForm.email"
              type="email"
              placeholder="doctor@example.com"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <Input
              v-model="editForm.phone"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
            <Input
              v-model="editForm.license_number"
              placeholder="MD12345"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
            <Input
              v-model="editForm.years_experience"
              type="number"
              placeholder="5"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Availability</label>
            <Input
              v-model="editForm.availability"
              placeholder="Mon-Fri: 9am-5pm"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <Button
            @click="showEditModal = false"
            variant="outline"
            class="border-gray-300 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            @click="handleEditSubmit(editForm)"
            variant="default"
            :disabled="submitting || !requiredFilled"
            class="relative"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 mr-2 animate-spin" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-if="showDeleteModal" @close="showDeleteModal = false" title="Confirm Deletion">
      <div class="p-6 space-y-4">
        <p class="text-gray-700">
          Are you sure you want to delete Dr. {{ selectedDoctor?.first_name }} {{ selectedDoctor?.last_name }}?
          This action cannot be undone.
        </p>

        <div class="flex justify-end space-x-3 pt-4">
          <Button
            @click="showDeleteModal = false"
            variant="outline"
            class="border-gray-300 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            @click="handleDeleteSubmit"
            variant="destructive"
            :disabled="submitting"
            class="relative"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 mr-2 animate-spin" />
            <span>Delete Doctor</span>
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
export default {
  setup() {
    const addForm = reactive({
      ...defaultFormState
    });

    const editForm = reactive({
      ...defaultFormState
    });

    // Computed properties for form validation
    const passwordsMatch = computed(() => addForm.password === addForm.confirmPassword);
    const requiredFilled = computed(() => {
      return (
        addForm.full_name &&
        addForm.specialization &&
        addForm.email &&
        addForm.license_number &&
        addForm.password &&
        addForm.confirmPassword
      );
    });

    return {
      addForm,
      editForm,
      passwordsMatch,
      requiredFilled
    };
  }
};
</script>