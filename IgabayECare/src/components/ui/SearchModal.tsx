import React, { useState, useEffect } from 'react';
import { Search, X, MapPin, Star, Phone, Mail, Building, User } from 'lucide-react';
import { Button } from './Button';

interface Doctor {
  id: string;
  name: string;
  specialties: string[];
  image?: string;
  rating?: number;
  experience?: string;
  location?: string;
}

interface Clinic {
  id: string;
  name: string;
  location: string;
  specialties: string[];
  image?: string;
  rating?: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearch
}) => {
  const [query, setQuery] = useState(searchQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'doctors' | 'clinics'>('all');

  // Mock data - in production this would come from your API
  const mockDoctors: Doctor[] = [
    {
      id: '1',
      name: 'Dr. Roselo Alagase M.D',
      specialties: ['General Physician'],
      image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.8,
      experience: '15 years',
      location: 'Metro Manila'
    },
    {
      id: '2',
      name: 'Dr. Phoebe Katez Campasas MD',
      specialties: ['General Physician', 'Occupational Medicine'],
      image: 'https://images.pexels.com/photos/4167541/pexels-photo-4167541.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.6,
      experience: '12 years',
      location: 'Quezon City'
    },
    {
      id: '3',
      name: 'Dr. Arminda Veniegas MD',
      specialties: ['Obstetrics', 'Gynecology'],
      image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.9,
      experience: '20 years',
      location: 'Makati'
    },
    {
      id: '4',
      name: 'Dr. Giovanni Dangca, MD, DPCOM, MHM, MBA',
      specialties: ['Family Medicine', 'Occupational Medicine', 'General Physician'],
      image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.7,
      experience: '18 years',
      location: 'Taguig'
    },
    {
      id: '5',
      name: 'Dr. Jamila Camille Bongga MD',
      specialties: ['Pediatrics'],
      image: 'https://images.pexels.com/photos/4167541/pexels-photo-4167541.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.5,
      experience: '10 years',
      location: 'Pasig'
    },
    {
      id: '6',
      name: 'Dr. Leon James Young III MD, FPOA',
      specialties: ['Trauma Orthopedics', 'General Physician'],
      image: 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.8,
      experience: '22 years',
      location: 'Manila'
    }
  ];

  const mockClinics: Clinic[] = [
    {
      id: '1',
      name: 'Dr. Albert John Bromeo Clinic at Metro Antipolo Hospital and Medical Center',
      location: 'Mayamot, CITY OF ANTIPOLO, RIZAL, REGION IV-A (CALABARZON)',
      specialties: ['General Medicine', 'Emergency Care', 'Surgery'],
      image: 'https://images.pexels.com/photos/247786/pexels-photo-247786.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.6
    },
    {
      id: '2',
      name: 'QuickCare Medical Center',
      location: 'Downtown, Metro Manila',
      specialties: ['Urgent Care', 'General Medicine', 'Pediatrics'],
      image: 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.4
    },
    {
      id: '3',
      name: 'Family Health Clinic',
      location: 'Medical District, Quezon City',
      specialties: ['Family Medicine', 'Pediatrics', 'Women\'s Health'],
      image: 'https://images.pexels.com/photos/4167541/pexels-photo-4167541.jpeg?auto=compress&cs=tinysrgb&w=100',
      rating: 4.7
    }
  ];

  const filteredDoctors = mockDoctors.filter(doctor =>
    doctor.name.toLowerCase().includes(query.toLowerCase()) ||
    doctor.specialties.some(specialty => 
      specialty.toLowerCase().includes(query.toLowerCase())
    )
  );

  const filteredClinics = mockClinics.filter(clinic =>
    clinic.name.toLowerCase().includes(query.toLowerCase()) ||
    clinic.specialties.some(specialty => 
      specialty.toLowerCase().includes(query.toLowerCase())
    )
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    // TODO: Navigate to doctor profile or booking page
    console.log('Selected doctor:', doctor);
  };

  const handleClinicSelect = (clinic: Clinic) => {
    // TODO: Navigate to clinic profile or booking page
    console.log('Selected clinic:', clinic);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Search Results</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search doctors, clinics, specialties..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'all' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({filteredDoctors.length + filteredClinics.length})
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'doctors' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Doctors ({filteredDoctors.length})
          </button>
          <button
            onClick={() => setActiveTab('clinics')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'clinics' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Clinics ({filteredClinics.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {(activeTab === 'all' || activeTab === 'doctors') && filteredDoctors.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctors</h3>
              <div className="space-y-4">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() => handleDoctorSelect(doctor)}
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      {doctor.image ? (
                        <img
                          src={doctor.image}
                          alt={doctor.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User size={24} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{doctor.name}</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        {doctor.specialties.join(', ')}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {doctor.rating && (
                          <div className="flex items-center">
                            <Star size={14} className="text-yellow-400 mr-1" />
                            <span>{doctor.rating}</span>
                          </div>
                        )}
                        {doctor.experience && (
                          <span>{doctor.experience} experience</span>
                        )}
                        {doctor.location && (
                          <div className="flex items-center">
                            <MapPin size={14} className="mr-1" />
                            <span>{doctor.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Book Appointment
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'clinics') && filteredClinics.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinics</h3>
              <div className="space-y-4">
                {filteredClinics.map((clinic) => (
                  <div
                    key={clinic.id}
                    onClick={() => handleClinicSelect(clinic)}
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {clinic.image ? (
                        <img
                          src={clinic.image}
                          alt={clinic.name}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <Building size={24} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{clinic.name}</h4>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <MapPin size={14} className="mr-1" />
                        <span className="truncate">{clinic.location}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {clinic.specialties.join(', ')}
                      </p>
                      {clinic.rating && (
                        <div className="flex items-center">
                          <Star size={14} className="text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-600">{clinic.rating}</span>
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredDoctors.length === 0 && filteredClinics.length === 0 && (
            <div className="text-center py-12">
              <Search size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try adjusting your search terms or browse our categories</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 