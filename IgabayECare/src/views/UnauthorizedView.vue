<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <AlertCircle class="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p class="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
      </div>

      <div class="space-y-4">
        <Button
          @click="goBack"
          variant="primary"
          block
        >
          Go Back
        </Button>

        <Button
          @click="goHome"
          variant="outline"
          block
        >
          Go to Home
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { AlertCircle } from 'lucide-vue-next';
import { Button } from '../shared/components/ui/Button';

const router = useRouter();

const goBack = () => {
  router.back();
};

const goHome = () => {
  router.push('/');
};
</script>
