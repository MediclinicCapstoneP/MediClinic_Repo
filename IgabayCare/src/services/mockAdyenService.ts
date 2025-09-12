// Mock Adyen service for testing UI without real API credentials
// This will be used temporarily until you get your real Adyen API keys

export interface MockPaymentSession {
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

export const mockAdyenService = {
  /**
   * Mock payment session creation - simulates Adyen behavior
   */
  async createPaymentSession(request: {
    patientId: string;
    clinicId: string;
    appointmentId?: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
    returnUrl: string;
    reference?: string;
  }): Promise<{ success: boolean; session?: MockPaymentSession; error?: string }> {
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock session data
    const mockSession: MockPaymentSession = {
      sessionId: `mock_session_${Date.now()}`,
      sessionData: `mock_session_data_${Math.random().toString(36).substr(2, 9)}`,
      amount: {
        currency: request.currency || 'PHP',
        value: Math.round(request.amount * 100), // Convert to minor units
      },
      merchantAccount: 'IgabayAtiCare',
      reference: request.reference || `IGC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      returnUrl: request.returnUrl,
    };

    console.log('🎭 Mock Adyen Session Created:', {
      sessionId: mockSession.sessionId,
      amount: mockSession.amount,
      reference: mockSession.reference,
    });

    return {
      success: true,
      session: mockSession,
    };
  },

  /**
   * Mock payment processing
   */
  async processPayment(paymentData: any, stateData: any, merchantReference?: string): Promise<{
    success: boolean;
    paymentId?: string;
    pspReference?: string;
    resultCode?: string;
    action?: any;
    redirectUrl?: string;
  }> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockResult = {
      success: true,
      paymentId: `mock_payment_${Date.now()}`,
      pspReference: `8815${Date.now()}${Math.floor(Math.random() * 1000)}`,
      resultCode: 'Authorised', // Simulate successful payment
    };

    console.log('🎭 Mock Payment Result:', mockResult);

    return mockResult;
  },

  /**
   * Mock payment details submission
   */
  async submitPaymentDetails(details: any, paymentData?: any): Promise<{
    success: boolean;
    paymentId?: string;
    pspReference?: string;
    resultCode?: string;
    action?: any;
  }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockResult = {
      success: true,
      paymentId: `mock_details_${Date.now()}`,
      pspReference: `8816${Date.now()}${Math.floor(Math.random() * 1000)}`,
      resultCode: 'Authorised',
    };

    console.log('🎭 Mock Payment Details Result:', mockResult);

    return mockResult;
  },
};

// Mock Adyen configuration for testing
export const mockAdyenConfiguration = {
  environment: 'test',
  clientKey: 'test_mock_client_key',
  analytics: {
    enabled: false,
  },
  paymentMethodsConfiguration: {
    card: {
      hasHolderName: true,
      holderNameRequired: true,
      billingAddressRequired: false,
    },
    gcash: {
      showImage: true,
    },
    paymaya: {
      showImage: true,
    },
    grabpay_PH: {
      showImage: true,
    },
  },
  locale: 'en_PH',
  showPayButton: true,
  amount: {
    currency: 'PHP',
    value: 0,
  },
};

// Helper function to get mock configuration
export function getMockAdyenConfiguration(session?: { id: string; sessionData: string }) {
  const config = {
    ...mockAdyenConfiguration,
  };

  if (session) {
    return {
      ...config,
      session: {
        id: session.id,
        sessionData: session.sessionData,
      },
    };
  }

  return config;
}

console.log('🎭 Mock Adyen Service Loaded - Using fake data for testing');
