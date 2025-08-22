<template>
  <div v-if="open" class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-hidden">
      <div class="p-4 flex justify-between items-center border-b">
        <h2 class="text-lg font-semibold">Select Clinic Location</h2>
        <button
          @click="emit('close')"
          class="text-gray-500 hover:text-gray-800 text-xl font-bold"
        >
          &times;
        </button>
      </div>
      <div ref="mapContainer" class="w-full h-[400px]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import type { ClinicLocationModalProps, ClinicLocationModalEmits } from './ClinicLocationModal.types';

const props = defineProps<ClinicLocationModalProps>();
const emit = defineEmits<ClinicLocationModalEmits>();

const mapContainer = ref<HTMLDivElement | null>(null);
let mapInstance: L.Map | null = null;
let markerInstance: L.Marker | null = null;
let L: typeof import('leaflet') | null = null;

const initializeMap = async () => {
  if (!props.open || !mapContainer.value || mapInstance) return;

  try {
    // Dynamic import of Leaflet to avoid SSR issues
    const leaflet = await import('leaflet');
    await import('leaflet/dist/leaflet.css');

    L = leaflet.default;

    // Create map instance
    mapInstance = L.map(mapContainer.value).setView([11.0519, 124.0036], 13);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance);

    // Handle map clicks
    mapInstance.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (markerInstance) {
        markerInstance.setLatLng(e.latlng);
      } else {
        markerInstance = L!.marker(e.latlng).addTo(mapInstance!);
      }

      emit('locationSelect', { lat, lng });
    });

    // Set initial location if provided
    updateMapLocation();
  } catch (error) {
    console.error('Error initializing map:', error);
  }
};

const updateMapLocation = () => {
  if (!mapInstance || !L || !props.selectedLocation) return;

  const { lat, lng } = props.selectedLocation;

  if (markerInstance) {
    markerInstance.setLatLng([lat, lng]);
  } else {
    markerInstance = L.marker([lat, lng]).addTo(mapInstance);
  }

  mapInstance.setView([lat, lng], 15);
};

const cleanupMap = () => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markerInstance = null;
  }
};

// Watch for prop changes
watch(() => props.open, (newValue) => {
  if (newValue) {
    // Delay map initialization to ensure DOM is ready
    setTimeout(initializeMap, 100);
  } else {
    cleanupMap();
  }
});

watch(() => props.selectedLocation, updateMapLocation, { deep: true });

onUnmounted(() => {
  cleanupMap();
});
</script>
