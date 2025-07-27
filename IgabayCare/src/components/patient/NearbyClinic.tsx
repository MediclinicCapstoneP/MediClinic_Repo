import React, { useState } from 'react';
import { MapPin, Navigation, Star, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

export const NearbyClinic: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const mockNearbyClinics = [
    {
      id: 1,
      name: 'QuickCare Medical Center',
      address: '2 blocks away',
      distance: '0.3 km',
      rating: 4.6,
      estimatedTime: '5 min walk',
      specialties: ['General Medicine', 'Urgent Care'],
      openNow: true,
      image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 2,
      name: 'Family Health Clinic',
      address: '5th Street Medical Plaza',
      distance: '0.8 km',
      rating: 4.8,
      estimatedTime: '10 min walk',
      specialties: ['Family Medicine', 'Pediatrics'],
      openNow: true,
      image: 'https://images.pexels.com/photos/4167541/pexels-photo-4167541.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 3,
      name: 'Metro Wellness Center',
      address: 'Downtown Medical Building',
      distance: '1.1 km',
      rating: 4.7,
      estimatedTime: '15 min walk',
      specialties: ['Internal Medicine', 'Preventive Care'],
      openNow: false,
      image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
  ];

  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      setLoading(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nearby Clinics</h1>
      </div>

      {/* Location Card */}
      <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <MapPin className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Location</h3>
                {userLocation ? (
                  <p className="text-gray-700">Location detected successfully</p>
                ) : (
                  <p className="text-gray-600">Click to detect your current location</p>
                )}
              </div>
            </div>
            <Button onClick={getCurrentLocation} loading={loading}>
              <Navigation size={16} className="mr-2" />
              Get Location
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="h-64 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <MapPin size={48} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Interactive Map View</p>
              <p className="text-sm text-gray-500">Map integration with Google Maps API</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Clinics List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Clinics Near You</h2>
        
        {mockNearbyClinics.map((clinic) => (
          <Card key={clinic.id} hover className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={clinic.image}
                    alt={clinic.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{clinic.name}</h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          {clinic.address}
                        </div>
                        <div className="flex items-center">
                          <Navigation size={14} className="mr-1" />
                          {clinic.distance} • {clinic.estimatedTime}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star size={14} className="text-yellow-400 mr-1" />
                          <span className="text-sm font-medium">{clinic.rating}</span>
                        </div>
                        {clinic.openNow ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            <Clock size={10} className="inline mr-1" />
                            Open
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            <Clock size={10} className="inline mr-1" />
                            Closed
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button variant="outline" size="sm">
                        Directions
                      </Button>
                      <Button size="sm">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};