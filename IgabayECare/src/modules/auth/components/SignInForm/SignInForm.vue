<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="mx-auto h-16 w-16 bg-blue-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <User class="h-8 w-8 text-blue-600" />
        </div>
        <h2 class="text-3xl font-bold text-gray-800 mb-1">Welcome Back</h2>
        <p class="text-gray-600">Sign in to your patient dashboard</p>
      </div>

      <AppCard class="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-100 rounded-2xl">
        <template #header>
          <div class="text-center pb-2">
            <h3 class="text-xl font-semibold text-gray-800">Patient Sign In</h3>
          </div>
        </template>

        <template #content>
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Error Message -->
            <div v-if="error" class="p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-800 flex items-center gap-2">
              <AlertCircle :size="18" class="text-red-600" />
              {{ error }}
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
              class="w-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              :loading="isLoading"
            >
              Sign In
            </AppButton>
          </form>

          <!-- Sign Up Link -->
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              Don't have a patient account?
              <router-link
                to="/signup"
                class="font-medium text-blue-600 hover:underline"
              >
                Register here
              </router-link>
            </p>
          </div>

          <!-- Clinic Link -->
          <div class="mt-4 text-center">
            <p class="text-sm text-gray-600">
              Are you a clinic?
              <router-link
                to="/clinic-signin"
                class="font-medium text-indigo-600 hover:underline"
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
import { User, Eye, EyeOff, AlertCircle } from 'lucide-vue-next';
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
    const result = await authService.signInPatient(formData.value);

    if (result.success) {
      console.log('Patient sign in successful');
      router.push('/patient/dashboard');
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
