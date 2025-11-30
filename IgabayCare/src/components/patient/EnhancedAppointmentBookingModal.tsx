/**
 * Enhanced Appointment Booking Modal - Complete patient booking workflow
 * Integrates with the enhanced booking service for full end-to-end process
 */

import React, { useState, useEffect } from 'react';
import { enhancedBookingService } from '../../services/enhancedBookingService';
import { supabase } from '../../supabaseClient';
import { Button } from '../ui/Button';
import { 
  X, ChevronLeft, ChevronRight, Clock, CheckCircle, User, Mail, Phone, 
  Calendar, FileText, CreditCard, AlertCircle, Loader2
} from 'lucide-react';

interface EnhancedAppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: {
    id: string;
    clinic_name: string;
    operating_hours?: any;
    address?: string;
    phone?: string;
  };
  patientId: string;
  onAppointmentBooked?: (appointment: any) => void;
}

interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
}

export const EnhancedAppointmentBookingModal: React.FC<EnhancedAppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  clinic,
  patientId,
  onAppointmentBooked
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Patient information
  const [patientData, setPatientData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: ''
  });

  // Appointment details
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointmentType, setAppointmentType] = useState<string>('consultation');

  // Services and notes
  const [servicesOptions, setServicesOptions] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [patientNotes, setPatientNotes] = useState('');

  // Payment
  const [showPayment, setShowPayment] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);

  // Calendar helpers
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isPastDate = date < today;
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isAvailable = isCurrentMonth && !isPastDate && isClinicOpenOnDate(date);

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isPastDate,
        isToday,
        isSelected,
        isAvailable
      });
    }

    return days;
  };

  const isClinicOpenOnDate = (date: Date): boolean => {
    if (!clinic.operating_hours) return true;
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    const dayHours = clinic.operating_hours[dayName];
    return dayHours && dayHours.open && dayHours.close;
  };

  // Load time slots for selected date
  const loadTimeSlots = async (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error("Invalid date in loadTimeSlots:", date);
      setAvailableTimeSlots([]);
      return;
    }

    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const result = await enhancedBookingService.getAvailableTimeSlots(clinic.id, dateStr);
      if (result.success) {
        setAvailableTimeSlots(result.data || []);
      } else {
        console.error('Error loading time slots:', result.error);
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      setAvailableTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Date and time selection handlers
  const handleDateSelect = (date: Date, isAvailable: boolean) => {
    if (!isAvailable) return;
    const validDate = new Date(date);
    if (isNaN(validDate.getTime())) return;

    setSelectedDate(validDate);
    setSelectedTime('');
    loadTimeSlots(validDate);
  };

  const navigateMonth = (dir: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (dir === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
    setSelectedDate(null);
    setSelectedTime('');
  };

  // Service selection
  const toggleServiceSelection = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  // Form validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Patient Information
        return !!(patientData.firstName && patientData.lastName && 
                 patientData.email && patientData.phone);
      case 2: // Date & Time Selection
        return !!(selectedDate && selectedTime);
      case 3: // Services & Notes
        return true; // Services are optional, notes are optional
      case 4: // Review & Confirm
        return true; // Just review step
      default:
        return false;
    }
  };

  // Calculate appointment cost
  const calculateAppointmentCost = () => {
    const baseFee = 500, bookingFee = 50;
    return { consultation_fee: baseFee, booking_fee: bookingFee, total_amount: baseFee + bookingFee };
  };

  // Handle appointment booking
  const handleBookAppointment = async (withPayment: boolean = false) => {
    if (!validateStep(2) || !selectedDate || !selectedTime) {
      setError('Please select a date and time for your appointment');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const composedNotes = buildComposedNotes(patientNotes, selectedServices);

      const bookingPayload: PatientBookingData = {
        patient_id: patientId,
        clinic_id: clinic.id,
        appointment_date: dateStr,
        appointment_time: selectedTime + ':00',
        appointment_type: appointmentType,
        patient_notes: composedNotes,
        requested_services: selectedServices,
        patient_name: `${patientData.firstName} ${patientData.lastName}`,
        patient_email: patientData.email,
        patient_phone: patientData.phone
      };

      if (withPayment) {
        // Store booking data for payment step
        setBookingData({
          ...bookingPayload,
          ...calculateAppointmentCost(),
          selectedDate,
          selectedTime,
          appointmentType,
          patientNotes: composedNotes
        });
        setShowPayment(true);
      } else {
        // Book without payment
        const result = await enhancedBookingService.createAppointment(bookingPayload);
        
        if (result.success) {
          setBookingSuccess(true);
          onAppointmentBooked?.(result.data);
          
          // Reset and close after success
          setTimeout(() => {
            onClose();
            resetForm();
          }, 3000);
        } else {
          setError(result.error || 'Failed to book appointment');
        }
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Payment completion handler
  const handlePaymentComplete = async (paymentResult: any) => {
    setShowPayment(false);
    
    if (!bookingData) return;
    
    setLoading(true);
    try {
      // Create appointment with payment
      const result = await enhancedBookingService.createAppointment({
        ...bookingData,
        payment_status: 'paid',
        payment_method: 'gcash',
        payment_amount: bookingData.total_amount,
        transaction_id: paymentResult.transactionId
      });

      if (result.success) {
        setBookingSuccess(true);
        onAppointmentBooked?.(result.data);
        
        setTimeout(() => {
          onClose();
          resetForm();
        }, 3000);
      } else {
        setError(result.error || 'Payment confirmed but booking failed');
      }
    } catch (error) {
      console.error('Error completing payment booking:', error);
      setError('Failed to complete booking after payment');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const buildComposedNotes = (notes: string, services: string[]) => {
    if (services.length === 0) return notes || '';
    const header = 'Requested services: ' + services.join(', ');
    return notes ? `${header}\n${notes}` : header;
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedDate(null);
    setSelectedTime('');
    setSelectedServices([]);
    setPatientNotes('');
    setBookingSuccess(false);
    setError(null);
    setBookingData(null);
    setShowPayment(false);
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      setError('Please complete all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      // Load patient data
      const loadPatientData = async () => {
        try {
          const { data: user } = await supabase.auth.getUser();
          if (user?.user) {
            const { data: patient } = await supabase
              .from('patients')
              .select('*')
              .eq('user_id', user.user.id)
              .single();
            
            if (patient) {
              setPatientData({
                firstName: patient.first_name || '',
                lastName: patient.last_name || '',
                email: patient.email || user.user.email || '',
                phone: patient.phone || '',
                dateOfBirth: patient.date_of_birth || ''
              });
            }
          }
        } catch (error) {
          console.error('Error loading patient data:', error);
        }
      };

      // Load clinic services
      const loadClinicServices = async () => {
        try {
          const { data } = await supabase
            .from('clinics')
            .select('services, custom_services')
            .eq('id', clinic.id)
            .single();
          
          if (data) {
            const combined = [
              ...(Array.isArray(data.services) ? data.services : []),
              ...(Array.isArray(data.custom_services) ? data.custom_services : []),
            ]
              .map((s: any) => (typeof s === 'string' ? s : String(s)))
              .filter(Boolean);
            setServicesOptions(Array.from(new Set(combined)).sort());
          }
        } catch (error) {
          console.error('Error loading clinic services:', error);
        }
      };

      loadPatientData();
      loadClinicServices();
    }
  }, [isOpen, clinic.id]);

  // Load time slots when date is selected
  useEffect(() => {
    if (selectedDate) loadTimeSlots(selectedDate);
  }, [selectedDate]);

  if (!isOpen) return null;

  const calendarDays = generateCalendarDays();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Book Appointment</h2>
                <p className="text-xs sm:text-sm text-gray-600">{clinic.clinic_name}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="px-3 sm:px-6 py-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center justify-between">
                {[
                  { step: 1, title: 'Patient Info', icon: User },
                  { step: 2, title: 'Date & Time', icon: Calendar },
                  { step: 3, title: 'Services', icon: FileText },
                  { step: 4, title: 'Review', icon: CheckCircle }
                ].map(({ step, title, icon: Icon }) => (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      currentStep >= step 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {currentStep > step ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={`ml-2 text-xs sm:text-sm font-medium ${
                      currentStep >= step ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {title}
                    </span>
                    {step < 4 && (
                      <div className="mx-2 sm:mx-4 w-4 sm:w-8 h-0.5 bg-gray-300"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 min-h-0">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {bookingSuccess ? (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Appointment Booked Successfully!</h3>
                <p className="text-gray-600 text-center">Your appointment has been scheduled. You will receive a confirmation shortly.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Step 1: Patient Information */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Patient Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                        <input
                          type="text"
                          value={patientData.firstName}
                          onChange={(e) => setPatientData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                        <input
                          type="text"
                          value={patientData.lastName}
                          onChange={(e) => setPatientData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter last name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          value={patientData.email}
                          onChange={(e) => setPatientData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          value={patientData.phone}
                          onChange={(e) => setPatientData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Date & Time Selection */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    {/* Calendar */}
                    <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base sm:text-lg font-semibold">Select Date</h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigateMonth('prev')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                          </button>
                          <span className="font-medium text-gray-900 min-w-[120px] text-center">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                          </span>
                          <button
                            onClick={() => navigateMonth('next')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                          const isToday = day.date.toDateString() === new Date().toDateString();
                          const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                          const isPast = day.date < new Date(new Date().setHours(0, 0, 0, 0));
                          const isAvailable = !isPast && day.isCurrentMonth;

                          return (
                            <button
                              key={index}
                              onClick={() => handleDateSelect(day.date, day.isAvailable)}
                              disabled={!day.isAvailable}
                              className={`
                                h-10 w-10 flex items-center justify-center rounded-lg text-sm transition-colors
                                ${isToday ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
                                ${isSelected ? 'bg-blue-600 text-white font-semibold' : ''}
                                ${isPast || !isAvailable ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                              `}
                            >
                              {day.date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Selection */}
                    {selectedDate && (
                      <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-gray-600" />
                          Available Times for {selectedDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </h3>

                        {loading ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                            {[...Array(12)].map((_, i) => (
                              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                            ))}
                          </div>
                        ) : (
                          <div className="max-h-48 overflow-y-auto">
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 pr-2">
                              {availableTimeSlots.map(slot => (
                                <button
                                  key={slot.time}
                                  onClick={() => setSelectedTime(slot.time)}
                                  disabled={!slot.available}
                                  className={`
                                    px-3 py-2 text-sm border rounded-lg transition-colors flex-shrink-0
                                    ${selectedTime === slot.time
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : slot.available
                                        ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                        : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                                    }
                                  `}
                                >
                                  {slot.formatted}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Services & Notes */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Appointment Type
                      </label>
                      <select
                        value={appointmentType}
                        onChange={(e) => setAppointmentType(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="consultation">General Consultation</option>
                        <option value="routine_checkup">Routine Checkup</option>
                        <option value="follow_up">Follow-up Visit</option>
                        <option value="specialist_visit">Specialist Visit</option>
                        <option value="vaccination">Vaccination</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Services Needed <span className="text-gray-500">(select all that apply)</span>
                      </label>
                      {servicesOptions.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {servicesOptions.map((svc) => {
                            const selected = selectedServices.includes(svc);
                            return (
                              <button
                                type="button"
                                key={svc}
                                onClick={() => toggleServiceSelection(svc)}
                                className={`px-4 py-2 rounded-lg border text-sm transition-all duration-200 ${
                                  selected 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                                }`}
                              >
                                {selected && (
                                  <CheckCircle className="inline h-4 w-4 mr-1" />
                                )}
                                {svc}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">No specific services listed by the clinic. You may describe your needs in the notes below.</p>
                        </div>
                      )}
                      
                      {selectedServices.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Selected Services:</strong> {selectedServices.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes <span className="text-gray-500">(Optional)</span>
                      </label>
                      <textarea
                        value={patientNotes}
                        onChange={(e) => setPatientNotes(e.target.value)}
                        placeholder="Describe your symptoms, concerns, or any additional information..."
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Confirm */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Review Your Appointment</h3>
                    
                    <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Patient Name:</span>
                          <p className="font-medium text-gray-900">{`${patientData.firstName} ${patientData.lastName}`}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <p className="font-medium text-gray-900">{patientData.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <p className="font-medium text-gray-900">{patientData.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Clinic:</span>
                          <p className="font-medium text-gray-900">{clinic.clinic_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Appointment Type:</span>
                          <p className="font-medium text-gray-900">
                            {appointmentType === 'consultation' ? 'General Consultation' :
                             appointmentType === 'routine_checkup' ? 'Routine Checkup' :
                             appointmentType === 'follow_up' ? 'Follow-up Visit' :
                             appointmentType === 'specialist_visit' ? 'Specialist Visit' :
                             appointmentType === 'vaccination' ? 'Vaccination' : 'Other'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <p className="font-medium text-gray-900">
                            {selectedDate?.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Time:</span>
                          <p className="font-medium text-gray-900">{selectedTime}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Consultation Fee:</span>
                          <p className="font-medium text-gray-900">₱{calculateAppointmentCost().total_amount}</p>
                        </div>
                      </div>

                      {selectedServices.length > 0 && (
                        <div>
                          <span className="text-gray-600">Requested Services:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selectedServices.map(service => (
                              <span key={service} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {patientNotes && (
                        <div>
                          <span className="text-gray-600">Additional Notes:</span>
                          <p className="mt-1 text-gray-900">{patientNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {!bookingSuccess && (
            <div className="flex-shrink-0 px-3 sm:px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="sm:w-auto"
                >
                  Previous
                </Button>

                <div className="flex gap-3">
                  {currentStep === 4 ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={onClose}
                        className="sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleBookAppointment(false)}
                        disabled={loading}
                        loading={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white sm:w-auto"
                      >
                        Book Without Payment
                      </Button>
                      <Button
                        onClick={() => handleBookAppointment(true)}
                        disabled={loading}
                        loading={loading}
                        className="bg-green-600 hover:bg-green-700 text-white sm:w-auto"
                      >
                        Pay & Book (₱{calculateAppointmentCost().total_amount})
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={nextStep}
                      disabled={!validateStep(currentStep)}
                      className="bg-blue-600 hover:bg-blue-700 text-white sm:w-auto"
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal (placeholder - integrate with existing payment component) */}
      {showPayment && bookingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Complete Payment</h3>
                <button
                  onClick={() => setShowPayment(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Payment integration placeholder</p>
                <Button
                  onClick={() => handlePaymentComplete({ transactionId: 'demo_' + Date.now() })}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Simulate Payment Success
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
