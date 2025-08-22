<template>
  <div class="space-y-6">
    <!-- Header & Filters -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Appointments</h2>
        <div v-if="selectedAppointment" class="mt-1 text-sm text-blue-600">
          Selected:
          <strong>
            {{ selectedAppointment.patient?.first_name }}
            {{ selectedAppointment.patient?.last_name }} on
            {{ formatDate(selectedAppointment.appointment_date) }}
          </strong>
        </div>
      </div>
      <div class="flex gap-4">
        <input
          type="date"
          v-model="filterDate"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          v-model="filterStatus"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="confirmed">Confirmed</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
        <Button @click="loadAppointments" variant="outline">
          Refresh
        </Button>
        <Button
          @click="selectedAppointment && handleAssignDoctor(selectedAppointment)"
          :disabled="!selectedAppointment"
        >
          {{ selectedAppointment?.doctor_id ? 'Reassign Doctor' : 'Assign Doctor' }}
        </Button>
        <Button
          v-if="selectedAppointment && selectedAppointment.status === 'scheduled'"
          @click="() => handleConfirmAppointment(selectedAppointment)"
        >
          Confirm
        </Button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-6">
      <div class="flex justify-between items-center">
        <Skeleton :width="200" :height="32" />
        <div class="flex gap-4">
          <Skeleton :width="120" :height="40" />
          <Skeleton :width="100" :height="40" />
          <Skeleton :width="80" :height="40" />
        </div>
      </div>
      <SkeletonTable :rows="8" :columns="7" />
    </div>

    <!-- Appointments Table -->
    <Card v-else class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="appointments.length === 0">
              <td colspan="7" class="px-6 py-4 text-center text-gray-500">No appointments found</td>
            </tr>
            <tr
              v-for="appointment in appointments"
              :key="appointment.id"
              :class="[ 'hover:bg-gray-50 cursor-pointer', isSelected(appointment) ? 'bg-blue-50' : '' ]"
              @click="setSelectedAppointment(appointment)"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  type="radio"
                  name="selectedAppointment"
                  :checked="isSelected(appointment)"
                  @change="() => setSelectedAppointment(appointment)"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ appointment.patient?.first_name }}
                    {{ appointment.patient?.last_name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ appointment.patient?.email }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ formatDate(appointment.appointment_date) }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ formatTime(appointment.appointment_time) }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-900">
                  {{ APPOINTMENT_TYPES[appointment.appointment_type] }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="appointment.doctor_name">
                  <div class="text-sm font-medium text-gray-900">
                    {{ appointment.doctor_name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ appointment.doctor_specialty }}
                  </div>
                </div>
                <span v-else class="text-sm text-gray-400">Not assigned</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="APPOINTMENT_STATUS_COLORS[appointment.status]">
                  {{ APPOINTMENT_STATUSES[appointment.status] }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="APPOINTMENT_PRIORITY_COLORS[appointment.priority]">
                  {{ APPOINTMENT_PRIORITIES[appointment.priority] }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Confirm Appointment Dialog -->
    <ConfirmDialog
      :isOpen="showConfirmDialog"
      @onClose="() => setShowConfirmDialog(false)"
      @onConfirm="confirmAppointment"
      title="Confirm Appointment"
      :message="`Are you sure you want to confirm the appointment for ${selectedAppointment?.patient?.first_name || ''} ${selectedAppointment?.patient?.last_name || ''} on ${selectedAppointment ? formatDate(selectedAppointment.appointment_date) : ''}?`"
    />

    <!-- Assign Doctor Modal -->
    <Modal
      :isOpen="showAssignDoctorModal"
      @onClose="() => setShowAssignDoctorModal(false)"
      title="Assign Doctor"
      size="md"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
          <select
            v-model="selectedDoctorId"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a doctor...</option>
            <option v-for="doctor in doctors" :key="doctor.id" :value="doctor.id">
              {{ doctor.full_name }} - {{ doctor.specialization }}
            </option>
          </select>
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <Button @click="() => setShowAssignDoctorModal(false)" variant="outline">
            Cancel
          </Button>
          <Button @click="assignDoctor" :disabled="!selectedDoctorId">
            {{ selectedAppointment?.doctor_id ? 'Reassign' : 'Assign' }} Doctor
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { doctorService, DoctorProfile } from '../../features/auth/utils/doctorService';
import { SkeletonTable, Skeleton } from '../../components/ui/Skeleton';
import {
  AppointmentWithDetails,
  AppointmentStatus,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES, 
  APPOINTMENT_PRIORITIES,
  APPOINTMENT_PRIORITY_COLORS
} from '../../types/appointments';

defineProps<{ clinicId: string }>()

const appointments = ref<AppointmentWithDetails[]>([]);
const doctors = ref<DoctorProfile[]>([]);
const loading = ref(true);
const selectedAppointment = ref<AppointmentWithDetails | null>(null);
const showAssignDoctorModal = ref(false);
const showConfirmDialog = ref(false);
const selectedDoctorId = ref('');
const filterStatus = ref<AppointmentStatus | 'all'>('all');
const filterDate = ref('');

async function loadAppointments() {
  try {
    loading.value = true;
    const filters: any = {
      clinic_id: clinicId,
    };
    if (filterStatus.value !== 'all') filters.status = filterStatus.value;
    if (filterDate.value) filters.appointment_date = filterDate.value;
    const appointmentsData = await AppointmentService.getAppointmentsWithDetails(filters);
    appointments.value = appointmentsData;
  } catch (error) {
    console.error('Error loading appointments:', error);
  } finally {
    loading.value = false;
  }
}

async function loadDoctors() {
  try {
    const result = await doctorService.getDoctorsByClinicId(clinicId);
    if (result.success && result.doctors) {
      doctors.value = result.doctors;
    }
  } catch (error) {
    console.error('Error loading doctors:', error);
  }
}

function setSelectedAppointment(appointment: AppointmentWithDetails) {
  selectedAppointment.value = appointment;
}

function handleConfirmAppointment(appointment: AppointmentWithDetails) {
  selectedAppointment.value = appointment;
  showConfirmDialog.value = true;
}

async function confirmAppointment() {
  if (!selectedAppointment.value) return;
  try {
    await AppointmentService.updateAppointment(selectedAppointment.value.id, {
      status: 'confirmed',
      confirmation_sent: true,
      confirmation_sent_at: new Date().toISOString(),
    });
    await loadAppointments();
    showConfirmDialog.value = false;
    selectedAppointment.value = null;
  } catch (error) {
    console.error('Error confirming appointment:', error);
  }
}

function handleAssignDoctor(appointment: AppointmentWithDetails) {
  selectedAppointment.value = appointment;
  selectedDoctorId.value = appointment.doctor_id || '';
  showAssignDoctorModal.value = true;
}

async function assignDoctor() {
  if (!selectedAppointment.value || !selectedDoctorId.value) return;
  try {
    const selectedDoctor = doctors.value.find(d => d.id === selectedDoctorId.value);
    await AppointmentService.updateAppointment(selectedAppointment.value.id, {
      doctor_id: selectedDoctorId.value,
      doctor_name: selectedDoctor?.full_name || '',
      doctor_specialty: selectedDoctor?.specialization || '',
    });
    await loadAppointments();
    showAssignDoctorModal.value = false;
    selectedAppointment.value = null;
    selectedDoctorId.value = '';
  } catch (error) {
    console.error('Error assigning doctor:', error);
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatTime(timeString: string) {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function isSelected(appointment: AppointmentWithDetails) {
  return selectedAppointment.value?.id === appointment.id;
}

watch(() => [filterStatus.value, filterDate.value, clinicId], loadAppointments, { immediate: true });
onMounted(loadDoctors);

// Expose enums/constants for template
const APPOINTMENT_STATUS_COLORS = APPOINTMENT_STATUS_COLORS;
const APPOINTMENT_STATUSES = APPOINTMENT_STATUSES;
const APPOINTMENT_TYPES = APPOINTMENT_TYPES;
const APPOINTMENT_PRIORITIES = APPOINTMENT_PRIORITIES;
const APPOINTMENT_PRIORITY_COLORS = APPOINTMENT_PRIORITY_COLORS;
</script>
