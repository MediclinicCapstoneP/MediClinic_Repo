<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row gap-4 justify-between items-start">
      <div>
        <h2 class="text-2xl font-bold">History</h2>
        <p class="text-gray-600">Your past appointments and their status.</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            v-model="filterStatus"
            class="px-3 py-2 border rounded-md focus:outline-none"
          >
            <option value="all">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            From
          </label>
          <input
            type="date"
            v-model="filterFrom"
            class="px-3 py-2 border rounded-md focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            To
          </label>
          <input
            type="date"
            v-model="filterTo"
            class="px-3 py-2 border rounded-md focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Search Clinic
          </label>
          <input
            type="text"
            placeholder="Clinic name..."
            v-model="searchText"
            class="px-3 py-2 border rounded-md focus:outline-none"
          />
        </div>
        <div class="flex items-end">
          <Button @click="loadHistory">Apply</Button>
        </div>
      </div>
    </div>

    <SkeletonTable v-if="loading" :rows="6" :columns="7" />
    <Card v-else class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clinic
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doctor
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="displayHistory.length === 0">
              <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                No history found
              </td>
            </tr>
            <tr v-for="appt in displayHistory" :key="appt.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ appt.clinic?.clinic_name }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ appt.clinic?.city }}, {{ appt.clinic?.state }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">
                  {{ formatDate(appt.appointment_date) }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ formatTime(appt.appointment_time) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm">
                  {{ APPOINTMENT_TYPES[appt.appointment_type] }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="appt.doctor_name">
                  <div class="text-sm font-medium text-gray-900">
                    {{ appt.doctor_name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ appt.doctor_specialty }}
                  </div>
                </div>
                <span v-else class="text-sm text-gray-400">Unassigned</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="`px-2 py-1 rounded-full text-xs font-medium ${APPOINTMENT_STATUS_COLORS[appt.status]}`">
                  {{ APPOINTMENT_STATUSES[appt.status] }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="`px-2 py-1 rounded-full text-xs font-medium ${APPOINTMENT_PRIORITY_COLORS[appt.priority]}`">
                  {{ APPOINTMENT_PRIORITIES[appt.priority] }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';
import { SkeletonTable } from '../../shared/components/ui/Skeleton';
import {
  AppointmentWithDetails,
  AppointmentStatus,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  APPOINTMENT_PRIORITIES,
  APPOINTMENT_PRIORITY_COLORS
} from '../../types/appointments';
import { AppointmentService } from '../../features/auth/utils/appointmentService';

const mockClinic = {
  clinic_name: 'QuickCare Medical Center',
  city: 'City Center',
  state: 'State'
};

const mockHistory: AppointmentWithDetails[] = [
  {
    id: 'mock-1',
    appointment_date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0],
    appointment_time: '10:30:00',
    appointment_type: 'general', // adjust according to your types map
    doctor_id: 'doc-1',
    doctor_name: 'Dr. Sarah Johnson',
    doctor_specialty: 'General Medicine',
    status: 'completed' as AppointmentStatus,
    priority: 'normal',
    clinic: {
      id: '1',
      user_id: '',
      clinic_name: mockClinic.clinic_name,
      email: '',
      phone: '',
      address: '',
      city: mockClinic.city,
      state: mockClinic.state,
      zip_code: '',
      specialties: ['General Medicine'],
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    patient: null as any, // not needed here
    // filler for other fields if your type requires them
  } as any,
  {
    id: 'mock-2',
    appointment_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    appointment_time: '14:00:00',
    appointment_type: 'follow_up',
    doctor_id: 'doc-2',
    doctor_name: 'Dr. Michael Lee',
    doctor_specialty: 'Cardiology',
    status: 'confirmed' as AppointmentStatus,
    priority: 'high',
    clinic: {
      id: '1',
      user_id: '',
      clinic_name: mockClinic.clinic_name,
      email: '',
      phone: '',
      address: '',
      city: mockClinic.city,
      state: mockClinic.state,
      zip_code: '',
      specialties: ['Cardiology'],
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    patient: null as any,
  } as any,
  {
    id: 'mock-3',
    appointment_date: new Date(new Date().setDate(new Date().getDate() - 60)).toISOString().split('T')[0],
    appointment_time: '09:15:00',
    appointment_type: 'specialist',
    doctor_id: 'doc-3',
    doctor_name: 'Dr. Alice Reyes',
    doctor_specialty: 'Dermatology',
    status: 'cancelled' as AppointmentStatus,
    priority: 'low',
    clinic: {
      id: '1',
      user_id: '',
      clinic_name: mockClinic.clinic_name,
      email: '',
      phone: '',
      address: '',
      city: mockClinic.city,
      state: mockClinic.state,
      zip_code: '',
      specialties: ['Dermatology'],
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    patient: null as any,
  } as any,
  {
    id: 'mock-4',
    appointment_date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
    appointment_time: '11:45:00',
    appointment_type: 'general',
    doctor_id: '',
    doctor_name: '',
    doctor_specialty: '',
    status: 'no_show' as AppointmentStatus,
    priority: 'normal',
    clinic: {
      id: '1',
      user_id: '',
      clinic_name: mockClinic.clinic_name,
      email: '',
      phone: '',
      address: '',
      city: mockClinic.city,
      state: mockClinic.state,
      zip_code: '',
      specialties: ['General Medicine'],
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    patient: null as any,
  } as any
];

export default defineComponent({
  name: 'PatientHistory',
  components: {
    Card,
    Button,
    SkeletonTable
  },
  props: {
    patientId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const history = ref<AppointmentWithDetails[]>([]);
    const loading = ref(true);
    const filterStatus = ref<AppointmentStatus | 'all'>('all');
    const filterFrom = ref<string>('');
    const filterTo = ref<string>('');
    const searchText = ref<string>('');

    // Constants
    const APPOINTMENT_STATUSES = {
      scheduled: 'Scheduled',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show'
    };

    const APPOINTMENT_TYPES = {
      general: 'General',
      follow_up: 'Follow-up',
      specialist: 'Specialist',
      consultation: 'Consultation',
      procedure: 'Procedure'
    };

    const APPOINTMENT_STATUS_COLORS = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800'
    };

    const APPOINTMENT_PRIORITY_COLORS = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-green-100 text-green-800'
    };

    const APPOINTMENT_PRIORITIES = {
      high: 'High Priority',
      medium: 'Medium Priority',
      normal: 'Normal Priority',
      low: 'Low Priority'
    };

    const loadHistory = async () => {
      try {
        loading.value = true;
        const filters: any = {
          patient_id: props.patientId
        };
        if (filterStatus.value !== 'all') filters.status = filterStatus.value;
        if (filterFrom.value) filters.appointment_date_from = filterFrom.value;
        if (filterTo.value) filters.appointment_date_to = filterTo.value;

        const data = await AppointmentService.getAppointmentsWithDetails(filters);
        history.value = data || [];
      } catch (err) {
        console.error('Error loading patient history:', err);
        history.value = [];
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      loadHistory();
    });

    // Watch for filter changes
    watch([filterStatus, filterFrom, filterTo], () => {
      // We don't auto-apply filters to avoid too many API calls
      // User needs to click Apply button
    });

    const filtered = computed(() => {
      return history.value.filter((appt) => {
        if (searchText.value) {
          const clinicName = `${appt.clinic?.clinic_name ?? ''}`.toLowerCase();
          if (!clinicName.includes(searchText.value.toLowerCase())) return false;
        }
        return true;
      });
    });

    const displayHistory = computed(() => {
      return !loading.value && filtered.value.length === 0 ? mockHistory : filtered.value;
    });

    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

    const formatTime = (t: string) =>
      new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

    return {
      history,
      loading,
      filterStatus,
      filterFrom,
      filterTo,
      searchText,
      APPOINTMENT_STATUSES,
      APPOINTMENT_TYPES,
      APPOINTMENT_STATUS_COLORS,
      APPOINTMENT_PRIORITY_COLORS,
      APPOINTMENT_PRIORITIES,
      displayHistory,
      formatDate,
      formatTime,
      loadHistory
    };
  }
});
</script>
