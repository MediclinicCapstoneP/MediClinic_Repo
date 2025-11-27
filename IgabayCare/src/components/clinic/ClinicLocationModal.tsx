import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LatLng {
  lat: number;
  lng: number;
}

interface ClinicLocationModalProps {
  open: boolean;
  onClose: () => void;
  selectedLocation: LatLng | null;
  onLocationSelect: (location: LatLng) => void;
}

export const ClinicLocationModal: React.FC<ClinicLocationModalProps> = ({
  open,
  onClose,
  selectedLocation,
  onLocationSelect,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (open && mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([11.049430, 124.005128], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);

      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = L.marker(e.latlng).addTo(mapRef.current!);
        }

        onLocationSelect({ lat, lng });
      });
    }

    if (open && mapRef.current && selectedLocation) {
      const { lat, lng } = selectedLocation;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
      }

      mapRef.current.setView([lat, lng], 15);
    }

    return () => {
      if (!open && mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open, selectedLocation, onLocationSelect]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Select Clinic Location</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl font-bold"
          >
            &times;
          </button>
        </div>
        <div ref={mapContainerRef} className="w-full h-[400px]" />
      </div>
    </div>
  );
};
