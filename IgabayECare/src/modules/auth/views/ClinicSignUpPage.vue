<template>
  <ClinicSignUpForm :onSuccess="handleSuccess" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import ClinicSignUpForm from '../components/ClinicSignUpForm/ClinicSignUpForm.vue';

const router = useRouter();

const handleSuccess = () => {
  router.push('/clinic-signin');
};
</script>
