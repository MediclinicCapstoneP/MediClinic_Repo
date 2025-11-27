import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AdyenCheckout } from '@adyen/adyen-web'; // Back to named import
import '../../styles/adyen.css';
import { adyenPaymentService, getAdyenConfiguration } from '../../services/adyenPaymentService';

// Debug the import
console.log('🔍 AdyenCheckout import debug:', {
  AdyenCheckout,
  type: typeof AdyenCheckout,
  isFunction: typeof AdyenCheckout === 'function'
});

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
  const [domReady, setDomReady] = useState(false);

  // Generate return URL (adjust this to match your app's routing)
  const returnUrl = `${window.location.origin}/payment/return`;

  // Callback ref to ensure DOM element is ready
  const setCheckoutRef = useCallback((element: HTMLDivElement | null) => {
    checkoutRef.current = element;
    if (element) {
      console.log('📌 DOM element attached via callback ref');
      setDomReady(true);
    } else {
      console.log('📌 DOM element detached');
      setDomReady(false);
    }
  }, []);

  // Initialize payment when DOM is ready and we have the required props
  useEffect(() => {
    if (!domReady || !patientId || !clinicId || !amount) {
      console.log('🔍 Waiting for requirements:', {
        domReady,
        hasPatientId: !!patientId,
        hasClinicId: !!clinicId,
        hasAmount: !!amount
      });
      return;
    }

    console.log('🔧 Environment Variables Debug:', {
      ADYEN_ENVIRONMENT: import.meta.env.VITE_ADYEN_ENVIRONMENT,
      ADYEN_CLIENT_KEY: import.meta.env.VITE_ADYEN_CLIENT_KEY?.substring(0, 20) + '...',
      ADYEN_MERCHANT: import.meta.env.VITE_ADYEN_MERCHANT_ACCOUNT,
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL
    });

    console.log('🏁 All requirements met, initializing payment...');
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('⏰ Payment initialization timeout after 30 seconds');
        setError('Payment initialization timed out. Please try again or contact support.');
        setLoading(false);
      }
    }, 30000);

    // Initialize payment
    initializePayment();

    return () => clearTimeout(timeoutId);
  }, [domReady, patientId, clinicId, amount]);

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

      console.log('🎉 Session creation successful!');
      console.log('📊 Session data details:', {
        sessionId: sessionData.sessionId,
        hasSessionData: !!sessionData.sessionData,
        sessionDataLength: sessionData.sessionData?.length || 0,
        amount: sessionData.amount,
        merchantAccount: sessionData.merchantAccount,
        reference: sessionData.reference
      });
      console.log('📜 Full session object:', sessionData);
      
      // Initialize Adyen Checkout with session
      const configuration = getAdyenConfiguration({
        id: sessionData.sessionId,
        sessionData: sessionData.sessionData,
      });

      console.log('Adyen configuration:', configuration);

      // Add event handlers
      const checkoutConfiguration = {
        ...configuration,
        onPaymentCompleted: handlePaymentCompleted,
        onError: handlePaymentError,
        onPaymentFailed: handlePaymentError,
        onAdditionalDetails: handleAdditionalDetails,
      };

      console.log('Final checkout configuration:', checkoutConfiguration);
      
      try {
        console.log('🔧 Starting AdyenCheckout initialization...');
        console.log('📋 Session data:', sessionData);
        console.log('⚙️ Configuration:', checkoutConfiguration);
        console.log('📦 AdyenCheckout function type:', typeof AdyenCheckout);
        
        // Try initializing
        console.log('🚀 Initializing AdyenCheckout with configuration...');
        const checkoutInstance = await AdyenCheckout(checkoutConfiguration);
        console.log('🎯 Raw checkout result:', checkoutInstance);
        console.log('🔍 Checkout result type:', typeof checkoutInstance);
        console.log('📝 Checkout result keys:', checkoutInstance ? Object.keys(checkoutInstance) : 'null/undefined');
        
        adyenCheckout.current = checkoutInstance;
        
        // Detailed verification
        if (!adyenCheckout.current) {
          throw new Error('AdyenCheckout returned null/undefined');
        }
        
        // For Sessions API, we need to check for components property instead of create method
        if (!adyenCheckout.current.components && typeof adyenCheckout.current.create !== 'function') {
          console.error('❌ Neither components nor create method available. Available methods:', Object.keys(adyenCheckout.current));
          throw new Error(`AdyenCheckout object is missing both components and create method. Available: ${Object.keys(adyenCheckout.current).join(', ')}`);
        }
        
        console.log('✅ AdyenCheckout object structure:', {
          hasComponents: !!adyenCheckout.current.components,
          hasCreate: typeof adyenCheckout.current.create === 'function',
          componentsType: typeof adyenCheckout.current.components
        });
        
        console.log('✅ AdyenCheckout initialized successfully with create method');
        
      } catch (checkoutError) {
        console.error('💥 Error initializing AdyenCheckout:', checkoutError);
        console.error('📊 Error details:', {
          name: checkoutError.name,
          message: checkoutError.message,
          stack: checkoutError.stack
        });
        console.error('⚙️ Configuration used:', JSON.stringify(checkoutConfiguration, null, 2));
        throw new Error(`Failed to initialize Adyen: ${checkoutError.message}`);
      }

      // Mount the payment components (DOM element is guaranteed to be ready)
      if (checkoutRef.current && adyenCheckout.current) {
        console.log('✅ Both elements ready for mounting:', {
          checkoutRef: !!checkoutRef.current,
          adyenCheckout: !!adyenCheckout.current
        });
        
        // Clear previous content
        checkoutRef.current.innerHTML = '';

        try {
          console.log('📊 Available payment methods in session:', sessionData);
          console.log('🔍 AdyenCheckout structure:', adyenCheckout.current);
          
          let component;
          
          // Try different ways to create components based on the API version
          if (adyenCheckout.current.components) {
            console.log('🔄 Using Sessions API with components property');
            // For Sessions API, components might be pre-created
            if (adyenCheckout.current.components.dropin) {
              component = adyenCheckout.current.components.dropin;
              console.log('✅ Using pre-created dropin component');
            } else if (adyenCheckout.current.components.gcash) {
              component = adyenCheckout.current.components.gcash;
              console.log('✅ Using pre-created gcash component');
            } else {
              console.log('📝 Available components:', Object.keys(adyenCheckout.current.components));
              // Use the first available component
              const firstComponent = Object.keys(adyenCheckout.current.components)[0];
              if (firstComponent) {
                component = adyenCheckout.current.components[firstComponent];
                console.log(`✅ Using first available component: ${firstComponent}`);
              }
            }
          } 
          
          if (!component && typeof adyenCheckout.current.create === 'function') {
            console.log('🔄 Using traditional create API');
            // Traditional API
            component = adyenCheckout.current.create('dropin');
            console.log('✅ Created dropin component via create()');
          }
          
          if (!component) {
            throw new Error('No component could be created or found');
          }
          
          console.log('🎉 Component ready:', component);
          console.log('📋 Mounting to element:', checkoutRef.current);
          
          // Mount the component
          if (typeof component.mount === 'function') {
            component.mount(checkoutRef.current);
            console.log('✅ Successfully mounted component');
          } else {
            console.error('❌ Component does not have mount method:', Object.keys(component));
            throw new Error('Component is missing mount method');
          }
          
        } catch (mountError) {
          console.error('❌ Error in component mounting:', mountError);
          console.error('📊 Mount error details:', {
            error: mountError.message,
            checkoutKeys: Object.keys(adyenCheckout.current),
            hasComponents: !!adyenCheckout.current.components,
            componentsKeys: adyenCheckout.current.components ? Object.keys(adyenCheckout.current.components) : 'no components'
          });
          throw new Error(`Failed to mount payment component: ${mountError.message}`);
        }
      } else {
        const errorDetails = {
          hasCheckoutRef: !!checkoutRef.current,
          hasAdyenCheckout: !!adyenCheckout.current,
          domReady: document.readyState
        };
        
        console.error('❌ Missing required elements for mounting:', errorDetails);
        throw new Error(`Missing required elements for mounting: ${JSON.stringify(errorDetails)}`);
      }

    } catch (error) {
      console.error('Error initializing payment:', error);
      
      let errorMessage = 'Failed to initialize payment';
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('CORS')) {
          errorMessage = 'Network access blocked. This often happens in development mode. Please try refreshing or contact support.';
        } else if (error.message.includes('AdyenCheckout')) {
          errorMessage = 'Payment system failed to load. Please refresh the page and try again.';
        } else if (error.message.includes('session')) {
          errorMessage = 'Failed to create payment session. Please check your connection and try again.';
        } else if (error.message.includes('environment')) {
          errorMessage = 'Payment system configuration error. Please contact support.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
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
          <div className="flex flex-col">
            <span className="text-gray-600">Initializing GCash payment...</span>
            <span className="text-xs text-gray-400 mt-1">
              DOM Ready: {domReady ? 'Yes' : 'No'} | 
              Has Data: {patientId && clinicId && amount ? 'Yes' : 'No'}
            </span>
          </div>
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
      <div ref={setCheckoutRef} className="adyen-checkout-container">
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
