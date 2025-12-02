import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { GCashLogo } from '../ui/GCashLogo';
import { paymongoService, GCashPaymentRequest, GCashPaymentResult } from '../../services/paymongoService';

interface PayMongoGCashPaymentProps {
  amount: number; // Amount in PHP
  description: string;
  appointmentId?: string;
  clinicId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  onBack: () => void;
}

export const PayMongoGCashPayment: React.FC<PayMongoGCashPaymentProps> = ({
  amount,
  description,
  appointmentId,
  clinicId,
  patientName,
  patientEmail,
  patientPhone,
  onPaymentSuccess,
  onPaymentError,
  onBack
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<GCashPaymentResult | null>(null);
  const [showRedirect, setShowRedirect] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    name: patientName,
    email: patientEmail,
    phone: patientPhone
  });

  // Handle payment initiation
  const handlePayment = async () => {
    if (!patientInfo.name || !patientInfo.email || !patientInfo.phone) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}/patient/payment-return`;
      
      const paymentRequest: GCashPaymentRequest = {
        amount: amount,
        description: description,
        patient_name: patientInfo.name,
        patient_email: patientInfo.email,
        patient_phone: patientInfo.phone,
        return_url: returnUrl,
        appointment_id: appointmentId,
        clinic_id: clinicId,
        metadata: {
          source: 'mediclinic_app',
          timestamp: new Date().toISOString()
        }
      };

      const result = await paymongoService.processGCashPayment(paymentRequest);
      
      if (result.success && result.redirect_url) {
        setPaymentResult(result);
        setShowRedirect(true);
        
        // Store payment intent ID in sessionStorage for return handling
        if (result.payment_intent_id) {
          sessionStorage.setItem('paymongo_payment_intent_id', result.payment_intent_id);
          sessionStorage.setItem('paymongo_appointment_id', appointmentId || '');
        }
      } else {
        setError(result.error || 'Failed to initiate GCash payment');
        onPaymentError(result.error || 'Payment initiation failed');
      }
    } catch (err) {
      console.error('GCash payment error:', err);
      setError('An unexpected error occurred. Please try again.');
      onPaymentError('Payment processing error');
    } finally {
      setLoading(false);
    }
  };

  // Handle redirect to GCash
  const handleGCashRedirect = () => {
    if (paymentResult?.redirect_url) {
      // Open in new tab for better UX
      const popup = window.open(paymentResult.redirect_url, 'gcash_payment', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      // Start polling for payment status
      startPaymentStatusPolling();
      
      // Fallback if popup is blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.open(paymentResult.redirect_url, '_blank');
      }
    }
  };

  // Poll payment status after redirect
  const startPaymentStatusPolling = () => {
    if (!paymentResult?.payment_intent_id) return;

    setIsPolling(true);
    let currentPollCount = 0;
    const maxPolls = 200; // 200 polls * 3 seconds = 10 minutes max

    const pollInterval = setInterval(async () => {
      try {
        currentPollCount++;
        setPollCount(currentPollCount);
        
        // Stop polling after max attempts
        if (currentPollCount > maxPolls) {
          clearInterval(pollInterval);
          setIsPolling(false);
          setError('Payment verification timed out. Please check your payment status or try again.');
          onPaymentError('Payment verification timed out');
          return;
        }

        const statusResult = await paymongoService.handlePaymentReturn(paymentResult.payment_intent_id!);
        
        console.log(`🔄 Poll attempt ${currentPollCount}:`, statusResult);
        console.log(`🔍 Poll status check - success: ${statusResult.success}, status: ${statusResult.status}`);
        setPaymentStatus(statusResult.status);
        
        if (statusResult.success && statusResult.status === 'succeeded') {
          console.log('✅ Polling confirmed payment succeeded, triggering success callback');
          clearInterval(pollInterval);
          setIsPolling(false);
          sessionStorage.removeItem('paymongo_payment_intent_id');
          sessionStorage.removeItem('paymongo_appointment_id');
          console.log('✅ Payment successful!');
          onPaymentSuccess(paymentResult.payment_intent_id!);
        } else if (statusResult.status === 'canceled') {
          clearInterval(pollInterval);
          setIsPolling(false);
          setError('Payment was cancelled');
          onPaymentError('Payment was cancelled');
        } else if (statusResult.status === 'failed') {
          clearInterval(pollInterval);
          setIsPolling(false);
          setError('Payment failed');
          onPaymentError('Payment failed');
        } else if (statusResult.error) {
          clearInterval(pollInterval);
          setIsPolling(false);
          setError(`Payment error: ${statusResult.error}`);
          onPaymentError(statusResult.error);
        } else if (statusResult.status === 'awaiting_next_action') {
          // Payment requires user action on GCash app
          console.log(`⏳ Payment awaiting user action on GCash: ${statusResult.status}`);
          // Don't stop polling, user might complete the payment later
        } else if (statusResult.status === 'processing') {
          // Payment is being processed
          console.log(`⏳ Payment is processing: ${statusResult.status}`);
        } else {
          // Still processing - continue polling
          console.log(`⏳ Payment still processing: ${statusResult.status}`);
        }
      } catch (err) {
        console.error('Payment status polling error:', err);
        // Don't stop polling on network errors, continue trying
      }
    }, 3000); // Poll every 3 seconds

    // Store interval reference for cleanup
    (window as any).paymentPollInterval = pollInterval;
  };

  // Check for returning payment on component mount
  useEffect(() => {
    const checkReturnPayment = async () => {
      const paymentIntentId = sessionStorage.getItem('paymongo_payment_intent_id');
      const appointmentId = sessionStorage.getItem('paymongo_appointment_id');
      
      if (paymentIntentId && appointmentId) {
        setLoading(true);
        try {
          console.log('🔍 Checking payment return for intent:', paymentIntentId);
          const result = await paymongoService.handlePaymentReturn(paymentIntentId);
          
          console.log('📊 Payment return result:', result);
          
          // Double-check the status before proceeding
          if (result.success && result.status === 'succeeded') {
            console.log('✅ Payment confirmed as succeeded, triggering success callback');
            sessionStorage.removeItem('paymongo_payment_intent_id');
            sessionStorage.removeItem('paymongo_appointment_id');
            onPaymentSuccess(paymentIntentId);
          } else if (result.status === 'canceled' || result.status === 'failed') {
            console.log('❌ Payment cancelled or failed:', result.status);
            sessionStorage.removeItem('paymongo_payment_intent_id');
            sessionStorage.removeItem('paymongo_appointment_id');
            setError('Payment was cancelled or failed');
            onPaymentError('Payment was not completed');
          } else if (result.status === 'awaiting_next_action') {
            console.log('⏳ Payment awaiting user action on GCash app');
            setError('Payment not completed. Current status: awaiting_next_action');
            // Don't call onPaymentError, just continue waiting
            setTimeout(() => {
              checkReturnPayment();
            }, 3000); // Check every 3 seconds
            return; // Don't set loading to false yet
          } else {
            console.log('⏳ Payment still processing:', result.status);
            // Still processing, check again after delay
            setTimeout(() => {
              checkReturnPayment();
            }, 2000);
            return; // Don't set loading to false yet
          }
        } catch (err) {
          console.error('Payment return check error:', err);
          setError('Failed to verify payment status');
          onPaymentError('Payment verification failed');
        } finally {
          setLoading(false);
        }
      }
    };

    checkReturnPayment();
    
    // Cleanup polling interval on unmount
    return () => {
      if ((window as any).paymentPollInterval) {
        clearInterval((window as any).paymentPollInterval);
      }
    };
  }, [onPaymentSuccess, onPaymentError]);

  if (showRedirect && paymentResult) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <GCashLogo size="lg" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete Payment with GCash</h3>
            <p className="text-gray-600 mb-4">
              Click the button below to open GCash and complete your payment of ₱{amount.toFixed(2)}
            </p>
            
            {paymentStatus === 'awaiting_next_action' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  {isPolling ? (
                    <Loader2 className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0 animate-spin" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">
                      {isPolling ? 'Checking Payment Status...' : 'Payment Awaiting Your Action:'}
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Please open your GCash app to complete the payment</li>
                      <li>Check for pending payment notifications in GCash</li>
                      <li>This page will automatically detect when payment is completed</li>
                      <li>Poll attempts: {pollCount}/200 (≈{Math.floor(pollCount * 3 / 60)} minutes elapsed)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {paymentStatus && paymentStatus !== 'awaiting_next_action' && paymentStatus !== 'succeeded' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  {isPolling ? (
                    <Loader2 className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0 animate-spin" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">
                      {isPolling ? 'Checking Payment Status...' : `Payment Status: ${paymentStatus}`}
                    </p>
                    <p className="text-xs mt-1">Checking payment status... Attempt {pollCount}/200</p>
                  </div>
                </div>
              </div>
            )}

            {!paymentStatus && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>You will be redirected to GCash to complete the payment</li>
                      <li>Please complete the payment within 10 minutes</li>
                      <li>Do not close this window until payment is confirmed</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleGCashRedirect}
              className="bg-blue-600 hover:bg-blue-700 mb-4"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open GCash Payment
            </Button>

            <div className="text-sm text-gray-500">
              <p>Payment ID: {paymentResult.payment_intent_id}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Cancel Payment
          </Button>
          <div className="space-x-2">
            {paymentStatus === 'awaiting_next_action' && (
              <Button 
                variant="ghost" 
                onClick={() => startPaymentStatusPolling()}
                className="text-blue-600"
                disabled={isPolling}
              >
                {isPolling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isPolling ? 'Checking...' : 'Check Again'}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="text-gray-600"
            >
              Start Over
            </Button>
          </div>
        </div>
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

      {/* Payment Information */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Your Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={patientInfo.name}
              onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
              required
            />
            <Input
              label="Phone Number"
              value={patientInfo.phone}
              onChange={(e) => setPatientInfo({...patientInfo, phone: e.target.value})}
              required
              placeholder="09XXXXXXXXX"
            />
            <div className="md:col-span-2">
              <Input
                label="Email Address"
                type="email"
                value={patientInfo.email}
                onChange={(e) => setPatientInfo({...patientInfo, email: e.target.value})}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{description}</span>
              <span className="font-medium">₱{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>PayMongo Processing Fee (2.5%)</span>
              <span>₱{(amount * 0.025).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total Amount</span>
              <span>₱{(amount + (amount * 0.025)).toFixed(2)}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              *Processing fee will be added during payment
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GCash Payment Method */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
          <div className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <GCashLogo size="sm" />
              </div>
              <div className="ml-3 flex-1">
                <div className="font-medium text-gray-900">GCash</div>
                <div className="text-sm text-gray-600">Pay securely with your GCash wallet</div>
                <div className="text-xs text-blue-600 mt-1">
                  Processing fee: 2.5% • Instant payment confirmation
                </div>
              </div>
              <div className="w-5 h-5 rounded-full bg-blue-600 border-blue-600">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button 
          onClick={handlePayment} 
          disabled={loading || !patientInfo.name || !patientInfo.email || !patientInfo.phone}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <GCashLogo size="sm" className="mr-2" />
              Pay with GCash
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
