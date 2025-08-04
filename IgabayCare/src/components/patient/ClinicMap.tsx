// ClinicMap.tsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

type Location = {
  lat: number;
  lng: number;
};

type Clinic = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

interface ClinicMapProps {
  // Original props (keep for backward compatibility)
  userLocation?: Location | null;
  nearestClinicFound?: Clinic | null;
  showRouting?: boolean;
  // New props for modal/location picker usage
  open?: boolean;
  onClose?: () => void;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

const ClinicMap: React.FC<ClinicMapProps> = ({ userLocation, nearestClinicFound, showRouting, open, onClose, selectedLocation, onLocationSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    mapInstanceRef.current = L.map(mapContainerRef.current).setView([11.0519, 124.0026], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstanceRef.current);

    markerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);

    return () => {
      if (routingControlRef.current) {
        mapInstanceRef.current?.removeControl(routingControlRef.current);
      }
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !markerGroupRef.current) return;

    markerGroupRef.current.clearLayers();

    if (routingControlRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        }),
      }).bindPopup('You are here');
      markerGroupRef.current.addLayer(userMarker);
    }

    if (nearestClinicFound) {
      const clinicMarker = L.marker([nearestClinicFound.lat, nearestClinicFound.lng], {
        icon: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/1484/1484865.png',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        }),
      }).bindPopup(nearestClinicFound.name);
      markerGroupRef.current.addLayer(clinicMarker);
    }

    if (userLocation && nearestClinicFound && showRouting) {
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(userLocation.lat, userLocation.lng),
          L.latLng(nearestClinicFound.lat, nearestClinicFound.lng),
        ],
        // routeWhileDragging: false,
        // addWaypoints: false,
        // draggableWaypoints: false,
        // show: false,
        // createMarker: () => null,
         lineOptions: {
      styles: [{ color: '#3B82F6', weight: 4, opacity: 0.8 }],
      extendToWaypoints: true,
      missingRouteTolerance: 10,
    },
      })
        .on('routesfound', (e: any) => {
          const route = e.routes[0];
          const summary = route.summary;
          console.log(`Distance: ${(summary.totalDistance / 1000).toFixed(2)} km`);
          console.log(`Time: ${(summary.totalTime / 60).toFixed(0)} min`);
        })
        .addTo(mapInstanceRef.current);
    }

    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation, nearestClinicFound, showRouting]);

  return <div id="map" className="rounded-md z-0" style={{ height: '500px' }} ref={mapContainerRef}></div>;
};

export default ClinicMap;
