<template>
  <div
    id="map"
    ref="mapContainer"
    class="rounded-md z-0"
    style="height: 500px"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import type { ClinicMapProps, ClinicMapEmits } from './ClinicMap.types';

const props = withDefaults(defineProps<ClinicMapProps>(), {
  userLocation: null,
  nearestClinicFound: null,
  showRouting: false,
  open: false,
  selectedLocation: null
});

const mapContainer = ref<HTMLDivElement | null>(null);
let mapInstance: L.Map | null = null;
let markerGroup: L.LayerGroup | null = null;
let routingControl: L.Routing.Control | null = null;
let L: typeof import('leaflet') | null = null;

const initializeMap = async () => {
  if (!mapContainer.value) return;

  try {
    // Dynamic import of Leaflet to avoid SSR issues
    const leaflet = await import('leaflet');
    await import('leaflet-routing-machine');
    await import('leaflet/dist/leaflet.css');
    await import('leaflet-routing-machine/dist/leaflet-routing-machine.css');

    L = leaflet.default;

    // Remove existing map if any
    if (mapInstance) {
      mapInstance.remove();
    }

    // Create new map instance
    mapInstance = L.map(mapContainer.value).setView([11.0519, 124.0026], 13);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance);

    // Create marker group
    markerGroup = L.layerGroup().addTo(mapInstance);

    // Update markers and routing
    updateMapContent();
  } catch (error) {
    console.error('Error initializing map:', error);
  }
};

const updateMapContent = () => {
  if (!mapInstance || !markerGroup || !L) return;

  // Clear existing layers
  markerGroup.clearLayers();

  // Remove existing routing control
  if (routingControl) {
    mapInstance.removeControl(routingControl);
    routingControl = null;
  }

  // Add user location marker
  if (props.userLocation) {
    const userMarker = L.marker([props.userLocation.lat, props.userLocation.lng], {
      icon: L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    }).bindPopup('You are here');
    markerGroup.addLayer(userMarker);
  }

  // Add clinic marker
  if (props.nearestClinicFound) {
    const clinicMarker = L.marker([props.nearestClinicFound.lat, props.nearestClinicFound.lng], {
      icon: L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/1484/1484865.png',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    }).bindPopup(props.nearestClinicFound.name);
    markerGroup.addLayer(clinicMarker);
  }

  // Add routing if both user location and clinic are available
  if (props.userLocation && props.nearestClinicFound && props.showRouting && L.Routing) {
    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(props.userLocation.lat, props.userLocation.lng),
        L.latLng(props.nearestClinicFound.lat, props.nearestClinicFound.lng),
      ],
      lineOptions: {
        styles: [{ color: '#3B82F6', weight: 4, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 10,
      },
    })
    .on('routesfound', (e: L.RoutingEvent) => {
      const route = e.routes[0];
      const summary = route.summary;
      console.log(`Distance: ${(summary.totalDistance / 1000).toFixed(2)} km`);
      console.log(`Time: ${(summary.totalTime / 60).toFixed(0)} min`);
    })
    .addTo(mapInstance);
  }

  // Center map on user location if available
  if (props.userLocation && mapInstance) {
    mapInstance.setView([props.userLocation.lat, props.userLocation.lng], 14);
  }
};

// Watch for prop changes
watch([
  () => props.userLocation,
  () => props.nearestClinicFound,
  () => props.showRouting,
  () => props.selectedLocation
], () => {
  updateMapContent();
}, { deep: true });

onMounted(() => {
  initializeMap();
});

onUnmounted(() => {
  if (routingControl && mapInstance) {
    mapInstance.removeControl(routingControl);
  }
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
});
</script>

<style scoped>
/* Ensure proper z-index for map controls */
:deep(.leaflet-control-container) {
  z-index: 1000;
}

:deep(.leaflet-routing-container) {
  z-index: 1000;
}
</style>
