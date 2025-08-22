<template>
  <div :class="contentClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CardContentProps } from './Card.types';

interface Props extends CardContentProps {}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md'
});

const contentClasses = computed(() => {
  const paddingClasses = {
    none: [],
    sm: ['px-3', 'py-2'],
    md: ['px-6', 'py-4'],
    lg: ['px-8', 'py-6']
  };

  return paddingClasses[props.padding];
});
</script>
