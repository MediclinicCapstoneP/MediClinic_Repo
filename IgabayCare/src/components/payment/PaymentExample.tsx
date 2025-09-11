import React, { useState } from 'react';
import GCashPayment from './GCashPayment';

const PaymentExample: React.FC = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Example data - replace with real data from your app
  const mockPatientId = 'patient-123';
  const mockClinicId = 'clinic-456';
  const mockAppointmentId = 'appointment-789';
  const consultationFee = 500.00; // ₱500

  const handlePaymentSuccess = (result: any) => {
    console.log('Payment successful:', result);
    setPaymentResult({
      success: true,
      ...result
    });
    setShowPayment(false);
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    setPaymentResult({
      success: false,
      error: error.error || error.message || 'Payment failed'
    });
  };

  const handlePaymentCancel = () => {
    console.log('Payment cancelled');
    setShowPayment(false);
    setPaymentResult({
      success: false,
      error: 'Payment cancelled by user'
    });
  };

  const startNewPayment = () => {
    setPaymentResult(null);
    setShowPayment(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          GCash Payment Integration Example
        </h1>
        <p className="text-gray-600">
          This example demonstrates how to integrate GCash payments using Adyen Checkout Sessions.
        </p>
      </div>

      {!showPayment && !paymentResult && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Appointment Payment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient ID
              </label>
              <input
                type="text"
                value={mockPatientId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clinic ID
              </label>
              <input
                type="text"
                value={mockClinicId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment ID
              </label>
              <input
                type="text"
                value={mockAppointmentId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consultation Fee
              </label>
              <input
                type="text"
                value={`₱${consultationFee.toFixed(2)}`}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.081 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800 mb-1">
                  Setup Required
                </h3>
                <p className="text-sm text-yellow-700">
                  Make sure you have configured your Adyen credentials in the .env file and deployed the Supabase Edge Functions before testing.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={startNewPayment}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Pay with GCash - ₱{consultationFee.toFixed(2)}
          </button>
        </div>
      )}

      {showPayment && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <GCashPayment
            patientId={mockPatientId}
            clinicId={mockClinicId}
            appointmentId={mockAppointmentId}
            amount={consultationFee}
            currency="PHP"
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onPaymentCancel={handlePaymentCancel}
          />
        </div>
      )}

      {paymentResult && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {paymentResult.success ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">
                {paymentResult.message || 'Your payment has been processed successfully.'}
              </p>
              
              {paymentResult.pspReference && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Transaction Reference:</span>
                    <br />
                    <span className="font-mono">{paymentResult.pspReference}</span>
                  </p>
                </div>
              )}
              
              {paymentResult.resultCode && (
                <p className="text-sm text-gray-500 mb-4">
                  Status: <span className="font-medium">{paymentResult.resultCode}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
              <p className="text-red-600 mb-4">{paymentResult.error}</p>
            </div>
          )}
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={startNewPayment}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Setup Instructions</h3>
        
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800">1. Environment Configuration</h4>
            <p>Update your <code className="bg-gray-200 px-1 rounded">.env</code> file with your Adyen credentials:</p>
            <pre className="mt-2 bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`VITE_ADYEN_ENVIRONMENT=test
VITE_ADYEN_CLIENT_KEY=test_your_client_key_here
VITE_ADYEN_MERCHANT_ACCOUNT=YourMerchantAccount
ADYEN_API_KEY=your_server_side_api_key_here
ADYEN_HMAC_KEY=your_hmac_key_for_webhooks_here
VITE_API_BASE_URL=https://your-project.supabase.co/functions/v1`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800">2. Deploy Supabase Edge Functions</h4>
            <p>Deploy the functions using Supabase CLI:</p>
            <pre className="mt-2 bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`supabase functions deploy adyen-sessions
supabase functions deploy adyen-payments  
supabase functions deploy adyen-payment-details
supabase functions deploy adyen-webhooks`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800">3. Configure Adyen Customer Area</h4>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Enable GCash payment method for Philippines</li>
              <li>Configure webhook endpoint: <code className="bg-gray-200 px-1 rounded">https://your-project.supabase.co/functions/v1/adyen-webhooks</code></li>
              <li>Set return URL patterns in Adyen Customer Area</li>
              <li>Add your domain to allowed origins</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentExample;
