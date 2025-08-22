<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <div v-if="showSidebar">
      <slot name="sidebar">
        <DashboardSidebar
          :navigation-items="navigationItems"
          :active-tab="activeTab"
          :user="user"
          :variant="variant"
          :collapsed="sidebarCollapsed"
          :collapsible="sidebarCollapsible"
          @tab-change="handleTabChange"
          @toggle-collapse="handleSidebarToggle"
        />
      </slot>
    </div>

    <!-- Main Content -->
    <div
      class="flex-1 flex flex-col overflow-hidden transition-all duration-300"
      :class="{ 'ml-16': sidebarCollapsed && showSidebar }"
    >
      <!-- Header/Navbar -->
      <div v-if="showNavbar">
        <slot name="header">
          <DashboardNavbar
            :user="user"
            :active-tab="activeTab"
            :search-placeholder="searchPlaceholder"
            :variant="variant"
            :show-search="true"
            @search="handleSearch"
            @sign-out="handleSignOut"
          />
        </slot>
      </div>

      <!-- Page Content -->
      <main :class="mainContentClasses">
        <div :class="containerClasses">
          <slot />
        </div>
      </main>

      <!-- Footer -->
      <div v-if="$slots.footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { DashboardLayoutProps, DashboardLayoutEmits } from './layout.types';
import DashboardSidebar from './DashboardSidebar.vue';
import DashboardNavbar from './DashboardNavbar.vue';

interface Props extends DashboardLayoutProps {}

const props = withDefaults(defineProps<Props>(), {
  variant: 'patient',
  searchPlaceholder: 'Search...',
  showNavbar: true,
  showSidebar: true,
  sidebarCollapsible: true,
  maxWidth: 'full'
});

const emit = defineEmits<DashboardLayoutEmits>();

// Reactive state
const sidebarCollapsed = ref(false);

// Computed classes
const mainContentClasses = computed(() => [
  'flex-1',
  'overflow-y-auto',
  'bg-gray-50',
  'p-4',
  'lg:p-6'
]);

const containerClasses = computed(() => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'w-full'
  };

  return [
    maxWidthClasses[props.maxWidth],
    'mx-auto'
  ];
});

// Event handlers
const handleTabChange = (tabId: string) => {
  emit('tab-change', tabId);
};

const handleSignOut = () => {
  emit('sign-out');
};

const handleSearch = (query: string) => {
  emit('search', query);
};

const handleSidebarToggle = (collapsed: boolean) => {
  sidebarCollapsed.value = collapsed;
  emit('sidebar-toggle', collapsed);
};
</script>
