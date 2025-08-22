<template>
  <div v-if="open" class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
      <div class="p-4 flex justify-between items-center border-b">
        <h2 class="text-lg font-semibold">Select Clinic Location</h2>
        <button
          @click="$emit('close')"
          class="text-gray-500 hover:text-gray-800 text-xl font-bold"
        >
          &times;
        </button>
      </div>
      <div class="p-4">
        <p class="text-sm text-gray-600 mb-4">
          Click on the map to select your clinic's location. This will help patients find you easily.
        </p>
        <div ref="mapContainer" class="w-full h-96 rounded-lg border" />
        <div v-if="selectedLocation" class="mt-4 p-3 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-800">
            <strong>Selected Location:</strong>
            {{ selectedLocation.lat.toFixed(6) }}, {{ selectedLocation.lng.toFixed(6) }}
          </p>
        </div>
        <div class="mt-4 flex justify-end space-x-2">
          <AppButton variant="outline" @click="$emit('close')">
            Cancel
          </AppButton>
          <AppButton
            variant="gradient"
            @click="confirmSelection"
            :disabled="!selectedLocation"
          >
            Confirm Location
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { AppButton } from '../../../ui/Button/Button.vue';

interface Props {
  open: boolean;
  selectedLocation?: { lat: number; lng: number } | null;
}

interface Emits {
  (e: 'close'): void;
  (e: 'locationSelect', location: { lat: number; lng: number }): void;
}

const props = withDefaults(defineProps<Props>(), {
  selectedLocation: null
});

const emit = defineEmits<Emits>();

const mapContainer = ref<HTMLDivElement | null>(null);
const selectedLocation = ref<{ lat: number; lng: number } | null>(props.selectedLocation);

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
      maxZoom: 19,
    }).addTo(mapInstance);

    // Add existing marker if location is already selected
    if (props.selectedLocation) {
      addMarker(props.selectedLocation.lat, props.selectedLocation.lng);
      mapInstance.setView([props.selectedLocation.lat, props.selectedLocation.lng], 15);
    }

    // Add click event listener
    mapInstance.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      selectedLocation.value = { lat, lng };
      addMarker(lat, lng);
    });

  } catch (error) {
    console.error('Error initializing map:', error);
  }
};

const addMarker = (lat: number, lng: number) => {
  if (!mapInstance || !L) return;

  // Remove existing marker
  if (markerInstance) {
    mapInstance.removeLayer(markerInstance);
  }

  // Add new marker
  markerInstance = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/1484/1484865.png',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    }),
  }).addTo(mapInstance);

  markerInstance.bindPopup('Selected clinic location').openPopup();
};

const confirmSelection = () => {
  if (selectedLocation.value) {
    emit('locationSelect', selectedLocation.value);
  }
};

const cleanup = () => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
    markerInstance = null;
  }
};

// Watch for modal open/close
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    // Small delay to ensure DOM is ready
    setTimeout(initializeMap, 100);
  } else {
    cleanup();
  }
});

// Watch for selectedLocation prop changes
watch(() => props.selectedLocation, (newLocation) => {
  selectedLocation.value = newLocation;
  if (newLocation && mapInstance) {
    addMarker(newLocation.lat, newLocation.lng);
    mapInstance.setView([newLocation.lat, newLocation.lng], 15);
  }
});

onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
/* Ensure the map container has proper styling */
:deep(.leaflet-container) {
  font-family: inherit;
}

:deep(.leaflet-control-attribution) {
  font-size: 10px;
}
</style>
