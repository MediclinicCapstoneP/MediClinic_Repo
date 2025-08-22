<template>
  <div :class="footerClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CardFooterProps } from './Card.types';

interface Props extends CardFooterProps {}

const props = withDefaults(defineProps<Props>(), {
  bordered: true
});

const footerClasses = computed(() => {
  const baseClasses = ['px-6', 'py-4'];
  const borderClasses = props.bordered ? ['border-t', 'border-gray-200'] : [];

  return [...baseClasses, ...borderClasses];
});
</script>
