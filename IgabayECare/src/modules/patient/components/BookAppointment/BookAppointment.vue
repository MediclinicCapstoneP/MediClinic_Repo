<template>
  <Modal
    :is-open="isOpen"
    @close="handleClose"
    title="Book an Appointment"
    size="lg"
  >
    <div class="space-y-6">
      <!-- Success State -->
      <div v-if="success" class="p-6 text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle :size="32" class="text-green-600" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Appointment Booked!</h3>
        <p class="text-gray-600 mb-6">
          Your appointment has been successfully scheduled. You will receive a confirmation email shortly.
        </p>
        <Button @click="handleClose">Close</Button>
      </div>

      <!-- Booking Form -->
      <div v-else>
        <!-- Error Message -->
        <div
          v-if="error"
          class="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
        >
          <AlertCircle :size="20" class="text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <p class="text-red-700">{{ error }}</p>
        </div>

        <!-- Clinic Information -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-3">Clinic Information</h4>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="font-medium text-gray-900">{{ clinicName }}</p>
          </div>
        </div>

        <!-- Date Selection -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-3">Select Date</h4>
          <div class="flex items-center space-x-4">
            <Calendar :size="20" class="text-gray-400" />
            <input
              type="date"
              :value="formData.selectedDate"
              :min="minDate"
              @input="handleDateChange"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              required
            />
          </div>
        </div>

        <!-- Time Selection -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-3">Select Time</h4>
          <div v-if="loading" class="text-center p-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-gray-600">Loading available time slots...</p>
          </div>
          <div
            v-else-if="availableTimeSlots.length > 0"
            class="grid grid-cols-3 sm:grid-cols-4 gap-3"
          >
            <button
              v-for="time in availableTimeSlots"
              :key="time"
              @click="formData.selectedTime = time"
              :class="[
                'px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                formData.selectedTime === time
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              ]"
            >
              {{ formatTime(time) }}
            </button>
          </div>
          <div v-else class="text-center p-4 bg-gray-50 rounded-lg">
            <p class="text-gray-600">No available time slots for this date. Please select another date.</p>
          </div>
        </div>

        <!-- Appointment Type -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-3">Appointment Type</h4>
          <select
            :value="formData.appointmentType"
            @change="(e) => formData.appointmentType = (e.target as HTMLSelectElement).value as AppointmentType"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option
              v-for="type in appointmentTypes"
              :key="type"
              :value="type"
            >
              {{ formatAppointmentType(type) }}
            </option>
          </select>
        </div>

        <!-- Notes -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-3">Reason for Visit</h4>
          <textarea
            :value="formData.notes"
            @input="(e) => formData.notes = (e.target as HTMLTextAreaElement).value"
            class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            :rows="3"
            placeholder="Please describe your symptoms or reason for visit..."
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" @click="handleClose">
            Cancel
          </Button>
          <Button
            @click="handleBookAppointment"
            :loading="loading"
            :disabled="!formData.selectedDate || !formData.selectedTime || loading"
          >
            Book Appointment
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-vue-next';
import Button from '../../../shared/components/ui/Button/Button.vue';
import Modal from '../../../shared/components/ui/Modal/Modal.vue';
import { AppointmentService } from '../../../shared/services/appointment/AppointmentService';
import { SupabaseService } from '../../../shared/services/api/SupabaseService';
import { AppointmentType } from '../../../../core/types/common.types';
import type {
  BookAppointmentProps,
  BookAppointmentFormData,
  BookAppointmentEmits,
  CreateAppointmentData
} from './BookAppointment.types';

const props = defineProps<BookAppointmentProps>();
const emit = defineEmits<BookAppointmentEmits>();

const supabaseService = new SupabaseService();
const appointmentService = new AppointmentService();

const formData = reactive<BookAppointmentFormData>({
  selectedDate: new Date().toISOString().split('T')[0],
  selectedTime: '',
  appointmentType: AppointmentType.CONSULTATION,
  notes: ''
});

const availableTimeSlots = ref<string[]>([]);
const loading = ref(false);
const success = ref(false);
const error = ref<string | null>(null);
const currentUser = ref<Record<string, any> | null>(null);
const patientId = ref<string>('');

const minDate = computed(() => new Date().toISOString().split('T')[0]);

const appointmentTypes = Object.values(AppointmentType);

const formatAppointmentType = (type: AppointmentType): string => {
  return type.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${period}`;
};

const getCurrentUser = async () => {
  try {
    const user = await supabaseService.getCurrentUser();
    if (user) {
      currentUser.value = user;
      // Get patient ID from patients table
      const patientData = await supabaseService.query('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (patientData) {
        patientId.value = patientData.id;
      } else {
        error.value = 'Unable to retrieve your patient information. Please try again later.';
      }
    }
  } catch (err) {
    console.error('Error fetching user data:', err);
    error.value = 'Unable to retrieve your information. Please try again later.';
  }
};

const fetchTimeSlots = async () => {
  if (!props.clinicId || !formData.selectedDate) return;

  loading.value = true;
  try {
    const slots = await appointmentService.getAvailableTimeSlots(
      props.clinicId,
      formData.selectedDate
    );
    availableTimeSlots.value = slots;
  } catch (err) {
    console.error('Error fetching time slots:', err);
    error.value = 'Unable to fetch available time slots. Please try again later.';
  } finally {
    loading.value = false;
  }
};

const handleDateChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  formData.selectedDate = target.value;
  formData.selectedTime = ''; // Reset selected time when date changes
};

const handleBookAppointment = async () => {
  if (!formData.selectedDate || !formData.selectedTime || !patientId.value || !props.clinicId) {
    error.value = 'Please select a date and time for your appointment.';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const appointmentData: CreateAppointmentData = {
      patient_id: patientId.value,
      clinic_id: props.clinicId,
      appointment_date: formData.selectedDate,
      appointment_time: formData.selectedTime,
      appointment_type: formData.appointmentType,
      patient_notes: formData.notes,
      duration_minutes: 30, // Default duration
    };

    const result = await appointmentService.createAppointment(appointmentData);

    if (result) {
      success.value = true;
      emit('success', result.id);
      setTimeout(() => {
        success.value = false;
        handleClose();
      }, 3000);
    } else {
      error.value = 'Failed to book appointment. Please try again.';
    }
  } catch (err) {
    console.error('Error booking appointment:', err);
    error.value = 'An error occurred while booking your appointment. Please try again.';
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  formData.selectedTime = '';
  formData.appointmentType = AppointmentType.CONSULTATION;
  formData.notes = '';
  error.value = null;
  success.value = false;
  emit('close');
};

// Watch for date changes to fetch time slots
watch(() => formData.selectedDate, fetchTimeSlots);

// Initialize component
onMounted(() => {
  getCurrentUser();
  fetchTimeSlots();
});
</script>
