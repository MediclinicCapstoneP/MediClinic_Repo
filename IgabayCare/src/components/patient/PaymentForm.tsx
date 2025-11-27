import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Building2, Banknote, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { 
  PaymentProcessingService, 
  ClinicPaymentMethodService 
} from '../../services/paymentService';
import { 
  PaymentMethodOption, 
  PaymentRequest, 
  PaymentResponse 
} from '../../types/payment';
import { patientService } from '../../features/auth/utils/patientService';
import { authService } from '../../features/auth/utils/authService';

interface PaymentFormProps {
  clinicId: string;
  patientId: string;
  appointmentData?: {
    appointment_id?: string;
    consultation_fee: number;
    booking_fee: number;
    total_amount: number;
  };
  onPaymentComplete: (paymentResponse: PaymentResponse) => void;
  onBack: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  clinicId,
  patientId,
  appointmentData,
  onPaymentComplete,
  onBack
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [selectedMethodDetails, setSelectedMethodDetails] = useState<PaymentMethodOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [payerInfo, setPayerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Fetch payment methods when component mounts
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get patient info
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          const patientResult = await patientService.getPatientByUserId(currentUser.id);
          if (patientResult.success && patientResult.patient) {
            // Use full_name if available, otherwise construct from first_name and last_name
            const fullName = patientResult.patient.full_name || 
              `${patientResult.patient.first_name || ''} ${patientResult.patient.last_name || ''}`.trim();
            
            setPayerInfo({
              name: fullName,
              phone: patientResult.patient.phone || '',
              email: currentUser.email || ''
            });
          }
        }
        
        // Get clinic payment methods
        const result = await PaymentProcessingService.getPaymentMethodOptions(clinicId);
        if (result.success && result.data) {
          setPaymentMethods(result.data);
          if (result.data.length > 0) {
            setSelectedMethod(result.data[0].type);
            setSelectedMethodDetails(result.data[0]);
          }
        } else {
          setError(result.error || 'Failed to load payment methods');
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        setError('Failed to load payment methods');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, [clinicId]);

  // Handle method selection
  const handleMethodSelect = (methodType: string) => {
    setSelectedMethod(methodType);
    const method = paymentMethods.find(m => m.type === methodType);
    if (method) {
      setSelectedMethodDetails(method);
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (!selectedMethod || !payerInfo.name || !payerInfo.phone || !payerInfo.email) {
      setError('Please fill in all required fields');
      return;
    }

    if (!appointmentData) {
      setError('Appointment data is missing');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const paymentRequest: PaymentRequest = {
        appointment_id: appointmentData.appointment_id,
        patient_id: patientId,
        clinic_id: clinicId,
        payment_method: selectedMethod as any,
        amount: appointmentData.total_amount,
        consultation_fee: appointmentData.consultation_fee,
        booking_fee: appointmentData.booking_fee,
        payer_name: payerInfo.name,
        payer_phone: payerInfo.phone,
        payer_email: payerInfo.email
      };

      const result = await PaymentProcessingService.processPayment(paymentRequest);
      
      if (result.success && result.data) {
        setSuccess(true);
        setTimeout(() => {
          onPaymentComplete(result.data!);
        }, 2000);
      } else {
        setError(result.error || 'Payment processing failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Get icon for payment method
  const getMethodIcon = (iconName: string) => {
    switch (iconName) {
      case 'smartphone': return <Smartphone className="h-5 w-5" />;
      case 'building-2': return <Building2 className="h-5 w-5" />;
      case 'credit-card': return <CreditCard className="h-5 w-5" />;
      case 'banknote': return <Banknote className="h-5 w-5" />;
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-600">Your payment has been processed successfully.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Payer Information */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Your Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={payerInfo.name}
              onChange={(e) => setPayerInfo({...payerInfo, name: e.target.value})}
              required
            />
            <Input
              label="Phone Number"
              value={payerInfo.phone}
              onChange={(e) => setPayerInfo({...payerInfo, phone: e.target.value})}
              required
            />
            <div className="md:col-span-2">
              <Input
                label="Email Address"
                type="email"
                value={payerInfo.email}
                onChange={(e) => setPayerInfo({...payerInfo, email: e.target.value})}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Amount Summary */}
      {appointmentData && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Consultation Fee</span>
                <span className="font-medium">₱{appointmentData.consultation_fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Booking Fee</span>
                <span className="font-medium">₱{appointmentData.booking_fee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Amount</span>
                <span>₱{appointmentData.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Select Payment Method</h3>
          {paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.type}
                  onClick={() => handleMethodSelect(method.type)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === method.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getMethodIcon(method.icon)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                      {(method.processing_fee_percentage || 0) > 0 || (method.processing_fee_fixed || 0) > 0 ? (
                        <div className="text-xs text-blue-600 mt-1">
                          Processing fee: {(method.processing_fee_percentage || 0)}% + ₱{(method.processing_fee_fixed || 0)}
                        </div>
                      ) : null}

                    </div>
                    <div className={`w-5 h-5 rounded-full border ${
                      selectedMethod === method.type
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedMethod === method.type && (
                        <CheckCircle className="h-5 w-5 text-white" />
                      )}
                    </div>
                  </div>
                  {method.instructions && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {method.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">No payment methods available</p>
              <p className="text-sm">This clinic does not accept online payments at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={processing}>
          Back
        </Button>
        <Button 
          onClick={handlePaymentSubmit} 
          disabled={processing || !selectedMethod || paymentMethods.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </div>
  );
};