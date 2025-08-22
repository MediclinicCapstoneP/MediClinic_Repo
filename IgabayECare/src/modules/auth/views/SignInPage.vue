<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- Patient Sign In Form will be rendered here -->
    <div class="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p class="text-gray-600">Sign in to your patient account</p>
        </div>

        <!-- TODO: Add Patient Sign In Form Component -->
        <div class="bg-white p-8 rounded-xl shadow-lg">
          <p class="text-center text-gray-500">Patient Sign In Form - To be implemented</p>
          <div class="mt-6">
            <RouterLink
              to="/clinic-signin"
              class="block text-center text-secondary-600 hover:text-secondary-500"
            >
              Are you a clinic? Sign in here
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Patient sign-in page
// This will be updated with the actual form component
</script>
