<template>
  <div class="w-full">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <!-- Input wrapper -->
    <div class="relative">
      <!-- Left icon -->
      <div
        v-if="icon && iconPosition === 'left'"
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <component :is="icon" class="h-5 w-5 text-gray-400" />
      </div>

      <!-- Input field -->
      <input
        :id="inputId"
        :name="name"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :maxlength="maxLength"
        :minlength="minLength"
        :pattern="pattern"
        :autocomplete="autocomplete"
        :class="inputClasses"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        @keyup="handleKeyup"
      />

      <!-- Right icon -->
      <div
        v-if="icon && iconPosition === 'right'"
        class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
      >
        <component :is="icon" class="h-5 w-5 text-gray-400" />
      </div>
    </div>

    <!-- Error message -->
    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';
import type { InputProps, InputEmits } from './Input.types';
import { ComponentSize } from '../../../core/types';

interface Props extends InputProps {}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: ComponentSize.MEDIUM,
  disabled: false,
  readonly: false,
  required: false,
  iconPosition: 'left',
  modelValue: ''
});

const emit = defineEmits<InputEmits>();

// Generate unique ID for the input
const inputId = props.id || `input-${useId()}`;

const inputClasses = computed(() => {
  const baseClasses = [
    'block',
    'w-full',
    'border',
    'rounded-lg',
    'shadow-sm',
    'placeholder-gray-400',
    'focus:outline-none',
    'focus:ring-2',
    'transition-colors',
    'duration-200'
  ];

  // Size classes
  const sizeClasses = {
    [ComponentSize.SMALL]: ['px-2', 'py-1', 'text-sm'],
    [ComponentSize.MEDIUM]: ['px-3', 'py-2', 'text-sm'],
    [ComponentSize.LARGE]: ['px-4', 'py-3', 'text-base'],
    [ComponentSize.EXTRA_LARGE]: ['px-5', 'py-4', 'text-lg']
  };

  // State classes
  const stateClasses = props.error
    ? ['border-red-300', 'focus:ring-red-500', 'focus:border-red-500']
    : ['border-gray-300', 'focus:ring-theme', 'focus:border-theme'];

  // Icon padding
  const iconClasses = [];
  if (props.icon && props.iconPosition === 'left') {
    iconClasses.push('pl-10');
  } else if (props.icon && props.iconPosition === 'right') {
    iconClasses.push('pr-10');
  }

  // Disabled state
  const disabledClasses = props.disabled || props.readonly
    ? ['bg-gray-50', 'cursor-not-allowed']
    : [];

  return [
    ...baseClasses,
    ...sizeClasses[props.size],
    ...stateClasses,
    ...iconClasses,
    ...disabledClasses
  ];
});

// Event handlers
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
  emit('input', event);
};

const handleChange = (event: Event) => {
  emit('change', event);
};

const handleFocus = (event: FocusEvent) => {
  emit('focus', event);
};

const handleBlur = (event: FocusEvent) => {
  emit('blur', event);
};

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event);
};

const handleKeyup = (event: KeyboardEvent) => {
  emit('keyup', event);
};
</script>
