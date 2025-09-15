import { supabase } from '../supabaseClient';

// Adyen Configuration from environment variables
const ADYEN_ENVIRONMENT = import.meta.env.VITE_ADYEN_ENVIRONMENT || 'test';
const ADYEN_CLIENT_KEY = import.meta.env.VITE_ADYEN_CLIENT_KEY;
const ADYEN_MERCHANT_ACCOUNT = import.meta.env.VITE_ADYEN_MERCHANT_ACCOUNT;

// API Base URL for our backend endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Validate environment variables
if (!ADYEN_CLIENT_KEY || !ADYEN_MERCHANT_ACCOUNT || !API_BASE_URL) {
  console.error('Missing required Adyen environment variables. Please check your .env file.');
}

export interface PaymentRequest {
  patientId: string;
  clinicId: string;
  appointmentId?: string;
  amount: number; // Amount in PHP (will be converted to cents)
  currency?: string;
  paymentMethod: 'gcash' | 'paymaya' | 'card' | 'grabpay';
  returnUrl: string;
  reference?: string;
}

export interface PaymentSession {
  sessionId: string;
  sessionData: string;
  paymentMethods: any[];
  amount: {
    currency: string;
    value: number;
  };
  merchantAccount: string;
  reference: string;
  returnUrl: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  pspReference?: string;
  resultCode?: string;
  action?: any;
  error?: string;
  redirectUrl?: string;
}

export const adyenPaymentService = {
  
  /**
   * Create a payment session for the Drop-in/Components
   */
  async createPaymentSession(request: PaymentRequest): Promise<{ success: boolean; session?: PaymentSession; error?: string }> {
    try {
      if (!API_BASE_URL) {
        throw new Error('API_BASE_URL is not configured');
      }

      // Create session request for our backend
      const sessionRequest = {
        patientId: request.patientId,
        clinicId: request.clinicId,
        appointmentId: request.appointmentId,
        amount: request.amount,
        currency: request.currency || 'PHP',
        paymentMethod: request.paymentMethod,
        returnUrl: request.returnUrl,
        reference: request.reference
      };

      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call our backend sessions endpoint
      const response = await fetch(`${API_BASE_URL}/adyen-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(sessionRequest)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Backend session creation failed:', result);
        return { success: false, error: result.error || 'Payment session creation failed' };
      }

      const sessionData = result.data;

      return {
        success: true,
        session: {
          sessionId: sessionData.sessionId,
          sessionData: sessionData.sessionData,
          paymentMethods: sessionData.paymentMethods || [],
          amount: sessionData.amount,
          merchantAccount: sessionData.merchantAccount,
          reference: sessionData.reference,
          returnUrl: sessionData.returnUrl
        }
      };

    } catch (error) {
      console.error('Error creating payment session:', error);
      return { success: false, error: 'Failed to create payment session' };
    }
  },

  /**
   * Process payment using Adyen Components
   */
  async processPayment(paymentData: any, stateData: any, merchantReference?: string): Promise<PaymentResult> {
    try {
      if (!API_BASE_URL) {
        throw new Error('API_BASE_URL is not configured');
      }

      const paymentRequest = {
        paymentData,
        stateData,
        merchantReference
      };

      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${API_BASE_URL}/adyen-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(paymentRequest)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return { success: false, error: result.error || 'Payment processing failed' };
      }

      const paymentResult = result.data;
      
      return {
        success: paymentResult.success,
        paymentId: paymentResult.paymentId,
        pspReference: paymentResult.pspReference,
        resultCode: paymentResult.resultCode,
        action: paymentResult.action,
        redirectUrl: paymentResult.redirectUrl
      };

    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  },

  /**
   * Handle payment details for 3DS and other additional actions
   */
  async submitPaymentDetails(details: any, paymentData?: any): Promise<PaymentResult> {
    try {
      if (!API_BASE_URL) {
        throw new Error('API_BASE_URL is not configured');
      }

      const detailsRequest = {
        details,
        paymentData
      };

      const response = await fetch(`${API_BASE_URL}/adyen-payment-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(detailsRequest)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return { success: false, error: result.error || 'Payment details processing failed' };
      }

      const detailsResult = result.data;

      return {
        success: detailsResult.resultCode === 'Authorised',
        paymentId: detailsResult.pspReference,
        pspReference: detailsResult.pspReference,
        resultCode: detailsResult.resultCode,
        action: detailsResult.action
      };

    } catch (error) {
      console.error('Error submitting payment details:', error);
      return { success: false, error: 'Payment details processing failed' };
    }
  },

  /**
   * Get payment status from database
   */
  async getPaymentStatus(merchantReference: string): Promise<{ success: boolean; payment?: any; error?: string }> {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('merchant_reference', merchantReference)
        .single();

      if (error) {
        console.error('Error fetching payment:', error);
        return { success: false, error: 'Payment not found' };
      }

      return { success: true, payment };
    } catch (error) {
      console.error('Error getting payment status:', error);
      return { success: false, error: 'Failed to get payment status' };
    }
  },

  /**
   * Process refund (Note: This should ideally be done server-side as well)
   */
  async processRefund(pspReference: string, refundAmount: number, reason: string): Promise<{ success: boolean; refundReference?: string; error?: string }> {
    try {
      // TODO: Implement refund endpoint on backend
      console.warn('Refund processing should be implemented on backend');
      return { success: false, error: 'Refund processing not implemented yet' };
    } catch (error) {
      console.error('Error processing refund:', error);
      return { success: false, error: 'Refund processing failed' };
    }
  },

  /**
   * Private helper methods
   */
  
  getAllowedPaymentMethods(preferredMethod: string): string[] {
    const methodMap: { [key: string]: string[] } = {
      'gcash': ['gcash', 'scheme'],
      'paymaya': ['paymaya', 'scheme'],
      'card': ['scheme'],
      'grabpay': ['grabpay_PH', 'scheme']
    };

    return methodMap[preferredMethod] || ['scheme', 'gcash', 'paymaya', 'grabpay_PH'];
  },

  mapAdyenStatusToLocal(resultCode: string): string {
    const statusMap: { [key: string]: string } = {
      'Authorised': 'authorized',
      'Refused': 'refused',
      'Cancelled': 'cancelled',
      'Error': 'error',
      'Pending': 'pending',
      'Received': 'pending'
    };

    return statusMap[resultCode] || 'pending';
  },

  // Database operations are now handled by backend endpoints
};

// Configuration object for Adyen Web Components
export const adyenConfiguration = {
  environment: ADYEN_ENVIRONMENT,
  clientKey: ADYEN_CLIENT_KEY,
  analytics: {
    enabled: ADYEN_ENVIRONMENT === 'live' // Enable analytics for production
  },
  paymentMethodsConfiguration: {
    card: {
      hasHolderName: true,
      holderNameRequired: true,
      billingAddressRequired: false
    },
    gcash: {
      showImage: true
    },
    paymaya: {
      showImage: true
    },
    grabpay_PH: {
      showImage: true
    }
  },
  locale: 'en_PH',
  showPayButton: true,
  amount: {
    currency: 'PHP',
    value: 0 // Will be set dynamically
  }
};

// Helper function to get configuration with session data
export function getAdyenConfiguration(session?: { id: string; sessionData: string }) {
  if (!ADYEN_CLIENT_KEY) {
    throw new Error('Adyen Client Key is not configured. Please check your environment variables.');
  }

  console.log('Adyen Configuration Debug:', {
    environment: ADYEN_ENVIRONMENT,
    hasClientKey: !!ADYEN_CLIENT_KEY,
    clientKey: ADYEN_CLIENT_KEY?.substring(0, 20) + '...',
    merchantAccount: ADYEN_MERCHANT_ACCOUNT,
    hasSession: !!session,
    sessionId: session?.id
  });

  // Base configuration
  const baseConfig = {
    environment: ADYEN_ENVIRONMENT as 'test' | 'live',
    clientKey: ADYEN_CLIENT_KEY,
    locale: 'en-US', // Use en-US instead of en-PH (which doesn't exist)
    countryCode: 'PH', // Required field for Philippines
    analytics: {
      enabled: ADYEN_ENVIRONMENT === 'live'
    },
    paymentMethodsConfiguration: {
      card: {
        hasHolderName: true,
        holderNameRequired: true,
        billingAddressRequired: false
      },
      gcash: {
        showImage: true
      }
    }
  };

  // If we have session data, use Sessions flow
  if (session) {
    return {
      ...baseConfig,
      session: {
        id: session.id,
        sessionData: session.sessionData
      }
    };
  }

  // Fallback configuration (shouldn't be used in sessions flow)
  return baseConfig;
}
