import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building, Eye, EyeOff, AlertCircle, CheckCircle, Upload, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../../components/ui/Card';
import { roleBasedAuthService } from '../utils/roleBasedAuthService';
import ClinicMap from '../../../components/patient/ClinicMap';
interface ClinicSignUpFormProps {
  onSuccess?: () => void;
}

export const ClinicSignUpForm: React.FC<ClinicSignUpFormProps> = ({ onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [clinicLocation, setClinicLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Form data with localStorage persistence
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('clinicSignUpData');
    return saved
      ? JSON.parse(saved)
      : {
          // Step 1: Basic Information
          clinic_name: '',
          email: '',
          password: '',
          confirmPassword: '',

          // Step 2: Contact Information
          phone: '',
          website: '',
          address: '',
          city: '',
          state: '',
          zip_code: '',

          // Step 3: Medical Specialties
          specialties: [],
          custom_specialties: [],

          // Step 4: Medical Services
          services: [],
          custom_services: [],

          // Step 5: Business Information
          license_number: '',
          accreditation: '',
          tax_id: '',
          year_established: '',
          number_of_doctors: '',
          number_of_staff: '',
          description: '',

          // Step 6: Operating Hours
          operating_hours: {
            monday: { open: '08:00', close: '18:00' },
            tuesday: { open: '08:00', close: '18:00' },
            wednesday: { open: '08:00', close: '18:00' },
            thursday: { open: '08:00', close: '18:00' },
            friday: { open: '08:00', close: '18:00' },
            saturday: { open: '09:00', close: '16:00' },
            sunday: { open: '10:00', close: '14:00' },
          },
        };
  });

  // Persist form data
  useEffect(() => {
    localStorage.setItem('clinicSignUpData', JSON.stringify(formData));
  }, [formData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const result = await roleBasedAuthService.clinic.signUp({
        clinic_name: formData.clinic_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zip_code: formData.zip_code || undefined,
        license_number: formData.license_number || undefined,
        accreditation: formData.accreditation || undefined,
        tax_id: formData.tax_id || undefined,
        year_established: formData.year_established ? parseInt(formData.year_established) : undefined,
        specialties: formData.specialties,
        custom_specialties: formData.custom_specialties,
        services: formData.services,
        custom_services: formData.custom_services,
        operating_hours: formData.operating_hours,
        number_of_doctors: formData.number_of_doctors ? parseInt(formData.number_of_doctors) : undefined,
        number_of_staff: formData.number_of_staff ? parseInt(formData.number_of_staff) : undefined,
        description: formData.description || undefined,
        location: clinicLocation || undefined, // include location if selected
      });

      if (result.success) {
        setSuccess(true);
        localStorage.removeItem('clinicSignUpData');
        setTimeout(() => {
          navigate('/clinic-signin');
          onSuccess?.();
        }, 3000);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFormData = () => {
    localStorage.removeItem('clinicSignUpData');
    setFormData({
      clinic_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      specialties: [],
      custom_specialties: [],
      services: [],
      custom_services: [],
      license_number: '',
      accreditation: '',
      tax_id: '',
      year_established: '',
      number_of_doctors: '',
      number_of_staff: '',
      description: '',
      operating_hours: {
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
        saturday: { open: '09:00', close: '16:00' },
        sunday: { open: '10:00', close: '14:00' },
      },
    });
    setClinicLocation(null);
    setCurrentStep(1);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            We've sent a verification email to {formData.email}. Please check your email and click the verification link to complete your clinic registration.
          </p>
          <Button
            onClick={() => roleBasedAuthService.resendVerificationEmail(formData.email)}
            variant="outline"
            className="mr-2"
          >
            Resend Verification Email
          </Button>
          <Button onClick={() => navigate('/clinic-signin')} variant="gradient">
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ClinicMap
        open={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        selectedLocation={clinicLocation}
        onLocationSelect={(location) => {
          setClinicLocation(location);
          setIsMapOpen(false);
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
              <Building className="h-8 w-8 text-secondary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Register Your Clinic</h1>
            <p className="text-gray-600">Join our healthcare platform and start managing your clinic</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= currentStep ? 'bg-secondary-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 6 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        step < currentStep ? 'bg-secondary-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Basic Info</span>
              <span>Contact</span>
              <span>Specialties</span>
              <span>Services</span>
              <span>Business</span>
              <span>Hours</span>
            </div>
          </div>

          <Card className="bg-white shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Step {currentStep} of 6:{' '}
                {currentStep === 1
                  ? 'Basic Information'
                  : currentStep === 2
                  ? 'Contact Information'
                  : currentStep === 3
                  ? 'Medical Specialties'
                  : currentStep === 4
                  ? 'Medical Services'
                  : currentStep === 5
                  ? 'Business Information'
                  : 'Operating Hours'}
              </h3>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <div className="flex items-center space-x-2">
                    <AlertCircle size={20} className="text-red-600" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <Input
                      label="Clinic Name"
                      value={formData.clinic_name}
                      onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                      required
                      disabled={isLoading}
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      disabled={isLoading}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Input
                          label="Password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="relative">
                        <Input
                          label="Confirm Password"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {formData.password &&
                      formData.confirmPassword &&
                      formData.password !== formData.confirmPassword && (
                        <p className="text-red-600 text-sm">Passwords do not match</p>
                      )}
                  </div>
                )}

                {/* Step 2: Contact Information */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={isLoading}
                      />
                      <Input
                        label="Website"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <Input
                      label="Address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={isLoading}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="City"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        disabled={isLoading}
                      />
                      <Input
                        label="State"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        disabled={isLoading}
                      />
                      <Input
                        label="ZIP Code"
                        value={formData.zip_code}
                        onChange={(e) => handleInputChange('zip_code', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Location selector */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clinic Location
                      </label>
                      <div className="flex items-center space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsMapOpen(true)}
                          disabled={isLoading}
                        >
                          Select Clinic Location
                        </Button>
                        {clinicLocation && (
                          <div className="text-sm text-gray-700">
                            Selected: {clinicLocation.lat.toFixed(6)}, {clinicLocation.lng.toFixed(6)}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        This location will help patients find your clinic on the map.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 3: Medical Specialties */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Medical Specialties
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          'Cardiology',
                          'Dermatology',
                          'Neurology',
                          'Orthopedics',
                          'Pediatrics',
                          'Psychiatry',
                          'Internal Medicine',
                          'Family Medicine',
                          'Emergency Medicine',
                          'Surgery',
                          'Obstetrics & Gynecology',
                          'Ophthalmology',
                          'ENT (Ear, Nose, Throat)',
                          'Radiology',
                          'Anesthesiology',
                          'Pathology',
                          'Oncology',
                          'Endocrinology',
                          'Gastroenterology',
                          'Pulmonology',
                          'Nephrology',
                          'Rheumatology',
                          'Infectious Disease',
                          'Physical Medicine',
                        ].map((specialty) => (
                          <label key={specialty} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.specialties.includes(specialty)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleInputChange('specialties', [...formData.specialties, specialty]);
                                } else {
                                  handleInputChange(
                                    'specialties',
                                    formData.specialties.filter((s: string) => s !== specialty)
                                  );
                                }
                              }}
                              className="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                            />
                            <span className="text-sm text-gray-700">{specialty}</span>
                          </label>
                        ))}
                      </div>
                      <Input
                        label="Other Specialties (comma-separated)"
                        value={formData.custom_specialties.join(', ')}
                        onChange={(e) =>
                          handleInputChange(
                            'custom_specialties',
                            e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter((s) => s)
                          )
                        }
                        placeholder="e.g., Sports Medicine, Geriatrics"
                        disabled={isLoading}
                        className="mt-4"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Medical Services */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Medical Services Offered
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          'General Consultation',
                          'Vaccination',
                          'Physical Therapy',
                          'Laboratory Tests',
                          'Imaging (X-Ray, MRI, CT)',
                          'Surgery',
                          'Emergency Care',
                          'Preventive Care',
                          'Telemedicine',
                          'Home Care',
                          'Dental Care',
                          'Mental Health Services',
                          "Women's Health",
                          "Men's Health",
                          'Pediatric Care',
                          'Geriatric Care',
                          'Chronic Disease Management',
                          'Pain Management',
                          'Rehabilitation',
                          'Nutrition Counseling',
                          'Smoking Cessation',
                          'Weight Management',
                          'Travel Medicine',
                          'Occupational Health',
                        ].map((service) => (
                          <label key={service} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.services.includes(service)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleInputChange('services', [...formData.services, service]);
                                } else {
                                  handleInputChange(
                                    'services',
                                    formData.services.filter((s: string) => s !== service)
                                  );
                                }
                              }}
                              className="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                            />
                            <span className="text-sm text-gray-700">{service}</span>
                          </label>
                        ))}
                      </div>
                      <Input
                        label="Other Services (comma-separated)"
                        value={formData.custom_services.join(', ')}
                        onChange={(e) =>
                          handleInputChange(
                            'custom_services',
                            e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter((s) => s)
                          )
                        }
                        placeholder="e.g., Acupuncture, Massage Therapy"
                        disabled={isLoading}
                        className="mt-4"
                      />
                    </div>
                  </div>
                )}

                {/* Step 5: Business Information */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Medical License Number"
                        value={formData.license_number}
                        onChange={(e) => handleInputChange('license_number', e.target.value)}
                        disabled={isLoading}
                      />
                      <Input
                        label="Accreditation Number"
                        value={formData.accreditation}
                        onChange={(e) => handleInputChange('accreditation', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Tax ID"
                        value={formData.tax_id}
                        onChange={(e) => handleInputChange('tax_id', e.target.value)}
                        disabled={isLoading}
                      />
                      <Input
                        label="Year Established"
                        type="number"
                        value={formData.year_established}
                        onChange={(e) => handleInputChange('year_established', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Number of Doctors"
                        type="number"
                        value={formData.number_of_doctors}
                        onChange={(e) => handleInputChange('number_of_doctors', e.target.value)}
                        disabled={isLoading}
                      />
                      <Input
                        label="Number of Staff"
                        type="number"
                        value={formData.number_of_staff}
                        onChange={(e) => handleInputChange('number_of_staff', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clinic Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:bg-gray-50"
                        rows={3}
                        placeholder="Describe your clinic's mission, values, and what makes you unique..."
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                {/* Step 6: Operating Hours */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Operating Hours</h4>
                      <div className="space-y-4">
                        {Object.entries(formData.operating_hours).map(([day, hours]: [string, any]) => (
                          <div key={day} className="flex items-center space-x-4">
                            <div className="w-24 text-sm font-medium text-gray-700 capitalize">
                              {day}
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                value={hours.open}
                                onChange={(e) =>
                                  handleInputChange('operating_hours', {
                                    ...formData.operating_hours,
                                    [day]: { ...hours, open: e.target.value },
                                  })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
                                disabled={isLoading}
                              />
                              <span className="text-gray-500">to</span>
                              <input
                                type="time"
                                value={hours.close}
                                onChange={(e) =>
                                  handleInputChange('operating_hours', {
                                    ...formData.operating_hours,
                                    [day]: { ...hours, close: e.target.value },
                                  })
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Review Information</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        <p>
                          <strong>Clinic Name:</strong> {formData.clinic_name}
                        </p>
                        <p>
                          <strong>Email:</strong> {formData.email}
                        </p>
                        <p>
                          <strong>Phone:</strong> {formData.phone || 'Not provided'}
                        </p>
                        <p>
                          <strong>Address:</strong> {formData.address || 'Not provided'}
                        </p>
                        <p>
                          <strong>Location:</strong>{' '}
                          {clinicLocation
                            ? `${clinicLocation.lat.toFixed(6)}, ${clinicLocation.lng.toFixed(6)}`
                            : 'Not selected'}
                        </p>
                        <p>
                          <strong>Specialties:</strong>{' '}
                          {[...formData.specialties, ...formData.custom_specialties].join(', ') || 'None'}
                        </p>
                        <p>
                          <strong>Services:</strong>{' '}
                          {[...formData.services, ...formData.custom_services].join(', ') || 'None'}
                        </p>
                        <p>
                          <strong>License:</strong> {formData.license_number || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <div className="flex space-x-2">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        disabled={isLoading}
                      >
                        Previous
                      </Button>
                    )}
                    <Button type="button" variant="outline" onClick={clearFormData} disabled={isLoading}>
                      Clear Form Data
                    </Button>
                  </div>

                  <div className="flex space-x-2">
                    {currentStep < 6 ? (
                      <Button
                        type="button"
                        variant="gradient"
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={isLoading}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button type="submit" variant="gradient" loading={isLoading}>
                        Complete Registration
                      </Button>
                    )}
                  </div>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have a clinic account?{' '}
                  <Link
                    to="/clinic-signin"
                    className="font-medium text-secondary-600 hover:text-secondary-500 transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Are you a patient?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};
