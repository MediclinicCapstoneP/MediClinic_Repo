import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, History, Heart, TrendingUp, Clock, Star, Users, Activity, Award, Shield, Phone, Mail, ExternalLink, X } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { clinicService, type ClinicProfile } from '../../features/auth/utils/clinicService';
import { SkeletonCard } from '../../components/ui/Skeleton';

// Mock data for nearby clinics
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

interface PatientHomeProps {
  onNavigate: (tab: string) => void;
}

type Step = 'home' | 'clinic-details' | 'book' | 'confirm';

const PatientHome: React.FC<PatientHomeProps> = ({ onNavigate }) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [clinics, setClinics] = useState<ClinicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState<Step>('home');
  const [selectedClinic, setSelectedClinic] = useState<ClinicProfile | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [paymentDone, setPaymentDone] = useState(false);

  const stats = [
    {
      title: 'Total Visits',
      value: '12',
      change: '+2',
      changeType: 'positive',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Upcoming',
      value: '2',
      change: 'This week',
      changeType: 'neutral',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Clinics Visited',
      value: '4',
      change: 'This year',
      changeType: 'neutral',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

const mockClinics: ClinicProfile[] = [
  {
    id: '1',
    user_id: 'mock-user-1',
    clinic_name: 'QuickCare Medical Center',
    email: 'info@quickcare.com',
    phone: '+1 234-567-8901',
    address: '123 Main Street',
    city: 'City Center',
    state: 'State',
    zip_code: '12345',
    specialties: ['General Medicine'],
    description: 'Fast and reliable general healthcare services.',
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'mock-user-2',
    clinic_name: 'Heart & Vascular Institute',
    email: 'contact@heartinstitute.com',
    phone: '+1 234-567-8902',
    address: '456 Health Avenue',
    city: 'Medical District',
    state: 'State',
    zip_code: '12346',
    specialties: ['Cardiology'],
    description: 'Expert heart and vascular care by top specialists.',
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];


  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoading(true);
        const result = await clinicService.getPublicClinics();
        if (result.success && result.clinics) {
          setClinics(result.clinics);
        } else {
          setClinics(mockClinics);
        }
      } catch (error) {
        setClinics(mockClinics);
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, []);

  const handleClinicClick = (clinicId: string | number) => {
    // For regular clinics (string ID)
    const clinic = clinics.find(c => c.id === clinicId);
    if (clinic) {
      setSelectedClinic(clinic);
      setStep('clinic-details');
      return;
    }
    
    // For nearby clinics (number ID)
    const nearbyClinic = mockNearbyClinics.find(c => c.id === clinicId);
    if (nearbyClinic) {
      // Convert nearby clinic to the format expected by the app
      const convertedClinic: ClinicProfile = {
        id: String(nearbyClinic.id),
        user_id: `nearby-${nearbyClinic.id}`,
        clinic_name: nearbyClinic.name,
        email: '',
        phone: nearbyClinic.phone || '',
        address: nearbyClinic.address,
        city: '',
        state: '',
        zip_code: '',
        specialties: nearbyClinic.specialties,
        description: nearbyClinic.description,
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setSelectedClinic(convertedClinic);
      setStep('clinic-details');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAddress = (clinic: ClinicProfile) => {
    const parts = [clinic.address, clinic.city, clinic.state, clinic.zip_code].filter(Boolean);
    return parts.join(', ');
  };

  const getSpecialization = (clinic: ClinicProfile) => {
    if (clinic.specialties && clinic.specialties.length > 0) {
      return clinic.specialties.join(', ');
    }
    if (clinic.custom_specialties && clinic.custom_specialties.length > 0) {
      return clinic.custom_specialties.join(', ');
    }
    return 'General Medicine';
  };

  const filteredClinics = clinics.filter(clinic => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      clinic.clinic_name.toLowerCase().includes(searchLower) ||
      (clinic.address && clinic.address.toLowerCase().includes(searchLower)) ||
      (clinic.city && clinic.city.toLowerCase().includes(searchLower)) ||
      (clinic.description && clinic.description.toLowerCase().includes(searchLower)) ||
      (clinic.specialties && clinic.specialties.some(s => s.toLowerCase().includes(searchLower))) ||
      (clinic.custom_specialties && clinic.custom_specialties.some(s => s.toLowerCase().includes(searchLower)))
    );
  });

  const renderClinicList = () => (
    <>
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder="Search clinics, specialties, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10"
            icon={<Search className="h-4 w-4 text-gray-400" />}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-500' : 'text-gray-500'}`}>{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-4">Available Clinic</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mockNearbyClinics.map((clinic) => (
          <Card key={clinic.id} className="hover:shadow-xl transition overflow-hidden">
            <div className="h-40 overflow-hidden">
              <img 
                src={clinic.image} 
                alt={clinic.name} 
                className="w-full h-full object-cover transition-transform hover:scale-105"
              />
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg line-clamp-2">{clinic.name}</h3>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs whitespace-nowrap ml-2">
                  {clinic.openNow ? '✓ Open Now' : 'Closed'}
                </span>
              </div>
              <div className="flex items-center mb-2">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-sm font-medium">{clinic.rating}</span>
                <span className="text-xs text-gray-500 ml-1">({clinic.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{clinic.address} • {clinic.distance}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Clock className="h-4 w-4 mr-1" />
                <span>{clinic.estimatedTime}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{clinic.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {clinic.specialties.slice(0, 3).map((specialty, index) => (
                  <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                    {specialty}
                  </span>
                ))}
              </div>
              <Button className="w-full" onClick={() => handleClinicClick(clinic.id)}>View Details</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-4">Available Clinics</h2>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {filteredClinics.map(clinic => (
    <div
      key={clinic.id}
      onClick={() => handleClinicClick(clinic.id)}
      className="cursor-pointer hover:shadow-xl transition rounded-2xl overflow-hidden"
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-lg">{clinic.clinic_name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(clinic.status)}`}>
              {clinic.status === 'approved' ? '✓ Verified' : clinic.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {clinic.description || getSpecialization(clinic)}
          </p>
          <p className="text-sm text-gray-500">{formatAddress(clinic)}</p>
        </CardContent>
      </Card>
    </div>
  ))}
</div>

      )}
    </>
  );

  const renderClinicDetails = (clinic: ClinicProfile) => {
    // Check if this is a nearby clinic (converted from mockNearbyClinics)
    const isNearbyClinic = clinic.user_id?.startsWith('nearby-');
    const nearbyClinicId = isNearbyClinic ? Number(clinic.user_id?.replace('nearby-', '')) : null;
    const nearbyClinic = nearbyClinicId ? mockNearbyClinics.find(c => c.id === nearbyClinicId) : null;
    
    return (
      <div className="space-y-6">
        {/* Header with image for nearby clinics */}
        {nearbyClinic && (
          <div className="h-64 rounded-xl overflow-hidden mb-6">
            <img 
              src={nearbyClinic.image} 
              alt={clinic.clinic_name} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">{clinic.clinic_name}</h2>
            <p className="text-gray-600 mb-2">{clinic.description || getSpecialization(clinic)}</p>
            <p className="text-sm text-gray-500 mb-4">{formatAddress(clinic)}</p>
          </div>
          
          {nearbyClinic && (
            <div className="text-right">
              <div className="flex items-center justify-end mb-2">
                <Star className="h-5 w-5 text-yellow-500 mr-1" />
                <span className="text-lg font-medium">{nearbyClinic.rating}</span>
                <span className="text-sm text-gray-500 ml-1">({nearbyClinic.reviewCount} reviews)</span>
              </div>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {nearbyClinic.openNow ? '✓ Open Now' : 'Closed'}
              </span>
            </div>
          )}
        </div>
        
        {/* Additional details for nearby clinics */}
        {nearbyClinic && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="space-y-2">
                  {nearbyClinic.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{nearbyClinic.phone}</span>
                    </div>
                  )}
                  {nearbyClinic.website && (
                    <div className="flex items-center">
                      <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
                      <a href={`https://${nearbyClinic.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {nearbyClinic.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{nearbyClinic.address} • {nearbyClinic.distance}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{nearbyClinic.estimatedTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {nearbyClinic.services.map((service, index) => (
                    <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="mt-6">
          <Button onClick={() => setStep('book')} className="mr-4">Book Appointment</Button>
          <Button variant="ghost" onClick={() => setStep('home')}>Back</Button>
        </div>
      </div>
    );
  };

  const renderBookingForm = (clinic: ClinicProfile) => (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Booking for {clinic.clinic_name}</h2>
      <div className="mb-3">
        <label className="text-sm">Choose Date</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="text-sm">Choose Time</label>
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="text-sm">Pay Booking Fee</label><br />
        <Button onClick={() => setPaymentDone(true)} disabled={paymentDone}>
          {paymentDone ? '✔ Fee Paid' : 'Pay Now'}
        </Button>
      </div>
      <Button onClick={() => {
        if (date && time && paymentDone) setStep('confirm');
        else alert('Please complete all fields and payment');
      }} className="mr-4">Confirm Booking</Button>
      <Button variant="ghost" onClick={() => setStep('clinic-details')}>Back</Button>
    </div>
  );

  const renderConfirmation = () => (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-green-600 mb-2">Appointment Confirmed!</h2>
      <p className="text-gray-600 mb-4">You will receive a booking notification soon.</p>
      <Button onClick={() => {
        setStep('home');
        setDate('');
        setTime('');
        setPaymentDone(false);
      }}>Return to Home</Button>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {step === 'home' && renderClinicList()}
      {step === 'clinic-details' && selectedClinic && renderClinicDetails(selectedClinic)}
      {step === 'book' && selectedClinic && renderBookingForm(selectedClinic)}
      {step === 'confirm' && renderConfirmation()}
    </div>
  );
};

export default PatientHome;
