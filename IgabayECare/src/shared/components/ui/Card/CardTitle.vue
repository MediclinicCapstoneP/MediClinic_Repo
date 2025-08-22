<template>
  <component :is="titleTag" :class="titleClasses">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CardTitleProps } from './Card.types';

interface Props extends CardTitleProps {}

const props = withDefaults(defineProps<Props>(), {
  level: 3
});

const titleTag = computed(() => `h${props.level}`);

const titleClasses = computed(() => {
  const sizeClasses = {
    1: ['text-2xl'],
    2: ['text-xl'],
    3: ['text-lg'],
    4: ['text-base'],
    5: ['text-sm'],
    6: ['text-xs']
  };

  return [
    'font-semibold',
    'text-gray-900',
    ...sizeClasses[props.level]
  ];
});
</script>
