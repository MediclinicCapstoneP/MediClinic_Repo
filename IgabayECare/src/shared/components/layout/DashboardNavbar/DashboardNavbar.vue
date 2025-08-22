<template>
  <header class="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
    <div class="flex items-center justify-between">
      <!-- Search Section -->
      <div v-if="showSearch" class="flex-1 max-w-lg">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-5 w-5 text-gray-400" />
          </div>
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="searchPlaceholder"
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            @input="handleSearch"
          />
        </div>
      </div>

      <!-- Right Section -->
      <div class="flex items-center space-x-4">
        <!-- Notifications -->
        <button
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative"
          @click="handleNotificationsClick"
        >
          <Bell :size="20" />
          <!-- Notification Badge -->
          <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span>
        </button>

        <!-- User Menu -->
        <div class="relative">
          <button
            @click="showUserMenu = !showUserMenu"
            class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User :size="16" class="text-gray-600" />
            </div>
            <div v-if="user" class="text-left">
              <p class="text-sm font-medium text-gray-900">
                {{ user?.name || user?.firstName || 'User' }}
              </p>
              <p class="text-xs text-gray-500 capitalize">
                {{ variant }}
              </p>
            </div>
            <ChevronDown :size="16" class="text-gray-400" />
          </button>

          <!-- User Dropdown Menu -->
          <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
            >
              <button
                @click="handleProfileClick"
                class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <User :size="16" class="mr-3" />
                Profile
              </button>
              <button
                class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings :size="16" class="mr-3" />
                Settings
              </button>
              <div class="border-t border-gray-200 my-1"></div>
              <button
                @click="handleSignOut"
                class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut :size="16" class="mr-3" />
                Sign Out
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Search, Bell, User, ChevronDown, Settings, LogOut } from 'lucide-vue-next';
import type { NavbarProps, NavbarEmits } from '../layout.types';

interface Props extends NavbarProps {}

const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Search...',
  showSearch: true,
  variant: 'patient'
});

const emit = defineEmits<NavbarEmits>();

// Reactive state
const searchQuery = ref('');
const showUserMenu = ref(false);

// Event handlers
const handleSearch = () => {
  emit('search', searchQuery.value);
};

const handleNotificationsClick = () => {
  emit('notifications-click');
};

const handleProfileClick = () => {
  showUserMenu.value = false;
  emit('profile-click');
};

const handleSignOut = () => {
  showUserMenu.value = false;
  emit('sign-out');
};

// Close user menu when clicking outside
const closeUserMenu = () => {
  showUserMenu.value = false;
};

// Add click outside listener
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  document.addEventListener('click', closeUserMenu);
});

onUnmounted(() => {
  document.removeEventListener('click', closeUserMenu);
});
</script>
