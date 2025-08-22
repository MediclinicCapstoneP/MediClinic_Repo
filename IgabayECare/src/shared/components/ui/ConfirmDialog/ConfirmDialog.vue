<template>
  <Modal
    v-model="isOpen"
    :title="title"
    size="sm"
    :closable="closable"
    @close="handleClose"
  >
    <template #header>
      <div v-if="$slots.title">
        <slot name="title" />
      </div>
      <div v-else class="flex items-center space-x-3">
        <component
          :is="variantIcon"
          :class="['h-6 w-6', variantClasses.icon]"
        />
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
      </div>
    </template>

    <!-- Content -->
    <div class="py-2">
      <slot name="content">
        <p class="text-gray-600">{{ message }}</p>
      </slot>
    </div>

    <template #footer>
      <slot name="actions">
        <div class="flex items-center justify-end space-x-3">
          <Button
            variant="outline"
            @click="handleCancel"
            :disabled="loading"
          >
            {{ cancelText }}
          </Button>
          <Button
            :variant="variantButtonType"
            :loading="loading"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </Button>
        </div>
      </slot>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-vue-next';
import { Modal } from '../Modal';
import { Button } from '../Button';
import type { ConfirmDialogProps, ConfirmDialogEmits } from './ConfirmDialog.types';
import { ComponentVariant } from '../../../core/types';

interface Props extends ConfirmDialogProps {}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
  loading: false,
  closable: true
});

const emit = defineEmits<ConfirmDialogEmits>();

// Internal state to handle v-model
const isOpen = ref(props.modelValue);

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue;
});

// Watch for internal changes
watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue);
});

// Computed properties
const variantIcon = computed(() => {
  switch (props.variant) {
    case 'danger':
      return AlertTriangle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    case 'success':
      return CheckCircle;
    default:
      return AlertTriangle;
  }
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'danger':
      return {
        icon: 'text-red-600',
        border: 'border-red-200'
      };
    case 'warning':
      return {
        icon: 'text-yellow-600',
        border: 'border-yellow-200'
      };
    case 'info':
      return {
        icon: 'text-blue-600',
        border: 'border-blue-200'
      };
    case 'success':
      return {
        icon: 'text-green-600',
        border: 'border-green-200'
      };
    default:
      return {
        icon: 'text-red-600',
        border: 'border-red-200'
      };
  }
});

const variantButtonType = computed(() => {
  switch (props.variant) {
    case 'danger':
      return ComponentVariant.DANGER;
    case 'warning':
      return ComponentVariant.WARNING;
    case 'info':
      return ComponentVariant.INFO;
    case 'success':
      return ComponentVariant.SUCCESS;
    default:
      return ComponentVariant.DANGER;
  }
});

// Event handlers
const handleConfirm = async () => {
  emit('confirm');
  if (!props.loading) {
    handleClose();
  }
};

const handleCancel = () => {
  emit('cancel');
  handleClose();
};

const handleClose = () => {
  isOpen.value = false;
  emit('close');
};
</script>
