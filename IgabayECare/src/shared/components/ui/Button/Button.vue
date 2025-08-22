<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
  >
    <!-- Loading spinner -->
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>

    <!-- Icon (left) -->
    <component
      v-if="icon && iconPosition === 'left' && !loading"
      :is="icon"
      class="mr-2 h-4 w-4"
    />

    <!-- Button content -->
    <slot />

    <!-- Icon (right) -->
    <component
      v-if="icon && iconPosition === 'right' && !loading"
      :is="icon"
      class="ml-2 h-4 w-4"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ButtonProps, ButtonEmits } from './Button.types';
import { ComponentSize, ComponentVariant } from '../../../core/types';

interface Props extends ButtonProps {}

const props = withDefaults(defineProps<Props>(), {
  variant: ComponentVariant.PRIMARY,
  size: ComponentSize.MEDIUM,
  loading: false,
  disabled: false,
  type: 'button',
  block: false,
  iconPosition: 'left'
});

const emit = defineEmits<ButtonEmits>();

const buttonClasses = computed(() => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed'
  ];

  // Variant classes
  const variantClasses = {
    [ComponentVariant.PRIMARY]: [
      'bg-theme',
      'hover:bg-theme-dark',
      'text-white',
      'focus:ring-theme',
      'shadow-lg',
      'hover:shadow-xl'
    ],
    [ComponentVariant.SECONDARY]: [
      'bg-secondary-600',
      'hover:bg-secondary-700',
      'text-white',
      'focus:ring-secondary-500',
      'shadow-lg',
      'hover:shadow-xl'
    ],
    [ComponentVariant.SUCCESS]: [
      'bg-green-600',
      'hover:bg-green-700',
      'text-white',
      'focus:ring-green-500',
      'shadow-lg',
      'hover:shadow-xl'
    ],
    [ComponentVariant.WARNING]: [
      'bg-yellow-600',
      'hover:bg-yellow-700',
      'text-white',
      'focus:ring-yellow-500',
      'shadow-lg',
      'hover:shadow-xl'
    ],
    [ComponentVariant.DANGER]: [
      'bg-red-600',
      'hover:bg-red-700',
      'text-white',
      'focus:ring-red-500',
      'shadow-lg',
      'hover:shadow-xl'
    ],
    [ComponentVariant.INFO]: [
      'bg-blue-600',
      'hover:bg-blue-700',
      'text-white',
      'focus:ring-blue-500',
      'shadow-lg',
      'hover:shadow-xl'
    ],
    [ComponentVariant.OUTLINE]: [
      'border-2',
      'border-theme',
      'text-theme',
      'hover:bg-theme-light',
      'focus:ring-theme'
    ],
    [ComponentVariant.GHOST]: [
      'text-gray-600',
      'hover:bg-gray-100',
      'focus:ring-gray-500'
    ],
    // Custom variants for healthcare app
    medical: [
      'bg-medical-600',
      'hover:bg-medical-700',
      'text-white',
      'focus:ring-medical-500',
      'shadow-lg',
      'hover:shadow-xl'
    ],
    accent: [
      'bg-accent-600',
      'hover:bg-accent-700',
      'text-white',
      'focus:ring-accent-500',
      'shadow-lg',
      'hover:shadow-xl'
    ],
    gradient: [
      'bg-gradient-theme',
      'hover:bg-gradient-theme-dark',
      'text-white',
      'focus:ring-theme',
      'shadow-lg',
      'hover:shadow-xl',
      'transform',
      'hover:scale-105'
    ]
  };

  // Size classes
  const sizeClasses = {
    [ComponentSize.SMALL]: ['px-3', 'py-1.5', 'text-sm', 'rounded-md'],
    [ComponentSize.MEDIUM]: ['px-4', 'py-2', 'text-sm', 'rounded-lg'],
    [ComponentSize.LARGE]: ['px-6', 'py-3', 'text-base', 'rounded-lg'],
    [ComponentSize.EXTRA_LARGE]: ['px-8', 'py-4', 'text-lg', 'rounded-xl']
  };

  // Block classes
  const blockClasses = props.block ? ['w-full'] : [];

  return [
    ...baseClasses,
    ...(variantClasses[props.variant] || variantClasses[ComponentVariant.PRIMARY]),
    ...sizeClasses[props.size],
    ...blockClasses
  ];
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>
