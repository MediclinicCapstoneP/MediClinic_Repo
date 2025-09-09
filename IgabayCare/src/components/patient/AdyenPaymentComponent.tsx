import React, { useState, useEffect, useRef } from 'react';
import { AdyenCheckout } from '@adyen/adyen-web';
import { adyenService } from '../../features/auth/utils/adyenService';
import { Loader2, CreditCard, Shield, CheckCircle, XCircle } from 'lucide-react';

interface AdyenPaymentComponentProps {
  amount: number;
  currency?: string;
  reference: string;
  shopperEmail?: string;
  shopperName?: {
    firstName: string;
    lastName: string;
  };
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
  onPaymentCancel?: () => void;
  className?: string;
}

interface PaymentState {
  status: 'idle' | 'loading' | 'ready' | 'processing' | 'success' | 'error';
  error?: string;
  paymentData?: any;
}

export const AdyenPaymentComponent: React.FC<AdyenPaymentComponentProps> = ({
  amount,
  currency = 'PHP',
  reference,
  shopperEmail,
  shopperName,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
  className = ''
}) => {
  const [paymentState, setPaymentState] = useState<PaymentState>({ status: 'idle' });
  const [adyenCheckout, setAdyenCheckout] = useState<any>(null);
  const paymentContainer = useRef<HTMLDivElement>(null);
  const dropinComponent = useRef<any>(null);

  useEffect(() => {
    initializePayment();
    return () => {
      if (dropinComponent.current) {
        dropinComponent.current.unmount();
      }
    };
  }, []);

  const initializePayment = async () => {
    try {
      setPaymentState({ status: 'loading' });

      // Create payment session
      const sessionResult = await adyenService.createPaymentSession({
        amount: {
          currency,
          value: adyenService.formatAmount(amount, currency)
        },
        reference,
        returnUrl: `${window.location.origin}/payment-return`,
        shopperEmail,
        shopperName,
        metadata: {
          appointmentReference: reference
        }
      });

      if (!sessionResult.success) {
        throw new Error(sessionResult.error || 'Failed to create payment session');
      }

      // Initialize Adyen Checkout
      const configuration = {
        environment: (import.meta.env.VITE_ADYEN_ENVIRONMENT === 'live' ? 'live' : 'test') as 'live' | 'test',
        clientKey: import.meta.env.VITE_ADYEN_CLIENT_KEY,
        session: sessionResult.sessionData,
        analytics: {
          enabled: true
        },
        onPaymentCompleted: (result: any) => {
          handlePaymentResult(result);
        },
        onError: (error: any) => {
          console.error('Adyen payment error:', error);
          setPaymentState({ 
            status: 'error', 
            error: error.message || 'Payment failed' 
          });
          onPaymentError(error.message || 'Payment failed');
        },
        paymentMethodsConfiguration: {
          card: {
            hasHolderName: true,
            holderNameRequired: true,
            billingAddressRequired: false
          }
        }
      };

      const checkout = await AdyenCheckout(configuration);
      setAdyenCheckout(checkout);

      // Create drop-in component
      if (paymentContainer.current) {
        const dropin = (checkout as any).create('dropin').mount(paymentContainer.current);
        dropinComponent.current = dropin;
        setPaymentState({ status: 'ready' });
      }

    } catch (error) {
      console.error('Payment initialization error:', error);
      setPaymentState({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to initialize payment' 
      });
      onPaymentError(error instanceof Error ? error.message : 'Failed to initialize payment');
    }
  };

  const handlePaymentResult = async (result: any) => {
    try {
      setPaymentState({ status: 'processing' });

      if (result.resultCode === 'Authorised' || result.resultCode === 'Received') {
        setPaymentState({ 
          status: 'success', 
          paymentData: result 
        });
        onPaymentSuccess(result);
      } else if (result.resultCode === 'Pending' || result.resultCode === 'ChallengeShopper') {
        // Handle additional actions (3D Secure, etc.)
        if (result.action && adyenCheckout) {
          (adyenCheckout as any).createFromAction(result.action).mount(paymentContainer.current);
        }
      } else {
        throw new Error(result.refusalReason || 'Payment was not successful');
      }
    } catch (error) {
      console.error('Payment result handling error:', error);
      setPaymentState({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Payment processing failed' 
      });
      onPaymentError(error instanceof Error ? error.message : 'Payment processing failed');
    }
  };

  const retryPayment = () => {
    setPaymentState({ status: 'idle' });
    initializePayment();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderPaymentStatus = () => {
    switch (paymentState.status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Initializing secure payment...</p>
          </div>
        );

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Processing your payment...</p>
            <p className="text-sm text-gray-500">Please do not close this window</p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Successful!</h3>
            <p className="text-gray-600">Your appointment has been confirmed</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-green-800">
                Amount: {formatCurrency(amount, currency)}
              </p>
              <p className="text-sm text-green-800">
                Reference: {reference}
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <XCircle className="w-12 h-12 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Failed</h3>
            <p className="text-gray-600 text-center">{paymentState.error}</p>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={retryPayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              {onPaymentCancel && (
                <button
                  onClick={onPaymentCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`adyen-payment-component ${className}`}>
      {/* Payment Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Payment Amount</span>
          </div>
          <span className="text-xl font-bold text-gray-900">
            {formatCurrency(amount, currency)}
          </span>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-sm text-gray-600">Secured by Adyen</span>
        </div>
      </div>

      {/* Payment Status or Form */}
      {paymentState.status === 'ready' ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Choose Payment Method</h3>
          <div 
            ref={paymentContainer} 
            className="adyen-checkout-container"
          />
        </div>
      ) : (
        renderPaymentStatus()
      )}

      {/* Security Notice */}
      {paymentState.status === 'ready' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Secure Payment</p>
              <p>Your payment information is encrypted and secure. We never store your card details.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdyenPaymentComponent;
