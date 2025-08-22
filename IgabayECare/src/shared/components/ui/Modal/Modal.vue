<template>
  <Teleport to="body">
    <Transition
      name="modal"
      @enter="handleAfterOpen"
      @leave="handleAfterClose"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click="handleMaskClick"
      >
        <!-- Backdrop -->
        <div
          class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
          :class="{ 'items-center': centered }"
        >
          <!-- Overlay -->
          <div
            class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            @click="handleOverlayClick"
          />

          <!-- Modal Content -->
          <div
            :class="modalClasses"
            @click.stop
          >
            <!-- Header -->
            <div v-if="title || $slots.header || closable" class="flex items-center justify-between mb-4">
              <!-- Custom header slot -->
              <div v-if="$slots.header" class="flex-1">
                <slot name="header" />
              </div>
              <!-- Default title -->
              <h3 v-else-if="title" class="text-lg font-semibold text-gray-900 flex-1">
                {{ title }}
              </h3>

              <!-- Close button -->
              <button
                v-if="closable"
                @click="handleClose"
                class="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                :aria-label="'Close modal'"
              >
                <X :size="20" />
              </button>
            </div>

            <!-- Body -->
            <div class="modal-body">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="mt-6 pt-4 border-t border-gray-200">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { X } from 'lucide-vue-next';
import type { ModalProps, ModalEmits } from './Modal.types';
import { ComponentSize } from '../../../core/types';

interface Props extends ModalProps {}

const props = withDefaults(defineProps<Props>(), {
  size: ComponentSize.MEDIUM,
  closable: true,
  maskClosable: true,
  centered: false,
  destroyOnClose: false
});

const emit = defineEmits<ModalEmits>();

// Computed classes
const modalClasses = computed(() => {
  const baseClasses = [
    'inline-block',
    'w-full',
    'p-6',
    'my-8',
    'overflow-hidden',
    'text-left',
    'align-middle',
    'transition-all',
    'transform',
    'bg-white',
    'shadow-xl',
    'rounded-2xl',
    'relative'
  ];

  // Size classes
  const sizeClasses = {
    [ComponentSize.SMALL]: ['max-w-md'],
    [ComponentSize.MEDIUM]: ['max-w-lg'],
    [ComponentSize.LARGE]: ['max-w-2xl'],
    [ComponentSize.EXTRA_LARGE]: ['max-w-4xl']
  };

  return [
    ...baseClasses,
    ...sizeClasses[props.size]
  ];
});

// Event handlers
const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleMaskClick = (event: MouseEvent) => {
  if (props.maskClosable && event.target === event.currentTarget) {
    handleClose();
  }
};

const handleOverlayClick = () => {
  if (props.maskClosable) {
    handleClose();
  }
};

const handleAfterOpen = () => {
  emit('open');
  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden';
};

const handleAfterClose = () => {
  emit('afterClose');
  // Restore body scroll when modal is closed
  document.body.style.overflow = '';
};

// Keyboard events
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closable && props.modelValue) {
    handleClose();
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  // Ensure body scroll is restored
  document.body.style.overflow = '';
});

// Watch for model value changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    nextTick(() => {
      emit('afterOpen');
    });
  } else {
    nextTick(() => {
      emit('afterClose');
    });
  }
});
</script>

<style scoped>
/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .inline-block,
.modal-leave-active .inline-block {
  transition: transform 0.3s ease;
}

.modal-enter-from .inline-block,
.modal-leave-to .inline-block {
  transform: scale(0.95) translateY(-20px);
}

/* Ensure modal content is properly layered */
.modal-body {
  position: relative;
}
</style>
