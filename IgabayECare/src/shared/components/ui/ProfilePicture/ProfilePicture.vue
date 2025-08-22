<template>
  <div :class="['relative', className]">
    <!-- Profile Picture Display -->
    <div :class="[
      'relative rounded-full overflow-hidden border-2 border-gray-200',
      sizeClasses[size]
    ]">
      <img
        v-if="displayImage"
        :src="displayImage"
        alt="Profile"
        class="w-full h-full object-cover"
      />
      <div
        v-else
        :class="[
          'w-full h-full flex items-center justify-center',
          defaultBackground
        ]"
      >
        <component :is="defaultIcon" :size="iconSizes[size]" class="text-gray-400" />
      </div>

      <!-- Upload Overlay -->
      <div
        v-if="!disabled"
        class="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        <Button
          variant="outline"
          size="sm"
          @click="fileInput?.click()"
          :disabled="isUploading"
          class="bg-white text-gray-900 hover:bg-gray-50"
        >
          <Loader2 v-if="isUploading" :size="16" class="animate-spin" />
          <Camera v-else :size="16" />
        </Button>
      </div>

      <!-- Loading Overlay -->
      <div
        v-if="isUploading"
        class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <Loader2 :size="24" class="animate-spin text-white" />
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="!disabled" class="absolute -bottom-2 -right-2 flex space-x-1">
      <!-- Upload Button -->
      <Button
        variant="outline"
        size="sm"
        @click="fileInput?.click()"
        :disabled="isUploading"
        class="w-8 h-8 p-0 bg-white shadow-md hover:bg-gray-50"
      >
        <Loader2 v-if="isUploading" :size="12" class="animate-spin" />
        <Upload v-else :size="12" />
      </Button>

      <!-- Delete Button -->
      <Button
        v-if="currentImageUrl"
        variant="outline"
        size="sm"
        @click="handleDelete"
        :disabled="isUploading"
        class="w-8 h-8 p-0 bg-white shadow-md hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700"
      >
        <X :size="12" />
      </Button>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="handleFileSelect"
      class="hidden"
      :disabled="disabled || isUploading"
    />

    <!-- Error Message -->
    <div v-if="error" class="mt-2 text-sm text-red-600 text-center">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Camera, Upload, X, User, Building, Loader2 } from 'lucide-vue-next';
import Button from '../Button/Button.vue';
import { StorageService } from '../../../services/storage/StorageService';
import type { ProfilePictureProps, ProfilePictureEmits } from './ProfilePicture.types';

const props = withDefaults(defineProps<ProfilePictureProps>(), {
  size: 'md',
  disabled: false,
  className: ''
});

const emit = defineEmits<ProfilePictureEmits>();

const storageService = new StorageService();

const isUploading = ref(false);
const previewUrl = ref<string | null>(null);
const error = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// Size classes
const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40',
};

// Icon sizes
const iconSizes = {
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

const displayImage = computed(() => {
  if (previewUrl.value) return previewUrl.value;
  if (props.currentImageUrl) return props.currentImageUrl;
  return null;
});

const defaultIcon = computed(() => {
  switch (props.userType) {
    case 'clinic':
      return Building;
    case 'doctor':
      return User;
    default:
      return User;
  }
});

const defaultBackground = computed(() => {
  switch (props.userType) {
    case 'clinic':
      return 'bg-secondary-100';
    case 'doctor':
      return 'bg-primary-100';
    default:
      return 'bg-primary-100';
  }
});

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  // Basic validation
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image file';
    return;
  }

  error.value = null;
  isUploading.value = true;

  try {
    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewUrl.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Simulate upload (replace with actual implementation)
    const result = await storageService.uploadProfilePicture(
      props.userId,
      file,
      props.currentImagePath,
      props.userType
    );

    if (result.success && result.url && result.path) {
      previewUrl.value = null;
      emit('imageUpdate', result.url, result.path);
    } else {
      error.value = result.error || 'Failed to upload image';
      previewUrl.value = null;
    }
  } catch (err) {
    console.error('Upload error:', err);
    error.value = 'Failed to upload image';
    previewUrl.value = null;
  } finally {
    isUploading.value = false;
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const handleDelete = async () => {
  if (!props.currentImagePath) return;

  isUploading.value = true;
  try {
    const result = await storageService.deleteProfilePicture(props.currentImagePath);
    if (result.success) {
      emit('imageDelete');
    } else {
      error.value = result.error || 'Failed to delete image';
    }
  } catch (err) {
    console.error('Delete error:', err);
    error.value = 'Failed to delete image';
  } finally {
    isUploading.value = false;
  }
};
</script>
