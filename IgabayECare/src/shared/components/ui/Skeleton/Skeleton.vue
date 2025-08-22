<template>
  <div
    :class="[
      'bg-gray-200 animate-pulse',
      getRoundedClass(),
      className
    ]"
    :style="computedStyle"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SkeletonProps } from './Skeleton.types';

const props = withDefaults(defineProps<SkeletonProps>(), {
  className: '',
  rounded: 'md'
});

const getRoundedClass = (): string => {
  switch (props.rounded) {
    case 'none': return '';
    case 'sm': return 'rounded-sm';
    case 'md': return 'rounded-md';
    case 'lg': return 'rounded-lg';
    case 'full': return 'rounded-full';
    default: return 'rounded-md';
  }
};

const computedStyle = computed(() => {
  const style: Record<string, string> = {};
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  return style;
});
</script>
