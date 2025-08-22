<template>
  <div id="app">
    <!-- Loading state -->
    <div
      v-if="authLoading"
      class="min-h-screen flex items-center justify-center bg-gray-50"
    >
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading...</p>
      </div>
    </div>

    <!-- Main application -->
    <RouterView v-else />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from './shared/composables/useAuth'

// Use the auth composable
const { initialize, loading: authLoading } = useAuth()

// Initialize authentication state on app mount
onMounted(async () => {
  try {
    await initialize()
  } catch (error) {
    console.error('Failed to initialize app:', error)
  }
})
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
