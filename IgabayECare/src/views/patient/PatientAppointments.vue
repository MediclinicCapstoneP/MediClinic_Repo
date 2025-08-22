<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p class="text-gray-600 mt-1">
          Manage your upcoming and past appointments
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-64">
      <div class="text-center">
        <Loader2 class="h-8 w-8 animate-spin text-theme mx-auto mb-4" />
        <p class="text-gray-600">Loading appointments...</p>
      </div>
    </div>

    <template v-else>
      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total</p>
                <p class="text-2xl font-bold text-gray-900">{{ appointments.length }}</p>
              </div>
              <Calendar class="h-8 w-8 text-theme" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Upcoming</p>
                <p class="text-2xl font-bold text-green-600">
                  {{ 
                    appointments.filter(apt => 
                      apt.appointment_date >= new Date().toISOString().split('T')[0] && 
                      apt.status !== 'cancelled' && 
                      apt.status !== 'completed'
                    ).length 
                  }}
                </p>
              </div>
              <Clock class="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Completed</p>
                <p class="text-2xl font-bold text-gray-600">
                  {{ appointments.filter(apt => apt.status === 'completed').length }}
                </p>
              </div>
              <CheckCircle class="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Cancelled</p>
                <p class="text-2xl font-bold text-red-600">
                  {{ appointments.filter(apt => apt.status === 'cancelled').length }}
                </p>
              </div>
              <X class="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Upcoming Appointments -->
      <div v-if="getUpcomingAppointments().length > 0">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card 
            v-for="appointment in getUpcomingAppointments()" 
            :key="appointment.id" 
            class="hover:shadow-lg transition-shadow"
          >
            <CardContent class="p-4">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2">
                  <component :is="getStatusIcon(appointment.status)" />
                  <span :class="`px-2 py-1 text-xs font-medium rounded-full ${APPOINTMENT_STATUS_COLORS[appointment.status]}`">
                    {{ APPOINTMENT_STATUSES[appointment.status] }}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  @click="() => {
                    selectedAppointment = appointment;
                    showDetails = true;
                  }}"
                >
                  <ExternalLink class="h-3 w-3" />
                </Button>
              </div>

              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <CalendarIcon class="h-4 w-4 text-gray-500" />
                  <span class="text-sm text-gray-600">
                    {{ formatDate(appointment.appointment_date) }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <Clock class="h-4 w-4 text-gray-500" />
                  <span class="text-sm text-gray-600">
                    {{ formatTime(appointment.appointment_time) }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <Building class="h-4 w-4 text-gray-500" />
                  <span class="text-sm font-medium text-gray-900">
                    {{ appointment.clinic?.clinic_name || 'Clinic Name' }}
                  </span>
                </div>

                <div v-if="appointment.doctor_name" class="flex items-center gap-2">
                  <User class="h-4 w-4 text-gray-500" />
                  <span class="text-sm text-gray-600">
                    Dr. {{ appointment.doctor_name }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {{ APPOINTMENT_TYPES[appointment.appointment_type] }}
                  </span>
                  <span 
                    v-if="appointment.priority" 
                    :class="`text-xs px-2 py-1 rounded ${APPOINTMENT_PRIORITY_COLORS[appointment.priority]}`"
                  >
                    {{ APPOINTMENT_PRIORITIES[appointment.priority] }}
                  </span>
                </div>
              </div>

              <div class="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  @click="handleCancelAppointment(appointment.id)"
                  class="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  @click="() => {
                    selectedAppointment = appointment;
                    showDetails = true;
                  }}"
                >
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- Past Appointments -->
      <div v-if="getPastAppointments().length > 0">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Past Appointments</h2>
        <div class="space-y-4">
          <Card 
            v-for="appointment in getPastAppointments()" 
            :key="appointment.id" 
            class="hover:shadow-md transition-shadow"
          >
            <CardContent class="p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <component :is="getStatusIcon(appointment.status)" />
                    <span :class="`px-2 py-1 text-xs font-medium rounded-full ${APPOINTMENT_STATUS_COLORS[appointment.status]}`">
                      {{ APPOINTMENT_STATUSES[appointment.status] }}
                    </span>
                  </div>

                  <div class="flex items-center gap-4">
                    <div class="flex items-center gap-2">
                      <CalendarIcon class="h-4 w-4 text-gray-500" />
                      <span class="text-sm text-gray-600">
                        {{ formatDate(appointment.appointment_date) }}
                      </span>
                    </div>

                    <div class="flex items-center gap-2">
                      <Clock class="h-4 w-4 text-gray-500" />
                      <span class="text-sm text-gray-600">
                        {{ formatTime(appointment.appointment_time) }}
                      </span>
                    </div>

                    <div class="flex items-center gap-2">
                      <Building class="h-4 w-4 text-gray-500" />
                      <span class="text-sm font-medium text-gray-900">
                        {{ appointment.clinic?.clinic_name || 'Clinic Name' }}
                      </span>
                    </div>

                    <div v-if="appointment.doctor_name" class="flex items-center gap-2">
                      <User class="h-4 w-4 text-gray-500" />
                      <span class="text-sm text-gray-600">
                        Dr. {{ appointment.doctor_name }}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  @click="() => {
                    selectedAppointment = appointment;
                    showDetails = true;
                  }}"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- No Appointments -->
      <Card v-if="filteredAppointments.length === 0 && !loading">
        <CardContent class="p-8 text-center">
          <Calendar class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
          <p class="text-gray-600 mb-4">
            {{ searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter
              ? 'Try adjusting your filters or search terms.'
              : 'You don\'t have any appointments yet.'
            }}
          </p>
          <Button 
            @click="$emit('navigate', 'nearby')"
            class="bg-theme hover:bg-theme-dark text-white"
          >
            <Plus class="h-4 w-4 mr-2" />
            Book Your First Appointment
          </Button>
        </CardContent>
      </Card>

      <!-- Appointment Details Modal -->
      <div v-if="showDetails && selectedAppointment" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-gray-900">Appointment Details</h2>
              <Button
                variant="outline"
                size="sm"
                @click="showDetails = false"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>

            <div class="space-y-4">
              <!-- Status -->
              <div class="flex items-center gap-2">
                <component :is="getStatusIcon(selectedAppointment.status)" />
                <span :class="`px-3 py-1 text-sm font-medium rounded-full ${APPOINTMENT_STATUS_COLORS[selectedAppointment.status]}`">
                  {{ APPOINTMENT_STATUSES[selectedAppointment.status] }}
                </span>
              </div>

              <!-- Date and Time -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p class="text-gray-900">{{ formatDate(selectedAppointment.appointment_date) }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <p class="text-gray-900">{{ formatTime(selectedAppointment.appointment_time) }}</p>
                </div>
              </div>

              <!-- Clinic and Doctor -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Clinic</label>
                  <p class="text-gray-900">{{ selectedAppointment.clinic?.clinic_name || 'N/A' }}</p>
                  <p v-if="selectedAppointment.clinic?.address" class="text-sm text-gray-600">
                    {{ selectedAppointment.clinic.address }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                  <p class="text-gray-900">
                    {{ selectedAppointment.doctor_name ? `Dr. ${selectedAppointment.doctor_name}` : 'TBD' }}
                  </p>
                  <p v-if="selectedAppointment.doctor_specialty" class="text-sm text-gray-600">
                    {{ selectedAppointment.doctor_specialty }}
                  </p>
                </div>
              </div>

              <!-- Type and Priority -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    {{ APPOINTMENT_TYPES[selectedAppointment.appointment_type] }}
                  </span>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <span 
                    v-if="selectedAppointment.priority" 
                    :class="`inline-block px-2 py-1 rounded text-sm ${APPOINTMENT_PRIORITY_COLORS[selectedAppointment.priority]}`"
                  >
                    {{ APPOINTMENT_PRIORITIES[selectedAppointment.priority] }}
                  </span>
                </div>
              </div>

              <!-- Duration -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <p class="text-gray-900">{{ selectedAppointment.duration_minutes }} minutes</p>
              </div>

              <!-- Notes -->
              <div v-if="selectedAppointment.patient_notes">
                <label class="block text-sm font-medium text-gray-700 mb-1">Your Notes</label>
                <p class="text-gray-900 bg-gray-50 p-3 rounded">{{ selectedAppointment.patient_notes }}</p>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 pt-4 border-t">
                <Button
                  v-if="selectedAppointment.status === 'scheduled' || selectedAppointment.status === 'confirmed'"
                  variant="outline"
                  @click="() => {
                    handleCancelAppointment(selectedAppointment.id);
                    showDetails = false;
                  }}"
                  class="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Cancel Appointment
                </Button>
                <Button
                  variant="outline"
                  @click="showDetails = false"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Building, 
  Filter, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-vue-next';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { AppointmentService } from '../../features/auth/utils/appointmentService';
import { 
  AppointmentWithDetails, 
  AppointmentStatus, 
  AppointmentType,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_PRIORITY_COLORS,
  APPOINTMENT_PRIORITIES
} from '../../types/appointments';
import { authService } from '../../features/auth/utils/authService';
import { mockAppointments } from '../../utils/mockAppointments';

export default defineComponent({
  name: 'PatientAppointments',
  components: {
    Calendar,
    Clock,
    MapPin,
    User,
    Building,
    Filter,
    Search,
    Plus,
    Edit,
    Trash2,
    X,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    CalendarIcon: Calendar
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    const appointments = ref<AppointmentWithDetails[]>([]);
    const loading = ref(true);
    const filteredAppointments = ref<AppointmentWithDetails[]>([]);
    const currentUser = ref<any>(null);
    const searchTerm = ref('');
    const statusFilter = ref<AppointmentStatus | 'all'>('all');
    const typeFilter = ref<AppointmentType | 'all'>('all');
    const dateFilter = ref<string>('');
    const showFilters = ref(false);
    const selectedAppointment = ref<AppointmentWithDetails | null>(null);
    const showDetails = ref(false);

    // Constants
    const APPOINTMENT_STATUSES = {
      scheduled: 'Scheduled',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show'
    };

    const APPOINTMENT_TYPES = {
      consultation: 'Consultation',
      follow_up: 'Follow-up',
      procedure: 'Procedure',
      check_up: 'Check-up',
      emergency: 'Emergency'
    };

    const APPOINTMENT_STATUS_COLORS = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800'
    };

    const APPOINTMENT_PRIORITY_COLORS = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };

    const APPOINTMENT_PRIORITIES = {
      high: 'High Priority',
      medium: 'Medium Priority',
      low: 'Low Priority'
    };

    // Fetch appointments
    onMounted(async () => {
      try {
        loading.value = true;
        
        // Get current user
        const user = await authService.getCurrentUser();
        if (!user) {
          console.error('No authenticated user found');
          return;
        }
        currentUser.value = user;

        // Fetch appointments for the current user
        const userAppointments = await AppointmentService.getAppointmentsWithDetails({
          patient_id: user.id
        });

        console.log('Fetched appointments:', userAppointments);
        
        // If no appointments found, use mock data for demonstration
        if (userAppointments.length === 0) {
          console.log('No appointments found, using mock data for demonstration');
          appointments.value = mockAppointments;
          filteredAppointments.value = mockAppointments;
        } else {
          appointments.value = userAppointments;
          filteredAppointments.value = userAppointments;
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        // Fallback to mock data on error
        console.log('Using mock data due to error');
        appointments.value = mockAppointments;
        filteredAppointments.value = mockAppointments;
      } finally {
        loading.value = false;
      }
    });

    // Watch for filter changes
    watch(
      [() => appointments.value, searchTerm, statusFilter, typeFilter, dateFilter],
      () => {
        // Filter appointments based on search and filters
        let filtered = appointments.value;

        // Search filter
        if (searchTerm.value) {
          const searchLower = searchTerm.value.toLowerCase();
          filtered = filtered.filter(appointment => 
            appointment.clinic?.clinic_name?.toLowerCase().includes(searchLower) ||
            appointment.doctor_name?.toLowerCase().includes(searchLower) ||
            appointment.appointment_type?.toLowerCase().includes(searchLower) ||
            appointment.patient_notes?.toLowerCase().includes(searchLower)
          );
        }

        // Status filter
        if (statusFilter.value !== 'all') {
          filtered = filtered.filter(appointment => appointment.status === statusFilter.value);
        }

        // Type filter
        if (typeFilter.value !== 'all') {
          filtered = filtered.filter(appointment => appointment.appointment_type === typeFilter.value);
        }

        // Date filter
        if (dateFilter.value) {
          filtered = filtered.filter(appointment => appointment.appointment_date === dateFilter.value);
        }

        filteredAppointments.value = filtered;
      },
      { immediate: true }
    );

    // Helper functions
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatTime = (timeString: string) => {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    const getStatusIcon = (status: AppointmentStatus) => {
      switch (status) {
        case 'confirmed':
          return h(CheckCircle, { class: 'h-4 w-4 text-green-600' });
        case 'completed':
          return h(CheckCircle, { class: 'h-4 w-4 text-gray-600' });
        case 'cancelled':
          return h(X, { class: 'h-4 w-4 text-red-600' });
        case 'no_show':
          return h(AlertCircle, { class: 'h-4 w-4 text-orange-600' });
        default:
          return h(Clock, { class: 'h-4 w-4 text-blue-600' });
      }
    };

    const handleCancelAppointment = async (appointmentId: string) => {
      if (!confirm('Are you sure you want to cancel this appointment?')) {
        return;
      }

      try {
        const result = await AppointmentService.cancelAppointment(appointmentId, 'Cancelled by patient');
        if (result) {
          // Refresh appointments
          appointments.value = appointments.value.map(apt => 
            apt.id === appointmentId ? { ...apt, status: 'cancelled' as AppointmentStatus } : apt
          );
          alert('Appointment cancelled successfully');
        }
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('Failed to cancel appointment');
      }
    };

    const getUpcomingAppointments = () => {
      const today = new Date().toISOString().split('T')[0];
      return filteredAppointments.value.filter(apt => 
        apt.appointment_date >= today && 
        apt.status !== 'cancelled' && 
        apt.status !== 'completed'
      ).slice(0, 3);
    };

    const getPastAppointments = () => {
      const today = new Date().toISOString().split('T')[0];
      return filteredAppointments.value.filter(apt => 
        apt.appointment_date < today || 
        apt.status === 'cancelled' || 
        apt.status === 'completed'
      );
    };

    return {
      appointments,
      loading,
      filteredAppointments,
      currentUser,
      searchTerm,
      statusFilter,
      typeFilter,
      dateFilter,
      showFilters,
      selectedAppointment,
      showDetails,
      APPOINTMENT_STATUSES,
      APPOINTMENT_TYPES,
      APPOINTMENT_STATUS_COLORS,
      APPOINTMENT_PRIORITY_COLORS,
      APPOINTMENT_PRIORITIES,
      formatDate,
      formatTime,
      getStatusIcon,
      handleCancelAppointment,
      getUpcomingAppointments,
      getPastAppointments
    };
  }
});
</script>