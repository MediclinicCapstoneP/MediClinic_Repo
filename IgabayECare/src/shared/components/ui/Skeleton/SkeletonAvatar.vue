<template>
  <Skeleton
    rounded="full"
    :class="[sizeClass, className]"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Skeleton from './Skeleton.vue';
import type { SkeletonAvatarProps } from './Skeleton.types';

const props = withDefaults(defineProps<SkeletonAvatarProps>(), {
  size: 'md',
  className: ''
});

const sizeClass = computed(() => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  return sizeClasses[props.size];
});
</script>
