<template>
  <div :class="['space-y-2', className]">
    <Skeleton
      v-for="(_, index) in lines"
      :key="index"
      :height="index === lines - 1 ? 16 : 20"
      :class="index === lines - 1 ? 'w-3/4' : 'w-full'"
    />
  </div>
</template>

<script setup lang="ts">
import Skeleton from './Skeleton.vue';
import type { SkeletonTextProps } from './Skeleton.types';

withDefaults(defineProps<SkeletonTextProps>(), {
  lines: 1,
  className: ''
});
</script>
