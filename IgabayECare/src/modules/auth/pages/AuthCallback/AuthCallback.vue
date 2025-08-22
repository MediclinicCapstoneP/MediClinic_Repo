<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-primary-100 text-center">
      <div class="mb-6">
        <Loader2 v-if="status === 'loading'" class="h-12 w-12 text-primary-600 animate-spin mx-auto" />
        <CheckCircle v-else-if="status === 'success'" class="h-12 w-12 text-green-600 mx-auto" />
        <XCircle v-else class="h-12 w-12 text-red-600 mx-auto" />
      </div>

      <h1 class="text-2xl font-bold text-foreground mb-4">
        {{ getTitle() }}
      </h1>

      <p class="text-muted-foreground mb-6">
        {{ message }}
      </p>

      <div v-if="status === 'success'" class="bg-green-50 p-4 rounded-lg mb-6">
        <p class="text-green-700 text-sm">
          Redirecting you to your dashboard in a few seconds...
        </p>
      </div>

      <div v-if="status === 'error'" class="space-y-4">
        <AppButton
          variant="gradient"
          @click="$router.push('/signup')"
          class="w-full"
        >
          Try Signing Up Again
        </AppButton>
        <AppButton
          variant="outline"
          @click="$router.push('/signin')"
          class="w-full"
        >
          Go to Sign In
        </AppButton>
      </div>

      <AppButton
        v-if="status === 'success'"
        variant="gradient"
        @click="redirectToDashboard"
        class="w-full"
      >
        Go to Dashboard Now
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { CheckCircle, XCircle, Loader2 } from 'lucide-vue-next';
import { AppButton } from '../../../shared/components/ui/Button/Button.vue';
import { SupabaseService } from '../../../shared/services/api/SupabaseService';

const router = useRouter();
const supabaseService = new SupabaseService();

// Reactive state
const status = ref<'loading' | 'success' | 'error'>('loading');
const message = ref('Verifying your email...');

// Methods
const getTitle = () => {
  switch (status.value) {
    case 'loading':
      return 'Verifying Your Email';
    case 'success':
      return 'Email Verified!';
    case 'error':
      return 'Verification Failed';
  }
};

const redirectToDashboard = async () => {
  try {
    const { data: sessionData } = await supabaseService.getSession();
    const userRole = sessionData.session?.user.user_metadata?.role;
    const redirectPath = userRole === 'clinic' ? '/clinic/dashboard' : '/patient/dashboard';
    router.push(redirectPath);
  } catch (error) {
    console.error('Error getting session:', error);
    router.push('/signin');
  }
};

const handleAuthCallback = async () => {
  try {
    const { data, error } = await supabaseService.getSession();

    if (error) {
      console.error('Auth callback error:', error);
      status.value = 'error';
      message.value = 'Email verification failed. Please try again or contact support.';
      return;
    }

    if (data.session) {
      // Email verified successfully
      status.value = 'success';
      message.value = 'Email verified successfully! You can now access your dashboard.';

      // Check user role and redirect accordingly
      const userRole = data.session.user.user_metadata?.role;
      const redirectPath = userRole === 'clinic' ? '/clinic/dashboard' : '/patient/dashboard';

      // Redirect to appropriate dashboard after 3 seconds
      setTimeout(() => {
        router.push(redirectPath);
      }, 3000);
    } else {
      status.value = 'error';
      message.value = 'Verification link is invalid or has expired. Please try signing up again.';
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    status.value = 'error';
    message.value = 'An unexpected error occurred. Please try again.';
  }
};

// Lifecycle hooks
onMounted(() => {
  handleAuthCallback();
});
</script>
