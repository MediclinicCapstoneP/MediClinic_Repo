<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  User, Calendar, Clock, CheckCircle, Edit, Camera, 
  LogOut, Search, Filter, Plus, FileText, Stethoscope,
  AlertCircle, CheckSquare, CalendarDays, UserCheck,
  ArrowLeft, ArrowRight, X, Save, Upload, Eye,
  Heart, Pill, Activity, History, Settings, Mail, Phone
} from 'lucide-vue-next';
import Button from '../../components/ui/Button.vue';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.vue';
import Input from '../../components/ui/Input.vue';
import Modal from '../../components/ui/Modal.vue';
import ConfirmDialog from '../../components/ui/ConfirmDialog.vue';
import { roleBasedAuthService } from '../../features/auth/utils/roleBasedAuthService';
import { prescriptionService, type PrescriptionWithPatient, type CreatePrescriptionData } from '../../features/auth/utils/prescriptionService';
import DashboardLayout from '../../components/layout/DashboardLayout.vue';
import DoctorAppointments from './DoctorAppointments.vue';
import { SkeletonDashboard } from '../../components/ui/Skeleton.vue';

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: string;
  notes?: string;
  prescription?: string;
  followUpDate?: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  lastVisit?: string;
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
}

const router = useRouter();
const currentUser = ref<any>(null);
const loading = ref(true);
const activeTab = ref('appointments');
const appointments = ref<Appointment[]>([]);
const patients = ref<Patient[]>([]);
const prescriptions = ref<PrescriptionWithPatient[]>([]);
const selectedPatient = ref<Patient | null>(null);
const selectedAppointment = ref<Appointment | null>(null);
const showRescheduleModal = ref(false);
const showPrescriptionModal = ref(false);
const showProfileModal = ref(false);
const showPatientDetails = ref(false);
const searchQuery = ref('');
const selectedDate = ref('');
const selectedTime = ref('');
const prescriptionData = ref({
  medications: [''],
  dosage: [''],
  frequency: [''],
  duration: [''],
  instructions: [''],
  refills_remaining: [0]
});
const profilePicture = ref<File | null>(null);
const showLogoutConfirm = ref(false);

onMounted(async () => {
  try {
    loading.value = true;
    const user = await roleBasedAuthService.getCurrentUser();
    if (!user || user.role !== 'doctor') {
      router.push('/doctor-signin');
      return;
    }
    currentUser.value = user;
    loadMockData();
  } catch (error) {
    console.error('Auth check error:', error);
    router.push('/doctor-signin');
  } finally {
    loading.value = false;
  }
});

const loadMockData = () => {
  // Mock data for demonstration
  appointments.value = [
    {
      id: '1',
      patientName: 'John Smith',
      patientId: 'p1',
      patientEmail: 'john.smith@example.com',
      patientPhone: '(123) 456-7890',
      date: '2024-01-15',
      time: '09:00 AM',
      status: 'scheduled',
      type: 'Check-up',
      notes: 'Regular check-up appointment'
    },
    {
      id: '2',
      patientName: 'Emily Johnson',
      patientId: 'p2',
      patientEmail: 'emily.johnson@example.com',
      patientPhone: '(123) 456-7891',
      date: '2024-01-15',
      time: '10:30 AM',
      status: 'in-progress',
      type: 'Follow-up',
      notes: 'Follow-up after medication change'
    },
    {
      id: '3',
      patientName: 'Michael Brown',
      patientId: 'p3',
      patientEmail: 'michael.brown@example.com',
      patientPhone: '(123) 456-7892',
      date: '2024-01-16',
      time: '02:00 PM',
      status: 'scheduled',
      type: 'Consultation',
      notes: 'New patient consultation'
    }
  ];

  patients.value = [
    {
      id: 'p1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '(123) 456-7890',
      age: 45,
      gender: 'Male',
      lastVisit: '2023-12-10',
      medicalHistory: 'Hypertension, Type 2 Diabetes',
      allergies: 'Penicillin',
      currentMedications: 'Metformin 500mg, Lisinopril 10mg'
    },
    {
      id: 'p2',
      name: 'Emily Johnson',
      email: 'emily.johnson@example.com',
      phone: '(123) 456-7891',
      age: 32,
      gender: 'Female',
      lastVisit: '2023-12-15',
      medicalHistory: 'Asthma',
      allergies: 'Sulfa drugs',
      currentMedications: 'Albuterol inhaler'
    },
    {
      id: 'p3',
      name: 'Michael Brown',
      email: 'michael.brown@example.com',
      phone: '(123) 456-7892',
      age: 58,
      gender: 'Male',
      lastVisit: null,
      medicalHistory: 'Coronary artery disease, Hyperlipidemia',
      allergies: 'None',
      currentMedications: 'Atorvastatin 20mg, Aspirin 81mg'
    }
  ];

  prescriptions.value = [
    {
      id: '1',
      patient_id: 'p1',
      doctor_id: currentUser.value?.user?.id || '',
      medications: ['Lisinopril'],
      dosage: ['10mg'],
      frequency: ['Once daily'],
      duration: ['30 days'],
      instructions: ['Take in the morning with food'],
      refills_remaining: [2],
      created_at: '2023-12-10',
      updated_at: '2023-12-10',
      patient: {
        id: 'p1',
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@example.com'
      }
    },
    {
      id: '2',
      patient_id: 'p2',
      doctor_id: currentUser.value?.user?.id || '',
      medications: ['Albuterol'],
      dosage: ['90mcg'],
      frequency: ['As needed'],
      duration: ['30 days'],
      instructions: ['2 puffs every 4-6 hours as needed for shortness of breath'],
      refills_remaining: [1],
      created_at: '2023-12-15',
      updated_at: '2023-12-15',
      patient: {
        id: 'p2',
        first_name: 'Emily',
        last_name: 'Johnson',
        email: 'emily.johnson@example.com'
      }
    }
  ];
};

const handleSignOut = async () => {
  try {
    await roleBasedAuthService.signOut();
    router.push('/doctor-signin');
  } catch (error) {
    console.error('Sign out error:', error);
  }
};

const handleSearch = () => {
  // Implement search functionality
  console.log('Searching for:', searchQuery.value);
};

const viewPatientDetails = (patient: Patient) => {
  selectedPatient.value = patient;
  showPatientDetails.value = true;
};

const rescheduleAppointment = (appointment: Appointment) => {
  selectedAppointment.value = appointment;
  selectedDate.value = appointment.date;
  selectedTime.value = appointment.time;
  showRescheduleModal.value = true;
};

const saveReschedule = () => {
  if (selectedAppointment.value && selectedDate.value && selectedTime.value) {
    // Update appointment logic would go here
    console.log('Rescheduled appointment:', {
      appointmentId: selectedAppointment.value.id,
      newDate: selectedDate.value,
      newTime: selectedTime.value
    });
    showRescheduleModal.value = false;
  }
};

const createPrescription = (patient: Patient) => {
  selectedPatient.value = patient;
  prescriptionData.value = {
    medications: [''],
    dosage: [''],
    frequency: [''],
    duration: [''],
    instructions: [''],
    refills_remaining: [0]
  };
  showPrescriptionModal.value = true;
};

const addMedicationField = () => {
  prescriptionData.value.medications.push('');
  prescriptionData.value.dosage.push('');
  prescriptionData.value.frequency.push('');
  prescriptionData.value.duration.push('');
  prescriptionData.value.instructions.push('');
  prescriptionData.value.refills_remaining.push(0);
};

const removeMedicationField = (index: number) => {
  prescriptionData.value.medications.splice(index, 1);
  prescriptionData.value.dosage.splice(index, 1);
  prescriptionData.value.frequency.splice(index, 1);
  prescriptionData.value.duration.splice(index, 1);
  prescriptionData.value.instructions.splice(index, 1);
  prescriptionData.value.refills_remaining.splice(index, 1);
};

const savePrescription = async () => {
  if (!selectedPatient.value || !currentUser.value?.user?.id) return;

  try {
    const prescriptionPayload: CreatePrescriptionData = {
      patient_id: selectedPatient.value.id,
      doctor_id: currentUser.value.user.id,
      medications: prescriptionData.value.medications,
      dosage: prescriptionData.value.dosage,
      frequency: prescriptionData.value.frequency,
      duration: prescriptionData.value.duration,
      instructions: prescriptionData.value.instructions,
      refills_remaining: prescriptionData.value.refills_remaining
    };

    // In a real app, this would call the API
    console.log('Saving prescription:', prescriptionPayload);
    showPrescriptionModal.value = false;
  } catch (error) {
    console.error('Error saving prescription:', error);
  }
};

const editProfile = () => {
  showProfileModal.value = true;
};

const handleProfilePictureChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    profilePicture.value = target.files[0];
  }
};

const saveProfile = () => {
  // Profile update logic would go here
  console.log('Saving profile with new picture:', profilePicture.value);
  showProfileModal.value = false;
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>

<template>
  <div>
    <SkeletonDashboard v-if="loading" />
    <div v-else class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center">
              <Stethoscope class="h-8 w-8 text-blue-600" />
              <h1 class="ml-2 text-xl font-bold text-gray-900">MediClinic</h1>
            </div>
            <div class="flex items-center space-x-4">
              <div class="relative">
                <Input 
                  v-model="searchQuery"
                  type="text" 
                  placeholder="Search..." 
                  class="pl-10"
                  @keyup.enter="handleSearch"
                />
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <div class="flex items-center space-x-2">
                <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center cursor-pointer" @click="editProfile">
                  <User class="h-5 w-5 text-blue-600" />
                </div>
                <div class="text-sm">
                  <div class="font-medium text-gray-900">Dr. {{ currentUser?.user?.first_name }} {{ currentUser?.user?.last_name }}</div>
                  <div class="text-gray-500">{{ currentUser?.user?.email }}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" @click="showLogoutConfirm = true">
                <LogOut class="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Tabs -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="-mb-px flex space-x-8">
            <a 
              href="#" 
              @click.prevent="activeTab = 'appointments'"
              :class="[activeTab === 'appointments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm']"
            >
              <Calendar class="inline-block h-5 w-5 mr-2" />
              Appointments
            </a>
            <a 
              href="#" 
              @click.prevent="activeTab = 'patients'"
              :class="[activeTab === 'patients' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm']"
            >
              <User class="inline-block h-5 w-5 mr-2" />
              Patients
            </a>
            <a 
              href="#" 
              @click.prevent="activeTab = 'prescriptions'"
              :class="[activeTab === 'prescriptions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm']"
            >
              <FileText class="inline-block h-5 w-5 mr-2" />
              Prescriptions
            </a>
          </nav>
        </div>

        <!-- Appointments Tab -->
        <div v-if="activeTab === 'appointments'">
          <DoctorAppointments :doctorId="currentUser?.user?.id || ''" />
        </div>

        <!-- Patients Tab -->
        <div v-if="activeTab === 'patients'" class="space-y-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900">My Patients</h2>
            <div class="flex space-x-2">
              <div class="relative">
                <Input 
                  v-model="searchQuery"
                  type="text" 
                  placeholder="Search patients..." 
                  class="pl-10"
                  @keyup.enter="handleSearch"
                />
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button variant="outline">
                <Filter class="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card v-for="patient in patients" :key="patient.id" class="overflow-hidden">
              <CardContent class="p-6">
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center">
                    <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <User class="h-6 w-6 text-blue-600" />
                    </div>
                    <div class="ml-4">
                      <h3 class="text-lg font-semibold text-gray-900">{{ patient.name }}</h3>
                      <p class="text-sm text-gray-500">{{ patient.age }} years, {{ patient.gender }}</p>
                    </div>
                  </div>
                </div>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center">
                    <Mail class="h-4 w-4 text-gray-400 mr-2" />
                    <span>{{ patient.email }}</span>
                  </div>
                  <div class="flex items-center">
                    <Phone class="h-4 w-4 text-gray-400 mr-2" />
                    <span>{{ patient.phone }}</span>
                  </div>
                  <div class="flex items-center">
                    <Calendar class="h-4 w-4 text-gray-400 mr-2" />
                    <span>Last Visit: {{ formatDate(patient.lastVisit) }}</span>
                  </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                  <Button variant="outline" size="sm" @click="viewPatientDetails(patient)">
                    <Eye class="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" @click="createPrescription(patient)">
                    <FileText class="h-4 w-4 mr-2" />
                    Prescribe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Prescriptions Tab -->
        <div v-if="activeTab === 'prescriptions'" class="space-y-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Prescriptions</h2>
            <div class="flex space-x-2">
              <div class="relative">
                <Input 
                  v-model="searchQuery"
                  type="text" 
                  placeholder="Search prescriptions..." 
                  class="pl-10"
                  @keyup.enter="handleSearch"
                />
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button variant="outline">
                <Filter class="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <Card>
            <CardContent class="p-0">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medication
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dosage & Frequency
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Prescribed
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Refills
                      </th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="prescription in prescriptions" :key="prescription.id">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div>
                            <div class="text-sm font-medium text-gray-900">
                              {{ prescription.patient.first_name }} {{ prescription.patient.last_name }}
                            </div>
                            <div class="text-sm text-gray-500">
                              {{ prescription.patient.email }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                          {{ prescription.medications.join(', ') }}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">
                          {{ prescription.dosage[0] }}, {{ prescription.frequency[0] }}
                        </div>
                        <div class="text-sm text-gray-500">
                          {{ prescription.duration[0] }}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ formatDate(prescription.created_at) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ prescription.refills_remaining[0] }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="outline" size="sm">
                          <Eye class="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>

    <!-- Patient Details Modal -->
    <Modal v-if="showPatientDetails" @close="showPatientDetails = false" title="Patient Details">
      <div class="p-6" v-if="selectedPatient">
        <div class="flex items-center mb-6">
          <div class="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <User class="h-8 w-8 text-blue-600" />
          </div>
          <div class="ml-4">
            <h3 class="text-xl font-semibold text-gray-900">{{ selectedPatient.name }}</h3>
            <p class="text-sm text-gray-500">{{ selectedPatient.age }} years, {{ selectedPatient.gender }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="text-lg font-medium mb-2">Contact Information</h4>
            <div class="space-y-2">
              <div class="flex items-center">
                <Mail class="h-4 w-4 text-gray-400 mr-2" />
                <span>{{ selectedPatient.email }}</span>
              </div>
              <div class="flex items-center">
                <Phone class="h-4 w-4 text-gray-400 mr-2" />
                <span>{{ selectedPatient.phone }}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-lg font-medium mb-2">Medical Information</h4>
            <div class="space-y-2">
              <div>
                <p class="text-sm font-medium text-gray-500">Medical History</p>
                <p>{{ selectedPatient.medicalHistory || 'None recorded' }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Allergies</p>
                <p>{{ selectedPatient.allergies || 'None recorded' }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Current Medications</p>
                <p>{{ selectedPatient.currentMedications || 'None recorded' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-6 border-t border-gray-200">
          <h4 class="text-lg font-medium mb-4">Actions</h4>
          <div class="flex space-x-3">
            <Button variant="outline">
              <Calendar class="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
            <Button variant="outline" @click="createPrescription(selectedPatient)">
              <FileText class="h-4 w-4 mr-2" />
              Create Prescription
            </Button>
            <Button variant="outline">
              <History class="h-4 w-4 mr-2" />
              View History
            </Button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Reschedule Appointment Modal -->
    <Modal v-if="showRescheduleModal" @close="showRescheduleModal = false" title="Reschedule Appointment">
      <div class="p-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">New Date</label>
            <Input v-model="selectedDate" type="date" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">New Time</label>
            <Input v-model="selectedTime" type="time" class="w-full" />
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <Button variant="outline" @click="showRescheduleModal = false">Cancel</Button>
          <Button variant="default" @click="saveReschedule">Save Changes</Button>
        </div>
      </div>
    </Modal>

    <!-- Prescription Modal -->
    <Modal v-if="showPrescriptionModal" @close="showPrescriptionModal = false" title="Create Prescription">
      <div class="p-6">
        <div v-if="selectedPatient" class="mb-6">
          <h3 class="text-lg font-medium">Patient: {{ selectedPatient.name }}</h3>
          <p class="text-sm text-gray-500">{{ selectedPatient.age }} years, {{ selectedPatient.gender }}</p>
        </div>

        <div class="space-y-6">
          <div v-for="(medication, index) in prescriptionData.medications" :key="index" class="p-4 border border-gray-200 rounded-md">
            <div class="flex justify-between items-center mb-4">
              <h4 class="text-md font-medium">Medication #{{ index + 1 }}</h4>
              <Button 
                v-if="prescriptionData.medications.length > 1" 
                variant="ghost" 
                size="sm"
                @click="removeMedicationField(index)"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                <Input v-model="prescriptionData.medications[index]" class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                <Input v-model="prescriptionData.dosage[index]" class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <Input v-model="prescriptionData.frequency[index]" class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <Input v-model="prescriptionData.duration[index]" class="w-full" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea 
                  v-model="prescriptionData.instructions[index]"
                  rows="2"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Refills</label>
                <Input v-model.number="prescriptionData.refills_remaining[index]" type="number" min="0" class="w-full" />
              </div>
            </div>
          </div>

          <Button variant="outline" @click="addMedicationField" class="w-full">
            <Plus class="h-4 w-4 mr-2" />
            Add Another Medication
          </Button>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <Button variant="outline" @click="showPrescriptionModal = false">Cancel</Button>
          <Button variant="default" @click="savePrescription">Save Prescription</Button>
        </div>
      </div>
    </Modal>

    <!-- Profile Modal -->
    <Modal v-if="showProfileModal" @close="showProfileModal = false" title="Edit Profile">
      <div class="p-6">
        <div class="flex flex-col items-center mb-6">
          <div class="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden mb-4">
            <User v-if="!profilePicture" class="h-12 w-12 text-blue-600" />
            <img 
              v-else 
              :src="URL.createObjectURL(profilePicture)" 
              alt="Profile Preview" 
              class="h-full w-full object-cover"
            />
          </div>
          <label class="cursor-pointer">
            <span class="text-sm text-blue-600 hover:text-blue-800">
              <Camera class="h-4 w-4 inline-block mr-1" />
              Change Photo
            </span>
            <input type="file" class="hidden" accept="image/*" @change="handleProfilePictureChange" />
          </label>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <Input :value="currentUser?.user?.first_name || ''" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <Input :value="currentUser?.user?.last_name || ''" class="w-full" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input :value="currentUser?.user?.email || ''" type="email" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <Input :value="currentUser?.user?.phone || ''" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
            <Input :value="currentUser?.doctor?.specialization || ''" class="w-full" />
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <Button variant="outline" @click="showProfileModal = false">Cancel</Button>
          <Button variant="default" @click="saveProfile">
            <Save class="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Logout Confirmation Dialog -->
    <ConfirmDialog
      v-if="showLogoutConfirm"
      @confirm="handleSignOut"
      @cancel="showLogoutConfirm = false"
      title="Sign Out"
      confirmText="Sign Out"
      cancelText="Cancel"
    >
      <p>Are you sure you want to sign out?</p>
    </ConfirmDialog>
  </div>
</template>