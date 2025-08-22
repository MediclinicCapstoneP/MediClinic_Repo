<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Stethoscope class="h-8 w-8 text-blue-600" />
        </div>
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Welcome Back, Doctor</h2>
        <p class="text-gray-600">Sign in to your medical dashboard</p>
      </div>

      <AppCard class="bg-white shadow-xl border-0">
        <template #header>
          <div class="text-center pb-4">
            <h3 class="text-xl font-semibold text-gray-900">Doctor Sign In</h3>
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

          <!-- Forgot Password Link -->
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              Forgot password?
              <router-link
                to="#"
                class="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Click here to reset
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
import { Stethoscope, Eye, EyeOff, AlertCircle } from 'lucide-vue-next';
import { AppButton } from '../../../../shared/components/ui/Button/Button.vue';
import { AppInput } from '../../../../shared/components/ui/Input/Input.vue';
import { AppCard } from '../../../../shared/components/ui/Card/Card.vue';
import { AuthService } from '../../services/AuthService';

interface Props {
  onSuccess?: () => void;
}

interface FormData {
  email: string;
  password: string;
}

const props = withDefaults(defineProps<Props>(), {
  onSuccess: undefined
});

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
    const result = await authService.signInDoctor(formData.value);

    if (result.success) {
      console.log('Doctor sign in successful');
      props.onSuccess?.();
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
