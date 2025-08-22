<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="mx-auto h-16 w-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
          <Building class="h-8 w-8 text-secondary-600" />
        </div>
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p class="text-gray-600">Sign in to your clinic dashboard</p>
      </div>

      <AppCard class="bg-white shadow-xl border-0">
        <template #header>
          <div class="text-center pb-4">
            <h3 class="text-xl font-semibold text-gray-900">Clinic Sign In</h3>
          </div>
        </template>

        <template #content>
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Error Message -->
            <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex items-center space-x-2">
                <AlertCircle :size="20" class="text-red-600" />
                <span class="text-red-800 text-sm">{{ error }}</span>
              </div>
            </div>

            <!-- Email Input -->
            <AppInput
              label="Email Address"
              type="email"
              v-model="formData.email"
              required
              :disabled="isLoading"
            />

            <!-- Password Input -->
            <div class="relative">
              <AppInput
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                v-model="formData.password"
                required
                :disabled="isLoading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                :disabled="isLoading"
              >
                <EyeOff v-if="showPassword" :size="20" />
                <Eye v-else :size="20" />
              </button>
            </div>

            <!-- Submit Button -->
            <AppButton
              type="submit"
              variant="gradient"
              class="w-full"
              :loading="isLoading"
            >
              Sign In
            </AppButton>
          </form>

          <!-- Sign Up Link -->
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              Don't have a clinic account?
              <router-link
                to="/clinic-signup"
                class="font-medium text-secondary-600 hover:text-secondary-500 transition-colors"
              >
                Register your clinic
              </router-link>
            </p>
          </div>

          <!-- Patient Link -->
          <div class="mt-4 text-center">
            <p class="text-sm text-gray-600">
              Are you a patient?
              <router-link
                to="/signin"
                class="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Sign in here
              </router-link>
            </p>
          </div>
        </template>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Building, Eye, EyeOff, AlertCircle } from 'lucide-vue-next';
import { AppButton } from '../../../../shared/components/ui/Button/Button.vue';
import { AppInput } from '../../../../shared/components/ui/Input/Input.vue';
import { AppCard } from '../../../../shared/components/ui/Card/Card.vue';
import { AuthService } from '../../services/AuthService';

interface FormData {
  email: string;
  password: string;
}

const router = useRouter();
const authService = new AuthService();

// Reactive state
const formData = ref<FormData>({
  email: '',
  password: '',
});
const showPassword = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Methods
const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const result = await authService.signInClinic(formData.value);

    if (result.success) {
      console.log('Clinic sign in successful');
      router.push('/clinic/dashboard');
    } else {
      error.value = result.error || 'Sign in failed';
    }
  } catch (err) {
    console.error('Sign in error:', err);
    error.value = 'An unexpected error occurred';
  } finally {
    isLoading.value = false;
  }
};
</script>
