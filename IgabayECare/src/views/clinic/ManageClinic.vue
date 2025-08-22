<script setup lang="ts">
import { ref } from 'vue';
import { 
  Building, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  BarChart3, 
  Shield, 
  CreditCard,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Award,
  FileCheck,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-vue-next';
import Button from '../../components/ui/Button.vue';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.vue';
import Modal from '../../components/ui/Modal.vue';

const activeSection = ref('overview');
const showModal = ref(false);
const modalType = ref('');

const managementSections = [
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart3,
    description: 'Clinic performance and statistics'
  },
  {
    id: 'schedule',
    label: 'Schedule Management',
    icon: Calendar,
    description: 'Operating hours and availability'
  },
  {
    id: 'services',
    label: 'Services & Specialties',
    icon: FileText,
    description: 'Medical services and specialties offered'
  },
];

const clinicStats = {
  totalPatients: 1247,
  totalDoctors: 8,
  totalStaff: 24,
  averageRating: 4.8,
  monthlyAppointments: 320,
};

const operatingHours = {
  monday: { open: '08:00', close: '18:00', closed: false },
  tuesday: { open: '08:00', close: '18:00', closed: false },
  wednesday: { open: '08:00', close: '18:00', closed: false },
  thursday: { open: '08:00', close: '18:00', closed: false },
  friday: { open: '08:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '16:00', closed: false },
  sunday: { open: '10:00', close: '14:00', closed: false }
};

const services = [
  { id: 1, name: 'Primary Care', active: true, category: 'General' },
  { id: 2, name: 'Cardiology', active: true, category: 'Specialty' },
  { id: 3, name: 'Pediatrics', active: true, category: 'Specialty' },
  { id: 4, name: 'Dermatology', active: false, category: 'Specialty' },
  { id: 5, name: 'Laboratory Services', active: true, category: 'Diagnostic' },
  { id: 6, name: 'Radiology', active: true, category: 'Diagnostic' }
];

const licenses = [
  { id: 1, name: 'Medical License', number: 'MD-12345', expiry: '2025-12-31', status: 'valid' },
  { id: 2, name: 'Clinic Accreditation', number: 'ACC-2024-001', expiry: '2026-06-30', status: 'valid' },
  { id: 3, name: 'Insurance Provider', number: 'INS-789', expiry: '2024-08-15', status: 'expiring' }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
    case 'valid':
      return 'bg-green-100 text-green-800';
    case 'on-leave':
    case 'expiring':
      return 'bg-yellow-100 text-yellow-800';
    case 'inactive':
    case 'expired':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const openModal = (type: string) => {
  modalType.value = type;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getDaysUntilExpiry = (expiryDate: string) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Clinic Management</h1>
        <p class="text-gray-600">Manage your clinic operations and settings</p>
      </div>
    </div>

    <!-- Management Sections -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card 
        v-for="section in managementSections" 
        :key="section.id"
        class="cursor-pointer transition-all hover:shadow-md"
        :class="activeSection === section.id ? 'ring-2 ring-blue-500' : ''"
        @click="activeSection = section.id"
      >
        <CardContent class="p-6 flex items-start space-x-4">
          <div class="bg-blue-100 p-3 rounded-full">
            <component :is="section.icon" class="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 class="font-semibold text-lg">{{ section.label }}</h3>
            <p class="text-gray-500 text-sm">{{ section.description }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Overview Section -->
    <div v-if="activeSection === 'overview'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent class="p-6">
            <div class="flex flex-col items-center">
              <Users class="h-8 w-8 text-blue-500 mb-2" />
              <p class="text-3xl font-bold">{{ clinicStats.totalPatients }}</p>
              <p class="text-sm text-gray-500">Total Patients</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-6">
            <div class="flex flex-col items-center">
              <UserCheck class="h-8 w-8 text-green-500 mb-2" />
              <p class="text-3xl font-bold">{{ clinicStats.totalDoctors }}</p>
              <p class="text-sm text-gray-500">Doctors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-6">
            <div class="flex flex-col items-center">
              <Users class="h-8 w-8 text-purple-500 mb-2" />
              <p class="text-3xl font-bold">{{ clinicStats.totalStaff }}</p>
              <p class="text-sm text-gray-500">Staff Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-6">
            <div class="flex flex-col items-center">
              <Calendar class="h-8 w-8 text-orange-500 mb-2" />
              <p class="text-3xl font-bold">{{ clinicStats.monthlyAppointments }}</p>
              <p class="text-sm text-gray-500">Monthly Appointments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-6">
            <div class="flex flex-col items-center">
              <Award class="h-8 w-8 text-yellow-500 mb-2" />
              <p class="text-3xl font-bold">{{ clinicStats.averageRating }}</p>
              <p class="text-sm text-gray-500">Average Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Licenses and Certifications -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center">
            <Shield class="h-5 w-5 mr-2 text-blue-500" />
            Licenses & Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th class="px-6 py-3">License</th>
                  <th class="px-6 py-3">Number</th>
                  <th class="px-6 py-3">Expiry Date</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="license in licenses" :key="license.id" class="bg-white border-b">
                  <td class="px-6 py-4 font-medium text-gray-900">{{ license.name }}</td>
                  <td class="px-6 py-4">{{ license.number }}</td>
                  <td class="px-6 py-4">{{ formatDate(license.expiry) }}</td>
                  <td class="px-6 py-4">
                    <span 
                      class="px-2 py-1 text-xs rounded-full" 
                      :class="getStatusColor(license.status)"
                    >
                      {{ license.status.charAt(0).toUpperCase() + license.status.slice(1) }}
                      <span v-if="license.status === 'expiring'">
                        ({{ getDaysUntilExpiry(license.expiry) }} days)
                      </span>
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <Button variant="outline" size="sm" @click="openModal('license')">Update</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Schedule Management Section -->
    <div v-if="activeSection === 'schedule'" class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center">
            <Clock class="h-5 w-5 mr-2 text-blue-500" />
            Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="(hours, day) in operatingHours" :key="day" class="flex items-center justify-between py-2 border-b border-gray-100">
              <div class="font-medium capitalize">{{ day }}</div>
              <div class="flex items-center space-x-4">
                <div v-if="!hours.closed" class="flex items-center space-x-2">
                  <div class="text-sm text-gray-600">
                    {{ hours.open }} - {{ hours.close }}
                  </div>
                </div>
                <div v-else class="text-sm text-gray-600">
                  Closed
                </div>
                <Button variant="outline" size="sm" @click="openModal('hours')">Edit</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Services Section -->
    <div v-if="activeSection === 'services'" class="space-y-6">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle class="flex items-center">
            <FileCheck class="h-5 w-5 mr-2 text-blue-500" />
            Services & Specialties
          </CardTitle>
          <Button variant="default" size="sm" @click="openModal('service')">
            Add Service
          </Button>
        </CardHeader>
        <CardContent>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th class="px-6 py-3">Service Name</th>
                  <th class="px-6 py-3">Category</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="service in services" :key="service.id" class="bg-white border-b">
                  <td class="px-6 py-4 font-medium text-gray-900">{{ service.name }}</td>
                  <td class="px-6 py-4">{{ service.category }}</td>
                  <td class="px-6 py-4">
                    <span 
                      class="px-2 py-1 text-xs rounded-full" 
                      :class="getStatusColor(service.active ? 'active' : 'inactive')"
                    >
                      {{ service.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 flex space-x-2">
                    <Button variant="outline" size="sm" @click="openModal('editService')">Edit</Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      :class="service.active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'"
                    >
                      {{ service.active ? 'Deactivate' : 'Activate' }}
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Modals -->
    <Modal v-if="showModal" @close="closeModal" :title="modalType === 'license' ? 'Update License' : modalType === 'hours' ? 'Edit Operating Hours' : modalType === 'service' ? 'Add Service' : 'Edit Service'">
      <div class="p-6">
        <!-- License Modal Content -->
        <div v-if="modalType === 'license'" class="space-y-4">
          <p>Update license information form would go here</p>
          <div class="flex justify-end space-x-2">
            <Button variant="outline" @click="closeModal">Cancel</Button>
            <Button variant="default">Save Changes</Button>
          </div>
        </div>

        <!-- Hours Modal Content -->
        <div v-if="modalType === 'hours'" class="space-y-4">
          <p>Edit operating hours form would go here</p>
          <div class="flex justify-end space-x-2">
            <Button variant="outline" @click="closeModal">Cancel</Button>
            <Button variant="default">Save Changes</Button>
          </div>
        </div>

        <!-- Service Modal Content -->
        <div v-if="modalType === 'service' || modalType === 'editService'" class="space-y-4">
          <p>{{ modalType === 'service' ? 'Add' : 'Edit' }} service form would go here</p>
          <div class="flex justify-end space-x-2">
            <Button variant="outline" @click="closeModal">Cancel</Button>
            <Button variant="default">{{ modalType === 'service' ? 'Add Service' : 'Save Changes' }}</Button>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>