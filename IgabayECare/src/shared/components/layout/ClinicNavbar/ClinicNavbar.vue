<template>
  <div>
    <!-- Main Header -->
    <header class="bg-blue-100 shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4 sticky top-0 z-30">
      <div class="flex items-center justify-between">
        <!-- Left side - Logo and title -->
        <div class="flex items-center space-x-4">
          <div class="hidden md:block">
            <h2 class="text-xl font-semibold text-gray-900">
              {{ pageTitle }}
            </h2>
            <p class="text-sm text-gray-500">Clinic Management Portal</p>
          </div>
        </div>

        <!-- Center - Search Bar -->
        <div class="flex-1 max-w-md mx-4 hidden md:block">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" :size="20" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="searchPlaceholder || 'Search patients, appointments, doctors...'"
              @input="handleSearch"
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <!-- Right side - Actions and user -->
        <div class="flex items-center space-x-2 lg:space-x-4">
          <!-- Mobile Search Button -->
          <button
            class="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Search"
          >
            <Search class="h-5 w-5" />
          </button>

          <!-- Notifications -->
          <button
            @click="showNotifications = true"
            class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell class="h-5 w-5" />
            <span
              v-if="unreadCount > 0"
              class="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </button>

          <!-- Profile -->
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <Building class="h-4 w-4" />
            </div>
            <span class="text-sm font-medium text-gray-700 hidden sm:block">
              {{ clinicName }}
            </span>
          </div>

          <!-- Logout Button -->
          <Button
            variant="outline"
            size="sm"
            @click="showLogoutConfirm = true"
            class="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            title="Sign Out"
          >
            <LogOut class="h-4 w-4" />
            <span class="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>

    <!-- Notifications Modal -->
    <Modal
      v-model="showNotifications"
      title="Notifications"
      size="lg"
    >
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Notifications</h3>
          <Button
            v-if="unreadCount > 0"
            variant="outline"
            size="sm"
            @click="markAllAsRead"
            class="text-green-600 hover:text-green-700"
          >
            Mark all as read
          </Button>
        </div>

        <div class="max-h-96 overflow-y-auto space-y-3">
          <div
            v-if="notifications.length === 0"
            class="text-center py-8 text-gray-500"
          >
            <Bell class="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No notifications</p>
          </div>

          <div
            v-else
            v-for="notification in notifications"
            :key="notification.id"
            @click="handleNotificationClick(notification.id)"
            :class="[
              'p-4 border rounded-lg cursor-pointer transition-colors',
              notification.read
                ? 'bg-gray-50 border-gray-200'
                : 'bg-green-50 border-green-200'
            ]"
          >
            <div class="flex items-start space-x-3">
              <component :is="getNotificationIcon(notification.type)" />
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium text-gray-900">
                    {{ notification.title }}
                  </h4>
                  <span class="text-xs text-gray-500">
                    {{ formatTimestamp(notification.timestamp) }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  {{ notification.message }}
                </p>
                <div
                  v-if="!notification.read"
                  class="w-2 h-2 bg-green-500 rounded-full mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Logout Confirmation Dialog -->
    <ConfirmDialog
      v-model="showLogoutConfirm"
      title="Sign Out"
      message="Are you sure you want to sign out?"
      confirm-text="Sign Out"
      cancel-text="Cancel"
      @confirm="handleSignOut"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import {
  Bell,
  Building,
  Search,
  LogOut,
  Calendar,
  Users,
  FileText,
  AlertCircle
} from 'lucide-vue-next';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import type { ClinicNavbarProps, ClinicNavbarEmits, Notification } from './ClinicNavbar.types';

interface Props extends ClinicNavbarProps {}

const props = withDefaults(defineProps<Props>(), {
  activeTab: 'dashboard',
  searchPlaceholder: 'Search patients, appointments, doctors...'
});

const emit = defineEmits<ClinicNavbarEmits>();

// Reactive state
const searchQuery = ref('');
const showNotifications = ref(false);
const showLogoutConfirm = ref(false);

const notifications = ref<Notification[]>([
  {
    id: '1',
    title: 'New Appointment Request',
    message: 'John Doe has requested an appointment for tomorrow at 2:00 PM',
    type: 'appointment',
    timestamp: new Date().toISOString(),
    read: false
  },
  {
    id: '2',
    title: 'Patient Registration',
    message: 'Sarah Wilson has registered as a new patient',
    type: 'patient',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false
  },
  {
    id: '3',
    title: 'System Update',
    message: 'New features have been added to the clinic management system',
    type: 'system',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: true
  },
  {
    id: '4',
    title: 'Appointment Confirmed',
    message: 'Dr. Johnson has confirmed the appointment with Mike Chen',
    type: 'appointment',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: true
  }
]);

// Computed properties
const unreadCount = computed(() =>
  notifications.value.filter(n => !n.read).length
);

const pageTitle = computed(() => {
  switch (props.activeTab) {
    case 'dashboard':
      return 'Dashboard';
    case 'appointments':
      return 'Appointments';
    case 'doctors':
      return 'Doctors';
    case 'patients':
      return 'Patients';
    case 'manage':
      return 'Manage Clinic';
    case 'settings':
      return 'Settings';
    default:
      return 'Clinic Portal';
  }
});

const clinicName = computed(() =>
  props.user?.clinic_name ||
  props.user?.user_metadata?.clinic_name ||
  'Clinic'
);

// Event handlers
const handleSearch = () => {
  emit('search', searchQuery.value);
};

const handleNotificationClick = (notificationId: string) => {
  const notificationIndex = notifications.value.findIndex(n => n.id === notificationId);
  if (notificationIndex !== -1) {
    notifications.value[notificationIndex].read = true;
  }
  emit('notification-click', notificationId);
};

const markAllAsRead = () => {
  notifications.value = notifications.value.map(n => ({ ...n, read: true }));
};

const handleSignOut = () => {
  showLogoutConfirm.value = false;
  emit('sign-out');
};

// Utility functions
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'appointment':
      return h(Calendar, { class: 'h-4 w-4 text-blue-500' });
    case 'patient':
      return h(Users, { class: 'h-4 w-4 text-green-500' });
    case 'system':
      return h(FileText, { class: 'h-4 w-4 text-purple-500' });
    case 'alert':
      return h(AlertCircle, { class: 'h-4 w-4 text-red-500' });
    default:
      return h(Bell, { class: 'h-4 w-4 text-gray-500' });
  }
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
  return date.toLocaleDateString();
};
</script>
