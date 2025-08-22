<template>
  <div :class="headerClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CardHeaderProps } from './Card.types';

interface Props extends CardHeaderProps {}

const props = withDefaults(defineProps<Props>(), {
  bordered: true
});

const headerClasses = computed(() => {
  const baseClasses = ['px-6', 'py-4'];
  const borderClasses = props.bordered ? ['border-b', 'border-gray-200'] : [];

  return [...baseClasses, ...borderClasses];
});
</script>
