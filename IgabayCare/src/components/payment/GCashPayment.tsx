import React, { useEffect, useRef, useState } from 'react';
import AdyenCheckout from '@adyen/adyen-web';
import '@adyen/adyen-web/dist/adyen.css';
import { adyenPaymentService, getAdyenConfiguration } from '../../services/adyenPaymentService';

interface GCashPaymentProps {
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

const GCashPayment: React.FC<GCashPaymentProps> = ({
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
  const checkoutRef = useRef<HTMLDivElement>(null);
  const adyenCheckout = useRef<any>(null);

  // Generate return URL (adjust this to match your app's routing)
  const returnUrl = `${window.location.origin}/payment/return`;

  useEffect(() => {
    initializePayment();
  }, [patientId, clinicId, amount]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create payment session
      const sessionResult = await adyenPaymentService.createPaymentSession({
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

      // Initialize Adyen Checkout with session
      const configuration = getAdyenConfiguration({
        id: sessionData.sessionId,
        sessionData: sessionData.sessionData,
      });

      // Add event handlers
      const checkoutConfiguration = {
        ...configuration,
        onPaymentCompleted: handlePaymentCompleted,
        onError: handlePaymentError,
        onPaymentFailed: handlePaymentError,
        onAdditionalDetails: handleAdditionalDetails,
      };

      adyenCheckout.current = await AdyenCheckout(checkoutConfiguration);

      // Mount the GCash component
      if (checkoutRef.current) {
        // Clear previous content
        checkoutRef.current.innerHTML = '';

        // Try to mount GCash component specifically
        const gcashComponent = adyenCheckout.current.create('gcash');
        gcashComponent.mount(checkoutRef.current);
      }

    } catch (error) {
      console.error('Error initializing payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCompleted = (result: any, component: any) => {
    console.log('Payment completed:', result);
    
    if (result.resultCode === 'Authorised') {
      onPaymentSuccess?.(result);
    } else if (result.resultCode === 'Pending' || result.resultCode === 'Received') {
      // Payment is pending (common with GCash)
      onPaymentSuccess?.({
        ...result,
        status: 'pending',
        message: 'Payment is being processed. You will receive a confirmation once completed.'
      });
    } else {
      handlePaymentError({
        error: `Payment ${result.resultCode}`,
        resultCode: result.resultCode
      }, component);
    }
  };

  const handlePaymentError = (error: any, component?: any) => {
    console.error('Payment error:', error);
    setError(error.error || error.message || 'Payment failed');
    onPaymentError?.(error);
  };

  const handleAdditionalDetails = async (state: any, component: any) => {
    try {
      console.log('Handling additional details:', state);
      
      const result = await adyenPaymentService.submitPaymentDetails(
        state.data.details,
        state.data.paymentData
      );

      if (result.success) {
        handlePaymentCompleted(result, component);
      } else {
        handlePaymentError(result, component);
      }
    } catch (error) {
      handlePaymentError(error, component);
    }
  };

  const retryPayment = () => {
    setError(null);
    initializePayment();
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
            onClick={retryPayment}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try Again
          </button>
          <button
            onClick={onPaymentCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
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

      {/* Adyen Checkout Component Container */}
      <div ref={checkoutRef} className="adyen-checkout-container">
        {/* Adyen components will be mounted here */}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Payment Instructions:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Make sure you have sufficient balance in your GCash account</li>
          <li>• Complete the payment within 15 minutes</li>
          <li>• You will receive a confirmation once payment is processed</li>
          <li>• Keep your transaction reference for your records</li>
        </ul>
      </div>
    </div>
  );
};

export default GCashPayment;
