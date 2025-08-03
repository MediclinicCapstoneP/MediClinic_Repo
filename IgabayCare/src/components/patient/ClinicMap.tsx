import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Clinic {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  specialties: string[];
  rating: number;
  openNow: boolean;
  distance: string;
  estimatedTime: string;
}

interface ClinicMapProps {
  clinics: Clinic[];
  userLocation: { lat: number; lng: number } | null;
  onClinicClick?: (clinic: Clinic) => void;
  selectedClinicId?: number | null;
  showRouting?: boolean;
}

export const ClinicMap: React.FC<ClinicMapProps> = ({
  clinics,
  userLocation,
  onClinicClick,
  selectedClinicId,
  showRouting = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routingControlRef = useRef<any>(null);
  const [nearestClinic, setNearestClinic] = useState<Clinic | null>(null);

  // Function to calculate distance (Haversine formula)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map - default to Bogo City
    const map = L.map(mapRef.current).setView([11.044526, 124.004376], 13);

    // Add Thunderforest tile layer (similar to reference code)
    L.tileLayer('https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=a353d2f765d444f1bff3dd18b4b834bf', {
      maxZoom: 19,
      attribution: '© Thunderforest & contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add user location marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<b>You are here!</b>')
        .openPopup();
      
      markersRef.current.push(userMarker);

      // Center map on user location
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15);
    }

    // Find nearest clinic and add clinic markers
    let nearestClinicFound = null;
    let minDistance = Infinity;

    clinics.forEach(clinic => {
      const isSelected = selectedClinicId === clinic.id;
      const isOpen = clinic.openNow;
      
      // Calculate distance to user if location is available
      if (userLocation) {
        const distance = getDistance(userLocation.lat, userLocation.lng, clinic.lat, clinic.lng);
        if (distance < minDistance) {
          minDistance = distance;
          nearestClinicFound = clinic;
        }
      }
      
      const clinicIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background-color: ${isOpen ? '#10B981' : '#EF4444'}; 
            width: 24px; 
            height: 24px; 
            border-radius: 50%; 
            border: 3px solid white; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: white;
          ">
            ${isOpen ? '✓' : '✗'}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([clinic.lat, clinic.lng], { icon: clinicIcon })
        .addTo(mapInstanceRef.current!)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1F2937;">${clinic.name}</h3>
            <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 14px;">${clinic.address}</p>
            <p style="margin: 0 0 4px 0; color: #6B7280; font-size: 14px;">
              ⭐ ${clinic.rating} • ${clinic.distance} • ${clinic.estimatedTime}
            </p>
            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 12px;">
              ${clinic.specialties.join(', ')}
            </p>
            <div style="
              padding: 4px 8px; 
              background-color: ${isOpen ? '#D1FAE5' : '#FEE2E2'}; 
              color: ${isOpen ? '#065F46' : '#991B1B'}; 
              border-radius: 4px; 
              font-size: 12px; 
              font-weight: bold;
              display: inline-block;
            ">
              ${isOpen ? 'Open Now' : 'Closed'}
            </div>
          </div>
        `);

      if (onClinicClick) {
        marker.on('click', () => onClinicClick(clinic));
      }

      markersRef.current.push(marker);
    });

    // Set nearest clinic
    setNearestClinic(nearestClinicFound);

    // Add routing to nearest clinic if enabled and user location is available
    if (showRouting && userLocation && nearestClinicFound) {
      // Remove existing routing control
      if (routingControlRef.current) {
        mapInstanceRef.current!.removeControl(routingControlRef.current);
      }

      // Add routing control (simplified version without external routing library)
      const routeLine = L.polyline([
        [userLocation.lat, userLocation.lng],
        [nearestClinicFound.lat, nearestClinicFound.lng]
      ], {
        color: 'blue',
        weight: 4,
        opacity: 0.7
      }).addTo(mapInstanceRef.current!);

      // Add route info popup
      const routeDistance = getDistance(userLocation.lat, userLocation.lng, nearestClinicFound.lat, nearestClinicFound.lng);
      routeLine.bindPopup(`
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">Route to ${nearestClinicFound.name}</h4>
          <p style="margin: 0; color: #6B7280;">Distance: ${routeDistance.toFixed(2)} km</p>
          <p style="margin: 4px 0 0 0; color: #6B7280;">Estimated time: ${Math.round(routeDistance * 20)} min</p>
        </div>
      `);
    }

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [clinics, userLocation, selectedClinicId, onClinicClick]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-96 rounded-lg overflow-hidden border border-gray-200"
      style={{ zIndex: 1 }}
    />
  );
}; 