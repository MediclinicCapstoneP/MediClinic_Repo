import React, { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Phone, Star } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface ClinicMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: {
    id: string;
    clinic_name: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
    rating?: number;
    distance?: number;
  };
}

export const ClinicMapModal: React.FC<ClinicMapModalProps> = ({
  isOpen,
  onClose,
  clinic
}) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get user's current location
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Could not get user location:', error);
        }
      );
    }
  }, [isOpen]);

  const clinicLat = clinic.latitude || 14.5995; // Default to Manila if no coordinates
  const clinicLng = clinic.longitude || 120.9842;
  const fullAddress = [clinic.address, clinic.city, clinic.state].filter(Boolean).join(', ');

  // Google Maps directions URL
  const getDirectionsUrl = () => {
    if (userLocation) {
      return `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${clinicLat},${clinicLng}`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`;
  };

  // Alternative: OpenStreetMap with Leaflet (no API key required)
  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${clinicLng-0.01},${clinicLat-0.01},${clinicLng+0.01},${clinicLat+0.01}&layer=mapnik&marker=${clinicLat},${clinicLng}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{clinic.clinic_name}</h2>
              <p className="text-sm text-gray-600">Clinic Location & Directions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[600px]">
          {/* Map Section */}
          <div className="flex-1 relative">
            <iframe
              src={openStreetMapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setMapLoaded(true)}
              className="w-full h-full"
            />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
          </div>

          {/* Clinic Info Panel */}
          <div className="lg:w-80 bg-gray-50 p-6 space-y-6 overflow-y-auto">
            {/* Clinic Details */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Clinic Information</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Address</p>
                    <p className="text-sm text-gray-600">{fullAddress}</p>
                  </div>
                </div>

                {clinic.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <a 
                        href={`tel:${clinic.phone}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {clinic.phone}
                      </a>
                    </div>
                  </div>
                )}

                {clinic.distance && (
                  <div className="flex items-center space-x-3">
                    <Navigation className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Distance</p>
                      <p className="text-sm text-gray-600">{clinic.distance.toFixed(1)} km away</p>
                    </div>
                  </div>
                )}

                {clinic.rating && (
                  <div className="flex items-center space-x-3">
                    <Star className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Rating</p>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-600">{clinic.rating.toFixed(1)}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= clinic.rating!
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => window.open(getDirectionsUrl(), '_blank')}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Navigation className="h-4 w-4" />
                <span>Get Directions</span>
              </button>

              <button
                onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`, '_blank')}
                className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                <span>View in Google Maps</span>
              </button>

              {clinic.phone && (
                <button
                  onClick={() => window.open(`tel:${clinic.phone}`, '_self')}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call Clinic</span>
                </button>
              )}
            </div>

            {/* Map Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Map Instructions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click "Get Directions" for turn-by-turn navigation</li>
                <li>• Click "View in Google Maps" to open in the Maps app</li>
                <li>• Use your device's GPS for accurate location tracking</li>
              </ul>
            </div>

            {/* Alternative Map Provider Note */}
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Note:</strong> Map powered by OpenStreetMap. For enhanced features and real-time traffic, 
                use "View in Google Maps" or "Get Directions" buttons.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
