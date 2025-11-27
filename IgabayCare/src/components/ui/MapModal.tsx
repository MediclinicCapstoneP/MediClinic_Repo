import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import { X, MapPin, Search } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (latitude: number, longitude: number, address?: string) => void;
  initialLatitude?: number;
  initialLongitude?: number;
  title?: string;
}

interface LocationMarkerProps {
  position: LatLng | null;
  setPosition: (position: LatLng | null) => void;
}

// Component to handle map clicks and marker placement
const LocationMarker: React.FC<LocationMarkerProps> = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
};

export const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLatitude = 11.049430, // Specified default location
  initialLongitude = 124.005128,
  title = "Select Clinic Location"
}) => {
  const [position, setPosition] = useState<LatLng | null>(
    new LatLng(initialLatitude, initialLongitude)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const mapRef = useRef<any>(null);

  // Reset position when modal opens and force map resize
  useEffect(() => {
    if (isOpen) {
      setPosition(new LatLng(initialLatitude, initialLongitude));
      setSearchQuery('');
      setSelectedAddress('');
      
      // Force map resize after modal is fully rendered
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 300);
    }
  }, [isOpen, initialLatitude, initialLongitude]);

  // Geocoding function using Nominatim (OpenStreetMap)
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=ph&limit=5`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        const newPosition = new LatLng(lat, lon);
        
        setPosition(newPosition);
        setSelectedAddress(result.display_name);
        
        // Pan map to new location
        if (mapRef.current) {
          mapRef.current.setView(newPosition, 15);
        }
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Error searching for location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setSelectedAddress(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Handle position change
  const handlePositionChange = (newPosition: LatLng | null) => {
    setPosition(newPosition);
    if (newPosition) {
      reverseGeocode(newPosition.lat, newPosition.lng);
    }
  };

  // Handle location confirmation
  const handleConfirmLocation = () => {
    if (position) {
      onLocationSelect(position.lat, position.lng, selectedAddress);
      onClose();
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition = new LatLng(latitude, longitude);
          setPosition(newPosition);
          reverseGeocode(latitude, longitude);
          
          if (mapRef.current) {
            mapRef.current.setView(newPosition, 15);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your current location. Please search for your location or click on the map.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Search for a location (e.g., Makati City, Manila)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              />
            </div>
            <Button
              onClick={searchLocation}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={getCurrentLocation}
              variant="outline"
              className="px-4"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-gray-100" style={{ height: '400px', minHeight: '400px' }}>
          {isOpen && (
            <MapContainer
              center={[initialLatitude, initialLongitude]}
              zoom={13}
              style={{ 
                height: '400px', 
                width: '100%', 
                zIndex: 1,
                position: 'relative'
              }}
              ref={mapRef}
              scrollWheelZoom={true}
              doubleClickZoom={true}
              dragging={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <LocationMarker position={position} setPosition={handlePositionChange} />
            </MapContainer>
          )}
        </div>

        {/* Selected Location Info */}
        {position && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-900">Selected Location:</span>
              </div>
              <div className="text-sm text-gray-600">
                <div>Latitude: {position.lat.toFixed(6)}</div>
                <div>Longitude: {position.lng.toFixed(6)}</div>
                {selectedAddress && (
                  <div className="mt-1">
                    <span className="font-medium">Address: </span>
                    {selectedAddress}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Click on the map to select your clinic's location
          </p>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLocation}
              disabled={!position}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirm Location
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
