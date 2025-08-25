import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, History, Heart, TrendingUp, Clock, Star, Users, Activity, Award, Shield, Phone, Mail, ExternalLink, X } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { clinicService, type ClinicProfile } from '../../features/auth/utils/clinicService';
import { SkeletonCard } from '../../components/ui/Skeleton';

// Default clinic image for clinics without uploaded images
const DEFAULT_CLINIC_IMAGE = 'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=400';

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




  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoading(true);
        console.log('Fetching clinics from Supabase...');
        const result = await clinicService.getPublicClinics();
        if (result.success && result.clinics) {
          console.log('Successfully fetched clinics:', result.clinics);
          setClinics(result.clinics);
        } else {
          console.error('Failed to fetch clinics:', result.error);
          setClinics([]);
        }
      } catch (error) {
        console.error('Error fetching clinics:', error);
        setClinics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, []);

  const handleClinicClick = (clinicId: string) => {
    const clinic = clinics.find(c => c.id === clinicId);
    if (clinic) {
      setSelectedClinic(clinic);
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

      <h2 className="text-xl font-bold mb-4">Available Clinics</h2>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredClinics.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="h-16 w-16 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Clinics Available</h3>
          <p className="text-gray-500">
            {searchTerm ? 'No clinics match your search criteria.' : 'No approved clinics are currently available for booking.'}
          </p>
          {searchTerm && (
            <Button 
              variant="ghost" 
              onClick={() => setSearchTerm('')}
              className="mt-4"
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClinics.map(clinic => (
            <div
              key={clinic.id}
              className="cursor-pointer transition-all duration-300 hover:scale-105"
              onClick={() => handleClinicClick(clinic.id)}
            >
              <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                {/* Clinic Image */}
                <div className="h-48 overflow-hidden">
                  <img 
                    src={DEFAULT_CLINIC_IMAGE} 
                    alt={clinic.clinic_name} 
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg line-clamp-2 flex-1">{clinic.clinic_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ml-2 ${getStatusColor(clinic.status)}`}>
                      {clinic.status === 'approved' ? '✓ Verified' : clinic.status}
                    </span>
                  </div>
                  
                  {/* Address */}
                  {formatAddress(clinic) && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="line-clamp-1">{formatAddress(clinic)}</span>
                    </div>
                  )}
                  
                  {/* Phone */}
                  {clinic.phone && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Phone className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span>{clinic.phone}</span>
                    </div>
                  )}
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {clinic.description || getSpecialization(clinic)}
                  </p>
                  
                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(clinic.specialties || []).slice(0, 3).map((specialty, index) => (
                      <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                        {specialty}
                      </span>
                    ))}
                    {(clinic.custom_specialties || []).slice(0, 3 - (clinic.specialties || []).length).map((specialty, index) => (
                      <span key={`custom-${index}`} className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs">
                        {specialty}
                      </span>
                    ))}
                    {((clinic.specialties || []).length + (clinic.custom_specialties || []).length) > 3 && (
                      <span className="bg-gray-50 text-gray-700 px-2 py-1 rounded-full text-xs">
                        +{((clinic.specialties || []).length + (clinic.custom_specialties || []).length) - 3} more
                      </span>
                    )}
                  </div>
                  
                  <Button className="w-full">
                    View Details & Book
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderClinicDetails = (clinic: ClinicProfile) => {
    return (
      <div className="space-y-6">
        {/* Header with clinic image */}
        <div className="h-64 rounded-xl overflow-hidden mb-6">
          <img 
            src={DEFAULT_CLINIC_IMAGE} 
            alt={clinic.clinic_name} 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-3">{clinic.clinic_name}</h2>
            <p className="text-lg text-gray-600 mb-3">{clinic.description || getSpecialization(clinic)}</p>
            <p className="text-sm text-gray-500 mb-4">{formatAddress(clinic)}</p>
            
            {/* Status Badge */}
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(clinic.status)}`}>
              {clinic.status === 'approved' ? '✓ Verified Clinic' : clinic.status}
            </span>
          </div>
        </div>
        
        {/* Clinic Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-blue-600" />
                Contact Information
              </h3>
              <div className="space-y-3">
                {clinic.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-3 text-gray-500" />
                    <span>{clinic.phone}</span>
                  </div>
                )}
                {clinic.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-3 text-gray-500" />
                    <span>{clinic.email}</span>
                  </div>
                )}
                {clinic.website && (
                  <div className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-3 text-gray-500" />
                    <a 
                      href={clinic.website.startsWith('http') ? clinic.website : `https://${clinic.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      {clinic.website}
                    </a>
                  </div>
                )}
                {formatAddress(clinic) && (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-3 text-gray-500 mt-0.5" />
                    <span>{formatAddress(clinic)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-green-600" />
                Specialties & Services
              </h3>
              <div className="space-y-3">
                {/* Standard Specialties */}
                {(clinic.specialties && clinic.specialties.length > 0) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Medical Specialties:</p>
                    <div className="flex flex-wrap gap-2">
                      {clinic.specialties.map((specialty, index) => (
                        <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Custom Specialties */}
                {(clinic.custom_specialties && clinic.custom_specialties.length > 0) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Custom Specialties:</p>
                    <div className="flex flex-wrap gap-2">
                      {clinic.custom_specialties.map((specialty, index) => (
                        <span key={index} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Services */}
                {(clinic.services && clinic.services.length > 0) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {clinic.services.map((service, index) => (
                        <span key={index} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Default if no specialties */}
                {(!clinic.specialties || clinic.specialties.length === 0) && 
                 (!clinic.custom_specialties || clinic.custom_specialties.length === 0) && (
                  <div className="text-gray-500 text-sm">General medical services available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Additional Information */}
        {(clinic.license_number || clinic.accreditation || clinic.year_established) && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-indigo-600" />
                Credentials & Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {clinic.license_number && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">License Number</p>
                    <p className="text-sm text-gray-600">{clinic.license_number}</p>
                  </div>
                )}
                {clinic.accreditation && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Accreditation</p>
                    <p className="text-sm text-gray-600">{clinic.accreditation}</p>
                  </div>
                )}
                {clinic.year_established && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Established</p>
                    <p className="text-sm text-gray-600">{clinic.year_established}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-6">
          <Button 
            onClick={() => setStep('book')} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Book Appointment
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setStep('home')}
            className="px-8 py-3 text-lg"
          >
            Back to Clinics
          </Button>
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
