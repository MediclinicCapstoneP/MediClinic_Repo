import React, { useState, useEffect, useRef } from 'react';
import { X, CreditCard, Smartphone, Clock, MapPin, User, Calendar, ChevronDown } from 'lucide-react';
import { adyenPaymentService, PaymentRequest, PaymentSession } from '../../services/adyenPaymentService';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';

// Import Adyen Web Components (add these to your package.json and index.html)
declare global {
  interface Window {
    AdyenCheckout: any;
  }
}

interface PaymentFirstBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (appointmentId: string, paymentId: string) => void;
  appointmentData: {
    clinicId: string;
    clinicName: string;
    clinicAddress: string;
    date: string;
    time: string;
    consultationFee: number;
    doctorName?: string;
    appointmentType: string;
    duration: number;
  };
  patientId: string;
}

interface BookingStep {
  step: 'review' | 'payment' | 'processing' | 'success' | 'failed';
  title: string;
}

export const PaymentFirstBookingModal: React.FC<PaymentFirstBookingModalProps> = ({
  isOpen,
  onClose,
  onBookingSuccess,
  appointmentData,
  patientId
}) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>({
    step: 'review',
    title: 'Review Appointment'
  });
  
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'gcash' | 'paymaya' | 'card' | 'grabpay'>('gcash');
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<string>('');
  const [availableAppointmentTypes, setAvailableAppointmentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<any>(null);
  
  const paymentRef = useRef<HTMLDivElement>(null);
  const dropinRef = useRef<any>(null);

  const steps: BookingStep[] = [
    { step: 'review', title: 'Review Appointment' },
    { step: 'payment', title: 'Payment' },
    { step: 'processing', title: 'Processing' },
    { step: 'success', title: 'Confirmed' },
    { step: 'failed', title: 'Failed' }
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep({ step: 'review', title: 'Review Appointment' });
      setError(null);
      setPaymentSession(null);
      loadClinicAppointmentTypes();
    }
  }, [isOpen]);

  useEffect(() => {
    // Load Adyen Web Components
    if (currentStep.step === 'payment' && !window.AdyenCheckout) {
      loadAdyenScript();
    }
  }, [currentStep.step]);

  const loadAdyenScript = () => {
    if (document.getElementById('adyen-script')) return;

    const script = document.createElement('script');
    script.id = 'adyen-script';
    script.src = 'https://checkoutshopper-test.adyen.com/checkoutshopper/sdk/5.62.0/adyen.js';
    script.onload = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://checkoutshopper-test.adyen.com/checkoutshopper/sdk/5.62.0/adyen.css';
      document.head.appendChild(link);
    };
    document.head.appendChild(script);
  };

  const loadClinicAppointmentTypes = async () => {
    try {
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('services, specialties, custom_services, custom_specialties')
        .eq('id', appointmentData.clinicId)
        .single();

      if (error) {
        console.error('Error loading clinic data:', error);
        // Fallback to default appointment types
        setAvailableAppointmentTypes([
          'consultation',
          'follow_up',
          'routine_checkup',
          'specialist_visit'
        ]);
        return;
      }

      if (clinic) {
        // Combine services and specialties into appointment types
        const appointmentTypes = new Set<string>();
        
        // Add services
        if (clinic.services && clinic.services.length > 0) {
          clinic.services.forEach((service: string) => appointmentTypes.add(service));
        }
        
        // Add custom services
        if (clinic.custom_services && clinic.custom_services.length > 0) {
          clinic.custom_services.forEach((service: string) => appointmentTypes.add(service));
        }
        
        // Add specialties as appointment types
        if (clinic.specialties && clinic.specialties.length > 0) {
          clinic.specialties.forEach((specialty: string) => appointmentTypes.add(specialty));
        }
        
        // Add custom specialties
        if (clinic.custom_specialties && clinic.custom_specialties.length > 0) {
          clinic.custom_specialties.forEach((specialty: string) => appointmentTypes.add(specialty));
        }
        
        // Convert to array and sort
        const typesArray = Array.from(appointmentTypes).sort();
        
        // If no services/specialties found, use default types
        if (typesArray.length === 0) {
          setAvailableAppointmentTypes([
            'consultation',
            'follow_up',
            'routine_checkup',
            'specialist_visit'
          ]);
        } else {
          setAvailableAppointmentTypes(typesArray);
        }
        
        // Set the first available type as selected
        if (typesArray.length > 0) {
          setSelectedAppointmentType(typesArray[0]);
        }
      }
    } catch (error) {
      console.error('Error in loadClinicAppointmentTypes:', error);
      // Fallback to default appointment types
      setAvailableAppointmentTypes([
        'consultation',
        'follow_up',
        'routine_checkup',
        'specialist_visit'
      ]);
      setSelectedAppointmentType('consultation');
    }
  };

  const handleProceedToPayment = async () => {
    setLoading(true);
    setError(null);

    // Validate appointment type selection
    if (!selectedAppointmentType) {
      setError('Please select an appointment type');
      setLoading(false);
      return;
    }

    try {
      // Create payment session
      const paymentRequest: PaymentRequest = {
        patientId,
        clinicId: appointmentData.clinicId,
        amount: appointmentData.consultationFee,
        paymentMethod: selectedPaymentMethod,
        returnUrl: `${window.location.origin}/payment/return`
      };

      const response = await adyenPaymentService.createPaymentSession(paymentRequest);
      
      if (!response.success || !response.session) {
        throw new Error(response.error || 'Failed to create payment session');
      }

      setPaymentSession(response.session);
      setCurrentStep({ step: 'payment', title: 'Payment' });
      
      // Initialize Adyen Drop-in after session is created
      setTimeout(() => initializeAdyenDropin(response.session), 500);

    } catch (error) {
      console.error('Error creating payment session:', error);
      setError(error instanceof Error ? error.message : 'Failed to create payment session');
    } finally {
      setLoading(false);
    }
  };

  const initializeAdyenDropin = async (session: PaymentSession) => {
    if (!window.AdyenCheckout || !paymentRef.current) return;

    try {
      const configuration = {
        environment: 'test',
        session: {
          id: session.sessionId,
          sessionData: session.sessionData
        },
        onPaymentCompleted: (result: any, component: any) => {
          handlePaymentResult(result);
        },
        onError: (error: any, component: any) => {
          console.error('Adyen error:', error);
          setError('Payment failed. Please try again.');
          setCurrentStep({ step: 'failed', title: 'Payment Failed' });
        },
        paymentMethodsConfiguration: {
          card: {
            hasHolderName: true,
            holderNameRequired: true
          }
        }
      };

      const checkoutInstance = await window.AdyenCheckout(configuration);
      setCheckout(checkoutInstance);

      // Clear previous instance
      if (dropinRef.current) {
        dropinRef.current.unmount();
      }

      // Mount the Drop-in
      const dropin = checkoutInstance.create('dropin');
      dropinRef.current = dropin;
      dropin.mount(paymentRef.current);

    } catch (error) {
      console.error('Error initializing Adyen checkout:', error);
      setError('Failed to initialize payment. Please try again.');
    }
  };

  const handlePaymentResult = async (result: any) => {
    setCurrentStep({ step: 'processing', title: 'Processing Payment' });

    try {
      if (result.resultCode === 'Authorised') {
        // Payment successful, create appointment
        await createAppointment(result.pspReference);
        setCurrentStep({ step: 'success', title: 'Appointment Confirmed' });
      } else if (result.resultCode === 'Pending' || result.resultCode === 'Received') {
        // Payment pending, still create appointment but mark as pending
        await createAppointment(result.pspReference);
        setCurrentStep({ step: 'success', title: 'Appointment Pending Payment' });
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error) {
      console.error('Error processing payment result:', error);
      setError('Failed to complete booking. Please contact support.');
      setCurrentStep({ step: 'failed', title: 'Booking Failed' });
    }
  };

  const createAppointment = async (paymentId: string) => {
    try {
      // Create appointment in database with payment reference
      const appointmentData = {
        patient_id: patientId,
        clinic_id: appointmentData.clinicId,
        appointment_date: appointmentData.date,
        appointment_time: appointmentData.time,
        appointment_type: selectedAppointmentType,
        duration_minutes: appointmentData.duration,
        consultation_fee: appointmentData.consultationFee,
        status: 'payment_confirmed',
        payment_status: 'paid',
        payment_id: paymentId
      };

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create appointment: ${error.message}`);
      }
      onBookingSuccess(appointment.id, paymentId);
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  };

  const handleClose = () => {
    // Cleanup Adyen components
    if (dropinRef.current) {
      dropinRef.current.unmount();
    }
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const renderStepContent = () => {
    switch (currentStep.step) {
      case 'review':
        return (
          <div className="space-y-6">
            {/* Appointment Details */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Appointment Details</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{appointmentData.clinicName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(appointmentData.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{appointmentData.time}</span>
                    </div>
                    {appointmentData.doctorName && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Dr. {appointmentData.doctorName}</span>
                      </div>
                    )}
                    {selectedAppointmentType && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Type: {selectedAppointmentType.charAt(0).toUpperCase() + selectedAppointmentType.slice(1).replace(/_/g, ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Appointment Type Selection */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Select Appointment Type</h3>
              <div className="relative">
                <select
                  value={selectedAppointmentType}
                  onChange={(e) => setSelectedAppointmentType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  disabled={loading}
                >
                  <option value="">Choose an appointment type...</option>
                  {availableAppointmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              {availableAppointmentTypes.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">Loading appointment types...</p>
              )}
            </div>

            {/* Payment Method Selection */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Select Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'gcash', name: 'GCash', icon: Smartphone },
                  { id: 'paymaya', name: 'PayMaya', icon: Smartphone },
                  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
                  { id: 'grabpay', name: 'GrabPay', icon: Smartphone }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id as any)}
                    className={`p-3 border-2 rounded-lg flex items-center space-x-2 transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <method.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Consultation Fee</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(appointmentData.consultationFee)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Payment is required to secure your appointment. You will receive a confirmation once payment is processed.
              </p>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleProceedToPayment}
                disabled={loading || !selectedAppointmentType}
                className="flex-1"
              >
                {loading ? 'Creating Session...' : `Pay ${formatCurrency(appointmentData.consultationFee)}`}
              </Button>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-2">Complete Your Payment</h3>
              <p className="text-gray-600">
                Amount: <span className="font-semibold">{formatCurrency(appointmentData.consultationFee)}</span>
              </p>
            </div>
            
            {/* Adyen Drop-in Container */}
            <div 
              ref={paymentRef}
              className="min-h-[400px] border border-gray-200 rounded-lg p-4"
            />
          </div>
        );

      case 'processing':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="font-semibold text-gray-900 mb-2">Processing Payment</h3>
            <p className="text-gray-600">Please wait while we process your payment...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-green-900 mb-2">Appointment Confirmed!</h3>
            <p className="text-gray-600 mb-6">
              Your payment has been processed and your appointment is confirmed.
            </p>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-semibold text-red-900 mb-2">Payment Failed</h3>
            <p className="text-gray-600 mb-6">
              {error || 'There was an issue processing your payment. Please try again.'}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setCurrentStep({ step: 'review', title: 'Review Appointment' })}
                className="w-full"
              >
                Try Again
              </Button>
              <Button variant="secondary" onClick={handleClose} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            {steps.slice(0, 3).map((step, index) => (
              <React.Fragment key={step.step}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    steps.findIndex(s => s.step === currentStep.step) >= index
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 2 && (
                  <div
                    className={`h-1 w-8 ${
                      steps.findIndex(s => s.step === currentStep.step) > index
                        ? 'bg-blue-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">{currentStep.title}</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </Modal>
  );
};
