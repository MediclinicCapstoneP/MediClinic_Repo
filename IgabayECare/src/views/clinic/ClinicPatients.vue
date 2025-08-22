<script setup lang="ts">
import { ref } from 'vue';
import { User, Search, Filter, MoreHorizontal, Phone, Mail, Calendar, FileText, Eye } from 'lucide-vue-next';
import Button from '../../components/ui/Button.vue';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.vue';
import Input from '../../components/ui/Input.vue';
import Modal from '../../components/ui/Modal.vue';

const searchQuery = ref('');
const selectedFilter = ref('all');
const showPatientModal = ref(false);
const selectedPatient = ref<any>(null);

const patients = [
  {
    id: 1,
    name: 'John Smith',
    age: 35,
    gender: 'Male',
    email: 'john.smith@email.com',
    phone: '+1 234-567-8900',
    lastVisit: '2024-01-15',
    nextAppointment: '2024-02-20',
    status: 'active',
    primaryDoctor: 'Dr. Sarah Johnson',
    medicalHistory: ['Hypertension', 'Diabetes Type 2'],
    allergies: ['Penicillin'],
    emergencyContact: 'Jane Smith (+1 234-567-8901)'
  },
  {
    id: 2,
    name: 'Emily Davis',
    age: 28,
    gender: 'Female',
    email: 'emily.davis@email.com',
    phone: '+1 234-567-8901',
    lastVisit: '2024-01-10',
    nextAppointment: null,
    status: 'active',
    primaryDoctor: 'Dr. Emily Davis',
    medicalHistory: ['Asthma'],
    allergies: ['Dust', 'Pollen'],
    emergencyContact: 'Mike Davis (+1 234-567-8902)'
  },
  {
    id: 3,
    name: 'Michael Chen',
    age: 42,
    gender: 'Male',
    email: 'michael.chen@email.com',
    phone: '+1 234-567-8902',
    lastVisit: '2024-01-05',
    nextAppointment: '2024-01-25',
    status: 'active',
    primaryDoctor: 'Dr. Michael Wilson',
    medicalHistory: ['Heart Disease', 'High Cholesterol'],
    allergies: ['Shellfish'],
    emergencyContact: 'Lisa Chen (+1 234-567-8903)'
  },
  {
    id: 4,
    name: 'Sarah Brown',
    age: 31,
    gender: 'Female',
    email: 'sarah.brown@email.com',
    phone: '+1 234-567-8903',
    lastVisit: '2024-01-12',
    nextAppointment: null,
    status: 'inactive',
    primaryDoctor: 'Dr. Sarah Johnson',
    medicalHistory: ['Migraine'],
    allergies: ['None'],
    emergencyContact: 'Tom Brown (+1 234-567-8904)'
  }
];

const filters = [
  { id: 'all', label: 'All Patients' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'has-appointment', label: 'Has Appointment' },
  { id: 'no-appointment', label: 'No Appointment' }
];

const filteredPatients = computed(() => {
  return patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                       patient.email.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesFilter = selectedFilter.value === 'all' || 
                       patient.status === selectedFilter.value ||
                       (selectedFilter.value === 'has-appointment' && patient.nextAppointment) ||
                       (selectedFilter.value === 'no-appointment' && !patient.nextAppointment);
    return matchesSearch && matchesFilter;
  });
});

const handleViewPatient = (patient: any) => {
  selectedPatient.value = patient;
  showPatientModal.value = true;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Not scheduled';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Registered Patients</h1>
        <p class="text-gray-600">View and manage patient records</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col md:flex-row gap-4">
      <div class="relative flex-grow">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          v-model="searchQuery"
          placeholder="Search patients by name or email"
          class="pl-10"
        />
      </div>
      <div class="w-full md:w-64">
        <select
          v-model="selectedFilter"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="filter in filters" :key="filter.id" :value="filter.id">
            {{ filter.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Patients Grid -->
    <div v-if="filteredPatients.length === 0" class="text-center py-12">
      <User class="h-12 w-12 mx-auto text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900">No patients found</h3>
      <p class="mt-2 text-gray-500">
        Try adjusting your filters or search criteria
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="patient in filteredPatients" :key="patient.id" class="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader class="pb-0 pt-6 px-6">
          <div class="flex justify-between items-start">
            <div class="flex items-center space-x-4">
              <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <User class="h-6 w-6" />
              </div>
              <div>
                <CardTitle class="text-lg font-semibold">
                  {{ patient.name }}
                </CardTitle>
                <div class="flex items-center mt-1">
                  <span class="text-sm text-gray-500 mr-2">{{ patient.age }} yrs, {{ patient.gender }}</span>
                  <span class="px-2 py-0.5 text-xs rounded-full" :class="getStatusColor(patient.status)">
                    {{ patient.status.charAt(0).toUpperCase() + patient.status.slice(1) }}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
              <MoreHorizontal class="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent class="p-6">
          <div class="space-y-3">
            <div class="flex items-center text-sm">
              <Mail class="h-4 w-4 mr-2 text-gray-500" />
              <span>{{ patient.email }}</span>
            </div>
            <div class="flex items-center text-sm">
              <Phone class="h-4 w-4 mr-2 text-gray-500" />
              <span>{{ patient.phone }}</span>
            </div>
            <div class="flex items-center text-sm">
              <Calendar class="h-4 w-4 mr-2 text-gray-500" />
              <span>Next Appointment: {{ formatDate(patient.nextAppointment) }}</span>
            </div>
            <div class="flex items-center text-sm">
              <User class="h-4 w-4 mr-2 text-gray-500" />
              <span>{{ patient.primaryDoctor }}</span>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100 flex justify-end">
            <Button
              @click="handleViewPatient(patient)"
              variant="outline"
              size="sm"
              class="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Eye class="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Patient Details Modal -->
    <Modal v-if="showPatientModal" @close="showPatientModal = false" title="Patient Details">
      <div class="p-6">
        <div v-if="selectedPatient" class="space-y-6">
          <!-- Basic Info -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-sm font-medium text-gray-500">Full Name</p>
                <p class="text-base">{{ selectedPatient.name }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Age & Gender</p>
                <p class="text-base">{{ selectedPatient.age }} years, {{ selectedPatient.gender }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Email</p>
                <p class="text-base">{{ selectedPatient.email }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Phone</p>
                <p class="text-base">{{ selectedPatient.phone }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Status</p>
                <p class="inline-flex px-2 py-1 text-sm rounded-full" :class="getStatusColor(selectedPatient.status)">
                  {{ selectedPatient.status.charAt(0).toUpperCase() + selectedPatient.status.slice(1) }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Primary Doctor</p>
                <p class="text-base">{{ selectedPatient.primaryDoctor }}</p>
              </div>
            </div>
          </div>

          <!-- Appointments -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">Appointments</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-sm font-medium text-gray-500">Last Visit</p>
                <p class="text-base">{{ formatDate(selectedPatient.lastVisit) }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Next Appointment</p>
                <p class="text-base">{{ formatDate(selectedPatient.nextAppointment) }}</p>
              </div>
            </div>
          </div>

          <!-- Medical Information -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">Medical Information</h3>
            <div class="space-y-4">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Medical History</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(condition, index) in selectedPatient.medicalHistory"
                    :key="index"
                    class="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {{ condition }}
                  </span>
                  <span v-if="selectedPatient.medicalHistory.length === 0" class="text-gray-500">
                    No medical history recorded
                  </span>
                </div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Allergies</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(allergy, index) in selectedPatient.allergies"
                    :key="index"
                    class="px-2 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                  >
                    {{ allergy }}
                  </span>
                  <span v-if="selectedPatient.allergies.length === 0 || selectedPatient.allergies[0] === 'None'" class="text-gray-500">
                    No allergies recorded
                  </span>
                </div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Emergency Contact</p>
                <p class="text-base">{{ selectedPatient.emergencyContact }}</p>
              </div>
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              @click="showPatientModal = false"
              variant="outline"
              class="border-gray-300 text-gray-700"
            >
              Close
            </Button>
            <Button variant="default">
              <FileText class="h-4 w-4 mr-2" />
              View Full Records
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>