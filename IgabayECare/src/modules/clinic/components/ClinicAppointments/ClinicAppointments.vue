<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
      <p class="text-gray-600">Manage your clinic's appointment schedule</p>
    </div>

    <!-- Date Selection -->
    <div class="mb-6">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <Calendar :size="20" class="text-gray-400" />
              <input
                type="date"
                :value="selectedDate"
                @input="(e) => selectedDate = (e.target as HTMLInputElement).value"
                class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="text-sm text-gray-600">
              {{ appointments.length }} appointments scheduled
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Appointments List -->
    <div class="space-y-4">
      <Card v-for="appointment in appointments" :key="appointment.id" hover>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="text-center">
                <div class="text-lg font-bold text-gray-900">{{ appointment.time }}</div>
                <div class="text-xs text-gray-500">{{ appointment.duration }} min</div>
              </div>

              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-lg font-semibold text-gray-900">
                    {{ appointment.patient.name }}
                  </h3>
                  <span :class="getStatusColorClass(appointment.status)">
                    {{ appointment.status }}
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div class="flex items-center space-x-2">
                    <User :size="16" />
                    <span>Age: {{ appointment.patient.age }} • {{ appointment.doctor }}</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <Phone :size="16" />
                    <span>{{ appointment.patient.phone }}</span>
                  </div>
                </div>

                <div class="mt-2">
                  <p class="text-sm text-gray-700">
                    <strong>Reason:</strong> {{ appointment.patient.reason }}
                  </p>
                  <p class="text-sm text-gray-700">
                    <strong>Type:</strong> {{ appointment.type }} • <strong>Fee:</strong> ${{ appointment.fee }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                @click="handleViewDetails(appointment)"
              >
                View Details
              </Button>

              <Button
                variant="outline"
                size="sm"
                @click="handleAssignDoctor(appointment)"
              >
                <UserPlus :size="16" class="mr-1" />
                {{ appointment.doctor ? 'Change Doctor' : 'Assign Doctor' }}
              </Button>

              <Button
                v-if="appointment.status === 'waiting' || appointment.status === 'in-progress'"
                size="sm"
                @click="handleMarkComplete(appointment.id)"
              >
                <CheckCircle :size="16" class="mr-1" />
                Complete
              </Button>

              <Button
                v-if="appointment.status === 'confirmed' || appointment.status === 'waiting'"
                variant="danger"
                size="sm"
                @click="handleCancelAppointment(appointment.id)"
              >
                <XCircle :size="16" class="mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Appointment Details Modal -->
    <Modal
      :is-open="showDetailsModal"
      @close="showDetailsModal = false"
      title="Appointment Details"
      size="lg"
    >
      <div v-if="selectedAppointment" class="space-y-6">
        <!-- Patient Information -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-3">Patient Information</h4>
          <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p class="text-sm text-gray-600">Name</p>
              <p class="font-medium">{{ selectedAppointment.patient.name }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Age</p>
              <p class="font-medium">{{ selectedAppointment.patient.age }} years</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Phone</p>
              <p class="font-medium">{{ selectedAppointment.patient.phone }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Email</p>
              <p class="font-medium">{{ selectedAppointment.patient.email }}</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" @click="showDetailsModal = false">
            Close
          </Button>
          <Button @click="saveNotes">
            Save Notes
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Calendar, User, Phone, CheckCircle, XCircle, UserPlus } from 'lucide-vue-next';
import Button from '../../../shared/components/ui/Button/Button.vue';
import Card from '../../../shared/components/ui/Card/Card.vue';
import CardContent from '../../../shared/components/ui/Card/CardContent.vue';
import Modal from '../../../shared/components/ui/Modal/Modal.vue';
import type { ClinicAppointmentsEmits, Appointment } from './ClinicAppointments.types';

const emit = defineEmits<ClinicAppointmentsEmits>();

const selectedDate = ref(new Date().toISOString().split('T')[0]);
const showDetailsModal = ref(false);
const showAssignDoctorModal = ref(false);
const selectedAppointment = ref<Appointment | null>(null);

const appointments = ref<Appointment[]>([
  {
    id: 1,
    time: '09:00',
    patient: {
      name: 'John Smith',
      phone: '+1 234-567-8900',
      email: 'john.smith@email.com',
      age: 35,
      reason: 'Annual checkup'
    },
    doctor: 'Dr. Sarah Johnson',
    type: 'Consultation',
    status: 'confirmed',
    duration: 30,
    fee: 150,
    notes: 'Patient reports feeling healthy, wants routine checkup'
  },
  {
    id: 2,
    time: '09:30',
    patient: {
      name: 'Emily Davis',
      phone: '+1 234-567-8901',
      email: 'emily.davis@email.com',
      age: 28,
      reason: 'Follow-up consultation'
    },
    doctor: 'Dr. Sarah Johnson',
    type: 'Follow-up',
    status: 'in-progress',
    duration: 20,
    fee: 100,
    notes: 'Following up on previous visit results'
  }
]);

const handleViewDetails = (appointment: Appointment) => {
  selectedAppointment.value = appointment;
  showDetailsModal.value = true;
};

const handleMarkComplete = (appointmentId: number) => {
  console.log('Marking appointment as complete:', appointmentId);
  emit('appointmentUpdated', appointmentId);
};

const handleCancelAppointment = (appointmentId: number) => {
  console.log('Cancelling appointment:', appointmentId);
  emit('appointmentUpdated', appointmentId);
};

const handleAssignDoctor = (appointment: Appointment) => {
  selectedAppointment.value = appointment;
  showAssignDoctorModal.value = true;
};

const getStatusColorClass = (status: string): string => {
  const baseClasses = 'px-3 py-1 text-sm font-medium rounded-full';
  switch (status) {
    case 'confirmed':
      return `${baseClasses} bg-blue-100 text-blue-800`;
    case 'in-progress':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'waiting':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'completed':
      return `${baseClasses} bg-gray-100 text-gray-800`;
    case 'cancelled':
      return `${baseClasses} bg-red-100 text-red-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

const saveNotes = () => {
  console.log('Saving notes for appointment:', selectedAppointment.value?.id);
  showDetailsModal.value = false;
};
</script>
