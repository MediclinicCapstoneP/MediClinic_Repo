<template>
  <ClinicSignUpForm :onSuccess="handleSuccess" />
</template>

<script setup lang="ts">
import ClinicSignUpForm from '../../../modules/auth/components/ClinicSignUpForm/ClinicSignUpForm.vue';

const handleSuccess = () => {
  // Don't redirect automatically - user needs to verify email first
  // router.push('/clinic/dashboard');
};
</script>
