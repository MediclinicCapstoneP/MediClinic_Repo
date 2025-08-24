<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full text-center">
      <div class="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-8">
        <AlertCircle class="h-12 w-12 text-red-600" />
      </div>
      <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
      <p class="text-gray-600 mb-8">
        Sorry, we couldn't find the page you're looking for. The page may have been moved, deleted, or you may have entered the wrong URL.
      </p>
      <div class="space-y-4">
        <AppButton
          @click="$router.go(-1)"
          variant="outline"
          class="w-full"
        >
          Go Back
        </AppButton>
        <AppButton
          @click="$router.push('/')"
          variant="gradient"
          class="w-full"
        >
          Go to Home
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next';
import { AppButton } from '../shared/components/ui/Button/Button.vue';
</script>
