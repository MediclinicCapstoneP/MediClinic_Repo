import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Navigation, Phone, Star, Route, Locate } from 'lucide-react';
import { Modal } from '../ui/Modal';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
    averageRating?: number;
    estimatedPrice?: number;
  };
}

export const ClinicMapModal: React.FC<ClinicMapModalProps> = ({
  isOpen,
  onClose,
  clinic
}) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showRouting, setShowRouting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; instructions?: any[] } | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const routingControlRef = useRef<any>(null);

  // Use specified default coordinates instead of Manila
  const clinicLat = clinic.latitude || 11.049430;
  const clinicLng = clinic.longitude || 124.005128;
  const fullAddress = [clinic.address, clinic.city, clinic.state].filter(Boolean).join(', ');

  // Initialize map when modal opens
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Create new map instance
    mapInstanceRef.current = L.map(mapContainerRef.current).setView([clinicLat, clinicLng], 15);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    // Create marker group
    markerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);

    // Add clinic marker
    const clinicIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/1484/1484865.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
    
    const clinicMarker = L.marker([clinicLat, clinicLng], { icon: clinicIcon })
      .bindPopup(`<div class="font-semibold">${clinic.clinic_name}</div><div class="text-sm">${fullAddress}</div>`)
      .openPopup();
    
    markerGroupRef.current.addLayer(clinicMarker);

    // Cleanup function
    return () => {
      if (routingControlRef.current) {
        mapInstanceRef.current?.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, clinicLat, clinicLng, clinic.clinic_name, fullAddress]);

  // Handle routing when user location and routing state changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markerGroupRef.current || !userLocation) return;

    // Remove existing user marker and routing
    if (routingControlRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }
    
    // Clear route info if routing is disabled
    if (!showRouting) {
      setRouteInfo(null);
    }

    // Clear and re-add clinic marker
    markerGroupRef.current.clearLayers();
    
    const clinicIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/1484/1484865.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
    
    const clinicMarker = L.marker([clinicLat, clinicLng], { icon: clinicIcon })
      .bindPopup(`<div class="font-semibold">${clinic.clinic_name}</div><div class="text-sm">${fullAddress}</div>`);
    markerGroupRef.current.addLayer(clinicMarker);

    // Add user marker
    const userIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/64/64113.png',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28]
    });
    
    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .bindPopup('<div class="font-semibold">Your Location</div>');
    markerGroupRef.current.addLayer(userMarker);

    // Add routing if requested
    if (showRouting) {
      routingControlRef.current = L.Routing.control({
        waypoints: [
          L.latLng(userLocation.lat, userLocation.lng),
          L.latLng(clinicLat, clinicLng),
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        createMarker: () => null, // Don't create additional markers
        show: false, // Hide the instruction panel
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'driving', // Use driving profile for road routing
        }),
        lineOptions: {
          styles: [{ 
            color: '#3B82F6', 
            weight: 6, 
            opacity: 0.9,
            dashArray: '10, 5' // Dashed line for better visibility
          }],
          extendToWaypoints: true,
          missingRouteTolerance: 10,
        },
        formatter: new L.Routing.Formatter({
          language: 'en',
          units: 'metric'
        })
      })
        .on('routesfound', (e: any) => {
          const route = e.routes[0];
          const summary = route.summary;
          const distanceKm = (summary.totalDistance / 1000).toFixed(1);
          const durationMin = Math.round(summary.totalTime / 60);
          setRouteInfo({ 
            distance: `${distanceKm} km`, 
            duration: `${durationMin} min`,
            instructions: route.instructions || []
          });
        })
        .on('routingerror', (e: any) => {
          console.warn('Routing error:', e.error);
          setRouteInfo({ 
            distance: 'Route not found', 
            duration: 'N/A',
            instructions: []
          });
        })
        .addTo(mapInstanceRef.current);
    }

    // Adjust map view to include both markers
    const group = new L.featureGroup([userMarker, clinicMarker]);
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
  }, [userLocation, showRouting, clinicLat, clinicLng, clinic.clinic_name, fullAddress]);

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsGettingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          alert('Location permission denied. Please allow location access to show directions.');
        } else {
          alert('Unable to get your location. Please check your location settings.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Google Maps directions URL for external navigation
  const getDirectionsUrl = () => {
    if (userLocation) {
      return `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${clinicLat},${clinicLng}`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(fullAddress)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{clinic.clinic_name}</h2>
              <p className="text-sm text-gray-600">Interactive Location & Directions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[600px]">
          {/* Interactive Map Section */}
          <div className="flex-1 relative">
            <div
              ref={mapContainerRef}
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            />
            
            {/* Map Controls Overlay - Only Location Button */}
            <div className="absolute top-4 right-4 space-y-2">
              {!userLocation && (
                <button
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="flex items-center space-x-2 bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  title="Get my location for directions"
                >
                  <Locate className={`h-5 w-5 text-blue-600 ${isGettingLocation ? 'animate-spin' : ''}`} />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold text-gray-700">
                      {isGettingLocation ? 'Finding...' : 'My Location'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {isGettingLocation ? 'Please wait' : 'Enable GPS tracking'}
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Route Info */}
            {routeInfo && (
              <div className="absolute bottom-4 left-4 bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
                <div className="flex items-center space-x-4 text-sm mb-2">
                  <div className="flex items-center space-x-1">
                    <Route className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900">{routeInfo.distance}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Navigation className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-gray-900">{routeInfo.duration}</span>
                  </div>
                </div>
                {showRouting && (
                  <div className="text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>Following roads and traffic rules</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clinic Info Panel */}
          <div className="lg:w-80 bg-gray-50 p-6 space-y-6 overflow-y-auto">
            {/* Route Control Button - Outside Map */}
            {userLocation && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-3">Navigation Controls</h4>
                <button
                  onClick={() => setShowRouting(!showRouting)}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border transition-all duration-300 ${
                    showRouting
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      : 'bg-white text-gray-800 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700'
                  }`}
                >
                  <Route className={`h-5 w-5 ${
                    showRouting ? 'text-white animate-pulse' : 'text-blue-600'
                  }`} />
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold">
                      {showRouting ? 'Hide Route' : 'Show Route'}
                    </span>
                    <span className={`text-xs ${
                      showRouting ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {showRouting ? 'Following roads' : 'Turn-by-turn directions'}
                    </span>
                  </div>
                </button>
                
                {/* Route Information Display */}
                {routeInfo && showRouting && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Route className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">{routeInfo.distance}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Navigation className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-blue-900">{routeInfo.duration}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-blue-700">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span>Route displayed on map</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Clinic Details */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Clinic Information</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Address</p>
                    <p className="text-sm text-gray-600">{fullAddress || 'Address not available'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {clinicLat.toFixed(6)}, {clinicLng.toFixed(6)}
                    </p>
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

                {(clinic.distance || clinic.averageRating || clinic.estimatedPrice) && (
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {clinic.distance && (
                      <div className="flex items-center space-x-2">
                        <Navigation className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-600">{clinic.distance.toFixed(1)} km away</span>
                      </div>
                    )}
                    {clinic.averageRating && (
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">{clinic.averageRating.toFixed(1)} rating</span>
                      </div>
                    )}
                    {clinic.estimatedPrice && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-green-600 font-medium">From ₱{clinic.estimatedPrice.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Location Status */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">Navigation Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${userLocation ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-gray-600">
                    {userLocation ? 'Your location detected' : 'Location not available'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${showRouting && routeInfo ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span className="text-gray-600">
                    {showRouting && routeInfo ? 'Route calculated' : 'No route displayed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => window.open(getDirectionsUrl(), '_blank')}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Navigation className="h-4 w-4" />
                <span>Open in Navigation App</span>
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
              <h4 className="font-medium text-blue-900 mb-2">Road Navigation Guide</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click "My Location" to enable GPS tracking</li>
                <li>• Use "Show Route" for turn-by-turn road directions</li>
                <li>• Routes follow actual roads and traffic rules</li>
                <li>• Distance and time estimates included</li>
                <li>• Use "Open in Navigation App" for voice guidance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
