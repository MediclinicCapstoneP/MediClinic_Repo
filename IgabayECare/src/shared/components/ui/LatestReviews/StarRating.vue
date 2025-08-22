<template>
  <div class="flex items-center">
    <Star
      v-for="index in 5"
      :key="index"
      :class="[
        'h-3 w-3',
        index <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
      ]"
    />
  </div>
</template>

<script setup lang="ts">
import { Star } from 'lucide-vue-next';

interface Props {
  rating: number;
}

defineProps<Props>();
</script>
