import React, { useEffect, useRef, useState } from 'react';
import '../../styles/adyen.css';
import { mockAdyenService, getMockAdyenConfiguration } from '../../services/mockAdyenService';

interface GCashPaymentDevProps {
  patientId: string;
  clinicId: string;
  appointmentId?: string;
  amount: number;
  currency?: string;
  onPaymentSuccess?: (result: any) => void;
  onPaymentError?: (error: any) => void;
  onPaymentCancel?: () => void;
}

interface PaymentSession {
  sessionId: string;
  sessionData: string;
  amount: {
    currency: string;
    value: number;
  };
  merchantAccount: string;
  reference: string;
  returnUrl: string;
}

const GCashPaymentDev: React.FC<GCashPaymentDevProps> = ({
  patientId,
  clinicId,
  appointmentId,
  amount,
  currency = 'PHP',
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [paymentStep, setPaymentStep] = useState<'init' | 'processing' | 'completed'>('init');
  const checkoutRef = useRef<HTMLDivElement>(null);

  // Generate return URL (adjust this to match your app's routing)
  const returnUrl = `${window.location.origin}/payment/return`;

  useEffect(() => {
    initializePayment();
  }, [patientId, clinicId, amount]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎭 Initializing Mock GCash Payment...');

      // Create mock payment session
      const sessionResult = await mockAdyenService.createPaymentSession({
        patientId,
        clinicId,
        appointmentId,
        amount,
        currency,
        paymentMethod: 'gcash', // Prefer GCash
        returnUrl,
      });

      if (!sessionResult.success || !sessionResult.session) {
        throw new Error(sessionResult.error || 'Failed to create payment session');
      }

      const sessionData = sessionResult.session;
      setSession(sessionData);

      console.log('✅ Mock payment session created successfully');

    } catch (error) {
      console.error('Error initializing payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleMockPayment = async () => {
    if (!session) return;

    try {
      setPaymentStep('processing');
      setError(null);

      console.log('🎭 Processing mock payment...');

      // Simulate payment processing
      const result = await mockAdyenService.processPayment(
        { amount: session.amount, currency: session.amount.currency },
        { reference: session.reference }
      );

      if (result.success) {
        setPaymentStep('completed');
        console.log('✅ Mock payment completed successfully');
        
        // Call success callback with mock result
        onPaymentSuccess?.({
          ...result,
          status: 'success',
          message: 'Mock payment completed successfully!',
        });
      } else {
        throw new Error('Mock payment failed');
      }

    } catch (error) {
      console.error('Mock payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
      setPaymentStep('init');
      onPaymentError?.(error);
    }
  };

  const handleCancel = () => {
    console.log('🚫 Payment cancelled');
    onPaymentCancel?.();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Initializing GCash payment...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800">Payment Error</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="flex space-x-3">
          <button
            onClick={initializePayment}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try Again
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (paymentStep === 'completed') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">Mock Payment Successful!</h3>
        <p className="text-gray-600 mb-4">
          This is a demonstration using fake payment data.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <p className="text-sm text-green-800">
            <span className="font-medium">Mock Transaction Reference:</span>
            <br />
            <span className="font-mono">{session?.reference}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      {/* Development Mode Banner */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.081 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-sm font-medium text-yellow-800">Development Mode</h3>
        </div>
        <p className="text-xs text-yellow-700">
          Using mock Adyen service. No real payments will be processed.
        </p>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center mb-2">
          <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <h3 className="text-lg font-medium text-blue-800">GCash Payment</h3>
        </div>
        <div className="text-sm text-blue-700">
          <p>Amount: <span className="font-semibold">₱{amount.toFixed(2)}</span></p>
          {session && (
            <p>Reference: <span className="font-mono text-xs">{session.reference}</span></p>
          )}
        </div>
      </div>

      {/* Mock Payment Interface */}
      <div ref={checkoutRef} className="mock-payment-interface">
        {paymentStep === 'processing' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="font-semibold text-gray-900 mb-2">Processing Mock Payment</h3>
            <p className="text-gray-600">Please wait while we simulate payment processing...</p>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="mb-4">
              <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Mock GCash Payment</h3>
              <p className="text-gray-600 text-sm mt-1">Simulate GCash payment flow</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleMockPayment}
                disabled={paymentStep === 'processing'}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {paymentStep === 'processing' ? 'Processing...' : `Pay ₱${amount.toFixed(2)} with Mock GCash`}
              </button>

              <button
                onClick={handleCancel}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancel Payment
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Mock Payment Instructions:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• This is a simulated GCash payment interface</li>
          <li>• No real money will be charged</li>
          <li>• Click "Pay" to simulate a successful transaction</li>
          <li>• Perfect for testing your booking flow</li>
        </ul>
      </div>
    </div>
  );
};

export default GCashPaymentDev;
