<script setup lang="ts">
import { ref, onMounted, defineProps, watch } from 'vue';
import { Card } from '../../components/ui/Card.vue';
import Button from '../../components/ui/Button.vue';
import Modal from '../../components/ui/Modal.vue';
import ConfirmDialog from '../../components/ui/ConfirmDialog.vue';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { SkeletonTable, Skeleton } from '../../components/ui/Skeleton.vue';
import { 
  AppointmentWithDetails, 
  AppointmentStatus, 
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  APPOINTMENT_PRIORITIES,
  APPOINTMENT_PRIORITY_COLORS
} from '../../types/appointments';

const props = defineProps<{
  doctorId: string;
}>();

const appointments = ref<AppointmentWithDetails[]>([]);
const loading = ref(true);
const selectedAppointment = ref<AppointmentWithDetails | null>(null);
const showStartAppointmentModal = ref(false);
const showCompleteAppointmentModal = ref(false);
const filterStatus = ref<AppointmentStatus | 'all'>('all');
const filterDate = ref<string>('');

watch(() => props.doctorId, () => {
  loadAppointments();
});

onMounted(() => {
  loadAppointments();
});

const loadAppointments = async () => {
  try {
    loading.value = true;
    const filters = {
      doctor_id: props.doctorId,
      ...(filterStatus.value !== 'all' && { status: filterStatus.value }),
      ...(filterDate.value && { appointment_date: filterDate.value })
    };
    
    const appointmentsData = await AppointmentService.getAppointmentsWithDetails(filters);
    appointments.value = appointmentsData;
  } catch (error) {
    console.error('Error loading appointments:', error);
  } finally {
    loading.value = false;
  }
};

const handleStartAppointment = (appointment: AppointmentWithDetails) => {
  selectedAppointment.value = appointment;
  showStartAppointmentModal.value = true;
};

const startAppointment = async () => {
  if (!selectedAppointment.value) return;

  try {
    await AppointmentService.updateAppointment(selectedAppointment.value.id, {
      status: 'in_progress'
    });

    await loadAppointments();
    showStartAppointmentModal.value = false;
    selectedAppointment.value = null;
  } catch (error) {
    console.error('Error starting appointment:', error);
  }
};

const handleCompleteAppointment = (appointment: AppointmentWithDetails) => {
  selectedAppointment.value = appointment;
  showCompleteAppointmentModal.value = true;
};

const completeAppointment = async () => {
  if (!selectedAppointment.value) return;

  try {
    await AppointmentService.updateAppointment(selectedAppointment.value.id, {
      status: 'completed'
    });

    await loadAppointments();
    showCompleteAppointmentModal.value = false;
    selectedAppointment.value = null;
  } catch (error) {
    console.error('Error completing appointment:', error);
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (timeString: string) => {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getStatusBadgeClass = (status: AppointmentStatus) => {
  return APPOINTMENT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
};

const getPriorityBadgeClass = (priority: string) => {
  return APPOINTMENT_PRIORITY_COLORS[priority as keyof typeof APPOINTMENT_PRIORITY_COLORS] || 'bg-gray-100 text-gray-800';
};

const handleFilterChange = () => {
  loadAppointments();
};

const resetFilters = () => {
  filterStatus.value = 'all';
  filterDate.value = '';
  loadAppointments();
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">My Appointments</h2>
        <p class="text-gray-600">Manage and view your scheduled appointments</p>
      </div>
    </div>

    <!-- Filters -->
    <Card class="p-4">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="w-full md:w-1/3">
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            v-model="filterStatus"
            @change="handleFilterChange"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option v-for="status in APPOINTMENT_STATUSES" :key="status" :value="status">
              {{ status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1) }}
            </option>
          </select>
        </div>
        <div class="w-full md:w-1/3">
          <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            v-model="filterDate"
            @change="handleFilterChange"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div class="w-full md:w-1/3 flex items-end">
          <Button @click="resetFilters" variant="outline" class="w-full md:w-auto">
            Reset Filters
          </Button>
        </div>
      </div>
    </Card>

    <!-- Appointments Table -->
    <Card>
      <div class="overflow-x-auto">
        <SkeletonTable v-if="loading" :rows="5" :columns="6" />
        <table v-else class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="appointments.length === 0">
              <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                No appointments found. Adjust filters or check back later.
              </td>
            </tr>
            <tr v-for="appointment in appointments" :key="appointment.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ appointment.patient?.first_name }} {{ appointment.patient?.last_name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ appointment.patient?.email }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatDate(appointment.appointment_date) }}</div>
                <div class="text-sm text-gray-500">{{ formatTime(appointment.start_time) }} - {{ formatTime(appointment.end_time) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ appointment.appointment_type }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getPriorityBadgeClass(appointment.priority)">
                  {{ appointment.priority }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getStatusBadgeClass(appointment.status as AppointmentStatus)">
                  {{ appointment.status.replace('_', ' ').charAt(0).toUpperCase() + appointment.status.replace('_', ' ').slice(1) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                  <Button 
                    v-if="appointment.status === 'scheduled' || appointment.status === 'confirmed'"
                    @click="handleStartAppointment(appointment)"
                    variant="outline"
                    size="sm"
                    class="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Start
                  </Button>
                  <Button 
                    v-if="appointment.status === 'in_progress'"
                    @click="handleCompleteAppointment(appointment)"
                    variant="outline"
                    size="sm"
                    class="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    Complete
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                  >
                    View
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Start Appointment Modal -->
    <ConfirmDialog
      v-if="showStartAppointmentModal"
      @confirm="startAppointment"
      @cancel="showStartAppointmentModal = false"
      title="Start Appointment"
      confirmText="Start"
      cancelText="Cancel"
    >
      <p>Are you ready to start the appointment with {{ selectedAppointment?.patient?.first_name }} {{ selectedAppointment?.patient?.last_name }}?</p>
      <p class="mt-2 text-sm text-gray-500">This will mark the appointment as in progress.</p>
    </ConfirmDialog>

    <!-- Complete Appointment Modal -->
    <ConfirmDialog
      v-if="showCompleteAppointmentModal"
      @confirm="completeAppointment"
      @cancel="showCompleteAppointmentModal = false"
      title="Complete Appointment"
      confirmText="Complete"
      cancelText="Cancel"
    >
      <p>Are you sure you want to mark this appointment as completed?</p>
      <p class="mt-2 text-sm text-gray-500">This will finalize the appointment record.</p>
    </ConfirmDialog>
  </div>
</template>