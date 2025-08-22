<template>
  <div :class="cardClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CardProps } from './Card.types';

interface Props extends CardProps {}

const props = withDefaults(defineProps<Props>(), {
  hover: false,
  shadow: 'sm',
  border: true,
  padding: 'md'
});

const cardClasses = computed(() => {
  const baseClasses = ['bg-white', 'rounded-xl'];

  // Shadow classes
  const shadowClasses = {
    none: [],
    sm: ['shadow-sm'],
    md: ['shadow-md'],
    lg: ['shadow-lg'],
    xl: ['shadow-xl']
  };

  // Border classes
  const borderClasses = props.border ? ['border', 'border-gray-200'] : [];

  // Hover classes
  const hoverClasses = props.hover
    ? ['hover:shadow-md', 'hover:border-theme-light', 'transition-all', 'duration-200']
    : [];

  // Padding classes (applied to the card itself if no slots)
  const paddingClasses = {
    none: [],
    sm: ['p-3'],
    md: ['p-6'],
    lg: ['p-8']
  };

  return [
    ...baseClasses,
    ...shadowClasses[props.shadow],
    ...borderClasses,
    ...hoverClasses
  ];
});
</script>
