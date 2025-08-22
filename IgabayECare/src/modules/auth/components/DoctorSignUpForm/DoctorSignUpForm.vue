<template>
  <!-- Success State -->
  <div
    v-if="success"
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full text-center">
      <div class="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle class="h-8 w-8 text-green-600" />
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
      <p class="text-gray-600 mb-6">
        We've sent a verification email to {{ formData.email }}. Please check your email and click the verification link to complete your doctor registration.
      </p>
      <AppButton
        @click="resendVerificationEmail"
        variant="outline"
        class="mr-2"
      >
        Resend Verification Email
      </AppButton>
      <AppButton
        @click="$router.push('/doctor-signin')"
        variant="gradient"
      >
        Go to Sign In
      </AppButton>
    </div>
  </div>

  <!-- Main Form -->
  <div
    v-else
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Stethoscope class="h-8 w-8 text-blue-600" />
        </div>
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Join as a Doctor</h2>
        <p class="text-gray-600">Register to start managing your patients</p>
      </div>

      <AppCard class="bg-white shadow-xl border-0">
        <template #header>
          <div class="text-center pb-4">
            <h3 class="text-xl font-semibold text-gray-900">Doctor Registration</h3>
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

            <!-- Name Fields -->
            <div class="grid grid-cols-2 gap-4">
              <AppInput
                label="First Name"
                v-model="formData.firstName"
                required
                :disabled="isLoading"
              />
              <AppInput
                label="Last Name"
                v-model="formData.lastName"
                required
                :disabled="isLoading"
              />
            </div>

            <!-- Email -->
            <AppInput
              label="Email Address"
              type="email"
              v-model="formData.email"
              required
              :disabled="isLoading"
            />

            <!-- License Number -->
            <AppInput
              label="Medical License Number"
              v-model="formData.licenseNumber"
              required
              :disabled="isLoading"
            />

            <!-- Specialization -->
            <AppInput
              label="Specialization"
              v-model="formData.specialization"
              required
              :disabled="isLoading"
            />

            <!-- Phone -->
            <AppInput
              label="Phone Number"
              v-model="formData.phone"
              :disabled="isLoading"
            />

            <!-- Password -->
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

            <!-- Confirm Password -->
            <div class="relative">
              <AppInput
                label="Confirm Password"
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="formData.confirmPassword"
                required
                :disabled="isLoading"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                :disabled="isLoading"
              >
                <EyeOff v-if="showConfirmPassword" :size="20" />
                <Eye v-else :size="20" />
              </button>
            </div>

            <p v-if="passwordMismatch" class="text-red-600 text-sm">
              Passwords do not match
            </p>

            <!-- Submit Button -->
            <AppButton
              type="submit"
              variant="gradient"
              class="w-full"
              :loading="isLoading"
            >
              Register as Doctor
            </AppButton>
          </form>

          <!-- Sign In Link -->
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              Already have a doctor account?
              <router-link
                to="/doctor-signin"
                class="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in here
              </router-link>
            </p>
          </div>

          <!-- Patient Link -->
          <div class="mt-4 text-center">
            <p class="text-sm text-gray-600">
              Are you a patient?
              <router-link
                to="/signup"
                class="font-medium text-green-600 hover:text-green-500 transition-colors"
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
                to="/clinic-signup"
                class="font-medium text-purple-600 hover:text-purple-500 transition-colors"
              >
                Register here
              </router-link>
            </p>
          </div>
        </template>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Stethoscope, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-vue-next';
import { AppButton } from '../../../../shared/components/ui/Button/Button.vue';
import { AppInput } from '../../../../shared/components/ui/Input/Input.vue';
import { AppCard } from '../../../../shared/components/ui/Card/Card.vue';
import { AuthService } from '../../services/AuthService';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  licenseNumber: string;
  specialization: string;
  phone: string;
}

const router = useRouter();
const authService = new AuthService();

// Reactive state
const formData = ref<FormData>({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  licenseNumber: '',
  specialization: '',
  phone: '',
});
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

// Computed properties
const passwordMismatch = computed(() => {
  return formData.value.password &&
         formData.value.confirmPassword &&
         formData.value.password !== formData.value.confirmPassword;
});

// Methods
const resendVerificationEmail = async () => {
  try {
    await authService.resendVerificationEmail(formData.value.email);
  } catch (err) {
    console.error('Error resending verification email:', err);
  }
};

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;

  // Validate passwords match
  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = 'Passwords do not match';
    isLoading.value = false;
    return;
  }

  // Validate password length
  if (formData.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters long';
    isLoading.value = false;
    return;
  }

  try {
    const result = await authService.signUpDoctor({
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      email: formData.value.email,
      password: formData.value.password,
      licenseNumber: formData.value.licenseNumber,
      specialization: formData.value.specialization,
      phone: formData.value.phone,
    });

    if (result.success) {
      success.value = true;
      setTimeout(() => {
        router.push('/doctor-signin');
      }, 3000);
    } else {
      error.value = result.error || 'Registration failed';
    }
  } catch (err) {
    console.error('Registration error:', err);
    error.value = 'An unexpected error occurred';
  } finally {
    isLoading.value = false;
  }
};
</script>
