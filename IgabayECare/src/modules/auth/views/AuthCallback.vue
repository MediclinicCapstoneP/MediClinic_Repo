<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Processing authentication...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../../../shared/composables/useAuth';

const router = useRouter();
const { user } = useAuth();

onMounted(async () => {
  // Handle the auth callback and redirect appropriately
  try {
    // Wait a bit for auth state to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (user.value) {
      // Redirect based on user role
      const role = user.value.role;
      if (role === 'patient') {
        router.push('/patients-dashboard');
      } else if (role === 'clinic') {
        router.push('/clinic-dashboard');
      } else if (role === 'doctor') {
        router.push('/doctors-dashboard');
      } else {
        router.push('/');
      }
    } else {
      // No user found, redirect to signin
      router.push('/signin');
    }
  } catch (error) {
    console.error('Auth callback error:', error);
    router.push('/signin');
  }
});
</script>
