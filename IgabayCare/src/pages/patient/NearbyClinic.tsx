import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Star, Clock, Phone, Globe, Filter, Search, Heart, Share2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

export const NearbyClinic: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [showOpenOnly, setShowOpenOnly] = useState(false);

  const mockNearbyClinics = [
    {
      id: 1,
      name: 'QuickCare Medical Center',
      address: '123 Main Street, Downtown',
      distance: '0.3 km',
      rating: 4.6,
      reviewCount: 127,
      estimatedTime: '5 min walk',
      specialties: ['General Medicine', 'Urgent Care', 'Pediatrics'],
      openNow: true,
      phone: '+1 (555) 123-4567',
      website: 'www.quickcare.com',
      image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Modern medical center providing comprehensive healthcare services with extended hours.',
      services: ['Walk-in Appointments', 'Telemedicine', 'Lab Services', 'Vaccinations']
    },
    {
      id: 2,
      name: 'Family Health Clinic',
      address: '456 Oak Avenue, Medical District',
      distance: '0.8 km',
      rating: 4.8,
      reviewCount: 89,
      estimatedTime: '10 min walk',
      specialties: ['Family Medicine', 'Pediatrics', 'Women\'s Health'],
      openNow: true,
      phone: '+1 (555) 234-5678',
      website: 'www.familyhealth.com',
      image: 'https://images.pexels.com/photos/4167541/pexels-photo-4167541.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Family-focused healthcare provider offering personalized care for all ages.',
      services: ['Family Planning', 'Child Care', 'Preventive Medicine', 'Chronic Disease Management']
    },
    {
      id: 3,
      name: 'Metro Wellness Center',
      address: '789 Health Boulevard, Wellness District',
      distance: '1.1 km',
      rating: 4.7,
      reviewCount: 156,
      estimatedTime: '15 min walk',
      specialties: ['Internal Medicine', 'Preventive Care', 'Mental Health'],
      openNow: false,
      phone: '+1 (555) 345-6789',
      website: 'www.metrowellness.com',
      image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Comprehensive wellness center focusing on preventive care and holistic health.',
      services: ['Health Screenings', 'Nutrition Counseling', 'Mental Health Services', 'Fitness Programs']
    },
    {
      id: 4,
      name: 'City General Hospital',
      address: '321 Medical Center Drive',
      distance: '1.5 km',
      rating: 4.5,
      reviewCount: 234,
      estimatedTime: '20 min walk',
      specialties: ['Emergency Medicine', 'Surgery', 'Cardiology'],
      openNow: true,
      phone: '+1 (555) 456-7890',
      website: 'www.citygeneral.com',
      image: 'https://images.pexels.com/photos/247786/pexels-photo-247786.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Full-service hospital providing emergency care and specialized medical services.',
      services: ['Emergency Care', 'Surgical Procedures', 'Specialized Treatments', '24/7 Care']
    }
  ];

  const specialties = ['all', 'General Medicine', 'Pediatrics', 'Urgent Care', 'Family Medicine', 'Internal Medicine', 'Emergency Medicine'];

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

  const filteredClinics = mockNearbyClinics.filter(clinic => {
    const matchesSearch = clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clinic.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clinic.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSpecialty = selectedSpecialty === 'all' || clinic.specialties.includes(selectedSpecialty);
    const matchesOpenStatus = !showOpenOnly || clinic.openNow;
    
    return matchesSearch && matchesSpecialty && matchesOpenStatus;
  });

  const handleBookAppointment = (clinicId: number) => {
    // TODO: Implement booking functionality
    console.log('Booking appointment for clinic:', clinicId);
  };

  const handleGetDirections = (clinic: any) => {
    // TODO: Implement directions functionality
    console.log('Getting directions to:', clinic.name);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nearby Clinics</h1>
        <p className="text-gray-600">Find healthcare providers close to your location</p>
      </div>

      {/* Location Card */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <MapPin className="text-blue-600" size={24} />
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
            <Button 
              onClick={getCurrentLocation} 
              loading={loading}
              variant="gradient"
              className="bg-gradient-primary"
            >
              <Navigation size={16} className="mr-2" />
              Get Location
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search clinics, specialties, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={20} className="text-gray-400" />}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>
                  {specialty === 'all' ? 'All Specialties' : specialty}
                </option>
              ))}
            </select>
            <Button
              variant={showOpenOnly ? "gradient" : "outline"}
              onClick={() => setShowOpenOnly(!showOpenOnly)}
              className="flex items-center gap-2"
            >
              <Clock size={16} />
              Open Now
            </Button>
          </div>
        </div>
      </div>

      {/* Map Placeholder */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="h-80 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
            <div className="text-center relative z-10">
              <div className="p-4 bg-white/80 backdrop-blur-sm rounded-full w-fit mx-auto mb-4">
                <MapPin size={48} className="text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Map View</h3>
              <p className="text-gray-600 mb-2">See clinics on the map</p>
              <p className="text-sm text-gray-500">Map integration with Google Maps API</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Clinics Near You ({filteredClinics.length})
        </h2>
        <div className="text-sm text-gray-500">
          Sorted by distance
        </div>
      </div>

      {/* Nearby Clinics List */}
      <div className="space-y-4">
        {filteredClinics.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No clinics found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or location</p>
            </CardContent>
          </Card>
        ) : (
          filteredClinics.map((clinic) => (
            <Card key={clinic.id} hover className="overflow-hidden border border-gray-200 hover:border-primary-300 transition-all duration-200">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0">
                    <img
                      src={clinic.image}
                      alt={clinic.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between h-full">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{clinic.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center">
                                <MapPin size={14} className="mr-1" />
                                {clinic.address}
                              </div>
                              <div className="flex items-center">
                                <Navigation size={14} className="mr-1" />
                                {clinic.distance} • {clinic.estimatedTime}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                              <Heart size={16} />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                              <Share2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center">
                            <Star size={16} className="text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">{clinic.rating}</span>
                            <span className="text-sm text-gray-500 ml-1">({clinic.reviewCount} reviews)</span>
                          </div>
                          {clinic.openNow ? (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center">
                              <Clock size={12} className="mr-1" />
                              Open Now
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full flex items-center">
                              <Clock size={12} className="mr-1" />
                              Closed
                            </span>
                          )}
                        </div>

                        <p className="text-gray-600 mb-3">{clinic.description}</p>

                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Specialties:</h4>
                          <div className="flex flex-wrap gap-2">
                            {clinic.specialties.map((specialty, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Phone size={14} className="mr-1" />
                            {clinic.phone}
                          </div>
                          <div className="flex items-center">
                            <Globe size={14} className="mr-1" />
                            {clinic.website}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-3 mt-4 md:mt-0 md:ml-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGetDirections(clinic)}
                          className="flex items-center justify-center"
                        >
                          <Navigation size={14} className="mr-2" />
                          Directions
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleBookAppointment(clinic.id)}
                          className="flex items-center justify-center"
                        >
                          Book Appointment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}; 