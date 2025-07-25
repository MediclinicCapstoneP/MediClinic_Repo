import React, { useState } from 'react';
import { Search, MapPin, Star, Clock, Phone } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

export const SearchClinics: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  const specialties = [
    'All Specialties',
    'General Medicine',
    'Pediatrics',
    'Cardiology',
    'Dermatology',
    'Orthopedics',
    'Psychiatry',
    'Gynecology',
  ];

  const mockClinics = [
    {
      id: 1,
      name: 'City General Hospital',
      address: '123 Main Street, Downtown',
      rating: 4.8,
      distance: '1.2 km',
      specialties: ['General Medicine', 'Emergency Care'],
      openNow: true,
      phone: '+1 234-567-8900',
      image: 'https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 2,
      name: 'Heart Care Center',
      address: '456 Oak Avenue, Medical District',
      rating: 4.9,
      distance: '2.1 km',
      specialties: ['Cardiology', 'Vascular Surgery'],
      openNow: true,
      phone: '+1 234-567-8901',
      image: 'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 3,
      name: 'Pediatric Care Clinic',
      address: '789 Pine Street, Family District',
      rating: 4.7,
      distance: '3.5 km',
      specialties: ['Pediatrics', 'Family Medicine'],
      openNow: false,
      phone: '+1 234-567-8902',
      image: 'https://images.pexels.com/photos/305568/pexels-photo-305568.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Clinics</h1>
        <p className="text-gray-600">Find the right healthcare provider for your needs</p>
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            placeholder="Search by clinic name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={20} className="text-gray-400" />}
          />
          
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>

          <Button>
            <Search size={16} className="mr-2" />
            Search
          </Button>
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {mockClinics.map((clinic) => (
          <Card key={clinic.id} hover className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-48 h-48 md:h-auto">
                  <img
                    src={clinic.image}
                    alt={clinic.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{clinic.name}</h3>
                    <div className="flex items-center space-x-2">
                      {clinic.openNow ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <Clock size={12} className="inline mr-1" />
                          Open Now
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                          <Clock size={12} className="inline mr-1" />
                          Closed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <MapPin size={16} className="mr-1" />
                      {clinic.address}
                    </div>
                    <div className="flex items-center">
                      <Star size={16} className="mr-1 text-yellow-400" />
                      {clinic.rating} ({clinic.distance})
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {clinic.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone size={16} className="mr-1" />
                      {clinic.phone}
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button size="sm">
                        Book Appointment
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