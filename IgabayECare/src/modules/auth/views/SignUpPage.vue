<template>
  <SignUpForm :onSuccess="handleSuccess" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import SignUpForm from '../components/SignUpForm/SignUpForm.vue';

const router = useRouter();

const handleSuccess = () => {
  router.push('/signin');
};
</script>
