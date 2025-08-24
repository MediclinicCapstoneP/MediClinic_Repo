<template>
  <DoctorSignUpForm :onSuccess="handleSuccess" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import DoctorSignUpForm from '../components/DoctorSignUpForm/DoctorSignUpForm.vue';

const router = useRouter();

const handleSuccess = () => {
  router.push('/doctor-signin');
};
</script>
