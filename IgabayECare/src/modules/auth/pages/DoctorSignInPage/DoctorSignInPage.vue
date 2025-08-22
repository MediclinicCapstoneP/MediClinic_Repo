<template>
  <DoctorSignInForm :onSuccess="handleSuccess" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import DoctorSignInForm from '../../../modules/auth/components/DoctorSignInForm/DoctorSignInForm.vue';

const router = useRouter();

const handleSuccess = () => {
  router.push('/doctors-dashboard');
};
</script>
