import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { paymongoService } from '../../services/paymongoService';

const PaymentReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const handlePaymentReturn = async () => {
      try {
        // Get payment intent ID from URL params or session storage
        const paymentIntentId = searchParams.get('payment_intent_id') || 
                               sessionStorage.getItem('paymongo_payment_intent_id');
        
        if (!paymentIntentId) {
          setError('No payment information found');
          setPaymentStatus('failed');
          setLoading(false);
          return;
        }

        // Check payment status with PayMongo
        const result = await paymongoService.handlePaymentReturn(paymentIntentId);
        
        if (result.success && result.status === 'succeeded') {
          setPaymentStatus('success');
          setPaymentDetails({
            paymentIntentId: result.payment_intent_id,
            status: result.status
          });
          
          // Clear session storage
          sessionStorage.removeItem('paymongo_payment_intent_id');
          sessionStorage.removeItem('paymongo_appointment_id');
          
          // Show success message for 3 seconds then redirect
          setTimeout(() => {
            navigate('/patient', { replace: true });
          }, 3000);
        } else {
          setPaymentStatus('failed');
          setError(result.error || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Payment return error:', err);
        setError('Failed to verify payment status');
        setPaymentStatus('failed');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentReturn();
  }, [searchParams, navigate]);

  const handleReturnHome = () => {
    // Clear any remaining session data
    sessionStorage.removeItem('paymongo_payment_intent_id');
    sessionStorage.removeItem('paymongo_appointment_id');
    navigate('/patient', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your payment status...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-green-600 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              Your GCash payment has been processed successfully.
            </p>
            
            {paymentDetails && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-green-800 mb-2">Payment Details:</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><span className="font-medium">Payment ID:</span> {paymentDetails.paymentIntentId}</p>
                  <p><span className="font-medium">Status:</span> {paymentDetails.status}</p>
                  <p><span className="font-medium">Method:</span> GCash via PayMongo</p>
                </div>
              </div>
            )}

            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <p>✅ Payment confirmation sent to your email</p>
              <p>📱 SMS reminder will be sent before your appointment</p>
              <p>🏥 You can view your appointment in your dashboard</p>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Redirecting to dashboard in a few seconds...
            </p>

            <Button 
              onClick={handleReturnHome}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment failed or error state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Payment Failed
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'Your payment could not be processed.'}
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-800 mb-2">What happened?</h3>
            <div className="text-sm text-red-700 space-y-1">
              <p>• Payment was cancelled or declined</p>
              <p>• Insufficient GCash balance</p>
              <p>• Network connection issues</p>
              <p>• Payment timeout</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/patient', { replace: true })}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={handleReturnHome}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentReturn;
