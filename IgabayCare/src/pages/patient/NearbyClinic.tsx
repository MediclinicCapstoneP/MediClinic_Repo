import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Star, Clock, Phone, Globe, Filter, Search, Heart, Share2, List, Grid } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ClinicMap } from '../../components/patient/ClinicMap';
import { BookAppointment } from '../../components/patient/BookAppointment';

export const NearbyClinic: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [hoveredClinic, setHoveredClinic] = useState<number | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showRouting, setShowRouting] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedClinicForBooking, setSelectedClinicForBooking] = useState<{ id: string; name: string } | null>(null);

  const mockNearbyClinics = [
    {
      id: 1,
      name: 'OASIS DIAGNOSTIC & LABORATORY CENTER',
      address: 'Bogo City, Cebu',
      lat: 11.048747,
      lng: 124.003222,
      distance: '0.3 km',
      rating: 4.6,
      reviewCount: 127,
      estimatedTime: '5 min walk',
      specialties: ['Laboratory Services', 'Diagnostic Tests', 'Blood Tests'],
      openNow: true,
      phone: '+63 (555) 123-4567',
      website: 'www.oasisdiagnostic.com',
      image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Comprehensive diagnostic and laboratory services with modern equipment.',
      services: ['Blood Tests', 'Urinalysis', 'X-Ray', 'ECG', 'Ultrasound']
    },
    {
      id: 2,
      name: 'Bogo Clinical Laboratory',
      address: 'Bogo City, Cebu',
      lat: 11.048754,
      lng: 124.001291,
      distance: '0.8 km',
      rating: 4.8,
      reviewCount: 89,
      estimatedTime: '10 min walk',
      specialties: ['Clinical Laboratory', 'Medical Tests', 'Health Screening'],
      openNow: true,
      phone: '+63 (555) 234-5678',
      website: 'www.bogoclinical.com',
      image: 'https://images.pexels.com/photos/4167541/pexels-photo-4167541.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Professional clinical laboratory services for accurate medical testing.',
      services: ['Complete Blood Count', 'Chemistry Tests', 'Microbiology', 'Immunology']
    },
    {
      id: 3,
      name: 'Verdida Optical Clinic',
      address: 'Bogo City, Cebu',
      lat: 11.048754,
      lng: 124.001291,
      distance: '1.1 km',
      rating: 4.7,
      reviewCount: 156,
      estimatedTime: '15 min walk',
      specialties: ['Optical Services', 'Eye Care', 'Vision Correction'],
      openNow: true,
      phone: '+63 (555) 345-6789',
      website: 'www.verdidoptical.com',
      image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Professional optical services for vision care and eyewear.',
      services: ['Eye Examinations', 'Contact Lens Fitting', 'Eyeglass Prescription', 'Vision Therapy']
    },
    {
      id: 4,
      name: 'Mayol Dental Clinic',
      address: 'Bogo City, Cebu',
      lat: 11.049110,
      lng: 124.004254,
      distance: '1.5 km',
      rating: 4.5,
      reviewCount: 234,
      estimatedTime: '20 min walk',
      specialties: ['Dental Care', 'Oral Surgery', 'Orthodontics'],
      openNow: true,
      phone: '+63 (555) 456-7890',
      website: 'www.mayoldental.com',
      image: 'https://images.pexels.com/photos/247786/pexels-photo-247786.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Comprehensive dental care services for all ages.',
      services: ['Dental Check-ups', 'Tooth Extraction', 'Root Canal', 'Dental Implants', 'Braces']
    }
  ];

  const specialties = [
    'all',
    'Laboratory Services',
    'Clinical Laboratory',
    'Optical Services',
    'Dental Care',
    'Diagnostic Tests',
    'Medical Tests'
  ];

  // Request user location on mount
  useEffect(() => {
    const getCurrentLocation = () => {
      setLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setLoading(false);
          },
          (error) => {
            console.error('Error getting location:', error);
            setLoading(false);
            if (error.code === error.PERMISSION_DENIED) {
              alert('Location permission denied. Please allow location to see nearby clinics.');
            } else {
              alert('Unable to get your location. Please enable location services.');
            }
          }
        );
      } else {
        setLoading(false);
        alert('Geolocation is not supported by this browser.');
      }
    };

    getCurrentLocation();
  }, []);

  const filteredClinics = mockNearbyClinics.filter((clinic) => {
    const matchesSearch =
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.specialties.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSpecialty = selectedSpecialty === 'all' || clinic.specialties.includes(selectedSpecialty);
    const matchesOpenStatus = !showOpenOnly || clinic.openNow;

    return matchesSearch && matchesSpecialty && matchesOpenStatus;
  });

  const handleBookAppointment = (clinicId: number) => {
    const clinic = mockNearbyClinics.find((c) => c.id === clinicId);
    if (clinic) {
      setSelectedClinicForBooking({
        id: clinicId.toString(),
        name: clinic.name
      });
      setBookingModalOpen(true);
    }
  };

  const handleGetDirections = (clinic: any) => {
    // TODO: Implement directions functionality
    console.log('Getting directions to:', clinic.name);
  };

  const handleClinicMapClick = (clinic: any) => {
    setSelectedClinic(clinic.id);
    const element = document.getElementById(`clinic-${clinic.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nearby Clinics</h1>
        <p className="text-gray-600">Find healthcare providers close to your location</p>
      </div>

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
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty === 'all' ? 'All Specialties' : specialty}
                </option>
              ))}
            </select>
            <Button
              variant={showOpenOnly ? 'gradient' : 'outline'}
              onClick={() => setShowOpenOnly(!showOpenOnly)}
              className="flex items-center gap-2"
            >
              <Clock size={16} />
              Open Now
            </Button>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Interactive Map View</h3>
              <p className="text-sm text-gray-600">Click on markers to see clinic details</p>
            </div>
            {userLocation && (
              <Button
                variant={showRouting ? 'gradient' : 'outline'}
                size="sm"
                onClick={() => setShowRouting(!showRouting)}
                className="flex items-center gap-2"
              >
                <Navigation size={16} />
                {showRouting ? 'Hide Route' : 'Show Route'}
              </Button>
            )}
          </div>
          <ClinicMap
            clinics={filteredClinics}
            userLocation={userLocation}
            onClinicClick={handleClinicMapClick}
            selectedClinicId={selectedClinic}
            showRouting={showRouting}
          />
        </CardContent>
      </Card>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Clinics Near You ({filteredClinics.length})
        </h2>
        <div className="text-sm text-gray-500">Sorted by distance</div>
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
            <div
              key={clinic.id}
              id={`clinic-${clinic.id}`}
              className={`transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                hoveredClinic === clinic.id ? 'ring-2 ring-primary-200' : ''
              } ${selectedClinic === clinic.id ? 'ring-2 ring-primary-500' : ''}`}
              onMouseEnter={() => setHoveredClinic(clinic.id)}
              onMouseLeave={() => setHoveredClinic(null)}
              onClick={() => setSelectedClinic(clinic.id)}
            >
              <Card className="overflow-hidden border border-gray-200 hover:border-primary-300 transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0 relative group overflow-hidden">
                      <img
                        src={clinic.image}
                        alt={clinic.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors">
                          <Heart size={16} className="text-red-500" />
                        </button>
                      </div>
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
            </div>
          ))
        )}
      </div>

      {/* Booking Appointment Modal */}
      {selectedClinicForBooking && (
        <BookAppointment
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          clinicId={selectedClinicForBooking.id}
          clinicName={selectedClinicForBooking.name}
        />
      )}
    </div>
  );
};
