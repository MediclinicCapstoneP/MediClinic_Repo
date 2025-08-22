<template>
  <aside
    :class="sidebarClasses"
    class="bg-white shadow-sm border-r border-gray-200 transition-all duration-300"
  >
    <!-- Sidebar Header -->
    <div class="p-6 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <!-- Logo/Brand -->
        <div v-if="!collapsed" class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">IC</span>
          </div>
          <span class="text-xl font-bold text-gray-900">IgabayECare</span>
        </div>
        <div v-else class="flex justify-center">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">IC</span>
          </div>
        </div>

        <!-- Collapse Toggle -->
        <button
          v-if="collapsible"
          @click="handleToggle"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft v-if="!collapsed" :size="20" />
          <ChevronRight v-else :size="20" />
        </button>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-2">
      <div
        v-for="item in navigationItems"
        :key="item.id"
        @click="handleTabChange(item.id)"
        :class="getNavItemClasses(item.id)"
        class="flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors"
      >
        <component
          v-if="item.icon"
          :is="item.icon"
          class="w-5 h-5 mr-3"
          :class="{ 'mr-0': collapsed }"
        />
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>

        <!-- Tooltip for collapsed state -->
        <div
          v-if="collapsed"
          class="fixed left-16 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
        >
          {{ item.label }}
        </div>
      </div>
    </nav>

    <!-- User Profile Section -->
    <div v-if="user" class="p-4 border-t border-gray-200">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <User :size="16" class="text-gray-600" />
        </div>
        <div v-if="!collapsed" class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ user?.name || user?.firstName || 'User' }}
          </p>
          <p class="text-xs text-gray-500 truncate">
            {{ user?.email || '' }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight, User } from 'lucide-vue-next';
import type { SidebarProps, SidebarEmits } from '../layout.types';

interface Props extends SidebarProps {}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
  collapsible: true,
  variant: 'patient'
});

const emit = defineEmits<SidebarEmits>();

// Computed classes
const sidebarClasses = computed(() => [
  'fixed',
  'left-0',
  'top-0',
  'h-full',
  'flex',
  'flex-col',
  'z-30',
  props.collapsed ? 'w-16' : 'w-64'
]);

// Get navigation item classes based on active state
const getNavItemClasses = (itemId: string) => {
  const isActive = props.activeTab === itemId;

  const baseClasses = [
    'group',
    'relative'
  ];

  if (isActive) {
    return [
      ...baseClasses,
      'bg-primary-100',
      'text-primary-700',
      'border-r-2',
      'border-primary-600'
    ];
  }

  return [
    ...baseClasses,
    'text-gray-600',
    'hover:text-gray-900',
    'hover:bg-gray-100'
  ];
};

// Event handlers
const handleTabChange = (tabId: string) => {
  emit('tab-change', tabId);
};

const handleToggle = () => {
  emit('toggle-collapse', !props.collapsed);
};
</script>
