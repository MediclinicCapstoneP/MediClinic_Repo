import { supabase } from '../lib/supabase';

// Adyen Configuration
const ADYEN_API_KEY = 'AQEqhmfuXNWTK0Qc+iSXn2Uxq8WYS4RYA4caCTCP4B3ixRe1SHORCNTAJqPBEMFdWw2+5HzctViMSCJMYAc=-HUc+Bqwdey3Z3DN4Gjafg9oTFfsPVQOxXV+FOI57zT0=-i1iH}:[8Id95Gvns)rZ';
const ADYEN_MERCHANT_ACCOUNT = 'IgabayAtiCare'; // Replace with your merchant account
const ADYEN_ENVIRONMENT = 'test'; // 'test' for testing, 'live' for production
const ADYEN_CLIENT_KEY = 'test_client_key'; // Replace with your client key

// Adyen API URLs
const ADYEN_CHECKOUT_API = ADYEN_ENVIRONMENT === 'live' 
  ? 'https://checkout-live.adyen.com/v71' 
  : 'https://checkout-test.adyen.com/v71';

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
      // Convert amount to cents (Adyen uses minor units)
      const amountValue = Math.round(request.amount * 100);
      
      // Generate unique merchant reference
      const merchantReference = request.reference || `IGC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create payment session request
      const sessionRequest = {
        merchantAccount: ADYEN_MERCHANT_ACCOUNT,
        amount: {
          currency: request.currency || 'PHP',
          value: amountValue
        },
        reference: merchantReference,
        returnUrl: request.returnUrl,
        countryCode: 'PH',
        shopperLocale: 'en_PH',
        allowedPaymentMethods: this.getAllowedPaymentMethods(request.paymentMethod),
        lineItems: [{
          id: request.appointmentId || 'consultation',
          description: 'Medical Consultation Fee',
          amountIncludingTax: amountValue,
          quantity: 1
        }],
        additionalData: {
          allow3DS2: 'true'
        },
        metadata: {
          patientId: request.patientId,
          clinicId: request.clinicId,
          appointmentId: request.appointmentId
        }
      };

      // Call Adyen Sessions API
      const response = await fetch(`${ADYEN_CHECKOUT_API}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ADYEN_API_KEY
        },
        body: JSON.stringify(sessionRequest)
      });

      const sessionData = await response.json();

      if (!response.ok) {
        console.error('Adyen session creation failed:', sessionData);
        return { success: false, error: sessionData.message || 'Payment session creation failed' };
      }

      // Store payment record in database
      await this.createPaymentRecord({
        merchantReference,
        patientId: request.patientId,
        clinicId: request.clinicId,
        appointmentId: request.appointmentId,
        amountValue,
        currency: request.currency || 'PHP',
        paymentMethod: request.paymentMethod,
        status: 'pending'
      });

      return {
        success: true,
        session: {
          sessionId: sessionData.id,
          sessionData: sessionData.sessionData,
          paymentMethods: sessionData.paymentMethods,
          amount: sessionData.amount,
          merchantAccount: sessionData.merchantAccount,
          reference: merchantReference,
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
  async processPayment(paymentData: any, stateData: any): Promise<PaymentResult> {
    try {
      const paymentRequest = {
        merchantAccount: ADYEN_MERCHANT_ACCOUNT,
        ...paymentData,
        ...stateData,
        additionalData: {
          allow3DS2: 'true'
        }
      };

      const response = await fetch(`${ADYEN_CHECKOUT_API}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ADYEN_API_KEY
        },
        body: JSON.stringify(paymentRequest)
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.message || 'Payment processing failed' };
      }

      // Update payment record with Adyen response
      if (result.pspReference && paymentRequest.reference) {
        await this.updatePaymentRecord(paymentRequest.reference, {
          adyen_psp_reference: result.pspReference,
          adyen_result_code: result.resultCode,
          adyen_response: result,
          status: this.mapAdyenStatusToLocal(result.resultCode)
        });
      }

      return {
        success: result.resultCode === 'Authorised',
        paymentId: result.pspReference,
        pspReference: result.pspReference,
        resultCode: result.resultCode,
        action: result.action,
        redirectUrl: result.redirect?.url
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
      const detailsRequest = {
        details,
        paymentData
      };

      const response = await fetch(`${ADYEN_CHECKOUT_API}/payments/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ADYEN_API_KEY
        },
        body: JSON.stringify(detailsRequest)
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.message || 'Payment details processing failed' };
      }

      return {
        success: result.resultCode === 'Authorised',
        paymentId: result.pspReference,
        pspReference: result.pspReference,
        resultCode: result.resultCode,
        action: result.action
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
   * Process refund
   */
  async processRefund(pspReference: string, refundAmount: number, reason: string): Promise<{ success: boolean; refundReference?: string; error?: string }> {
    try {
      const refundRequest = {
        merchantAccount: ADYEN_MERCHANT_ACCOUNT,
        amount: {
          currency: 'PHP',
          value: Math.round(refundAmount * 100)
        },
        reference: `REFUND-${pspReference}-${Date.now()}`,
        originalReference: pspReference
      };

      const response = await fetch(`${ADYEN_CHECKOUT_API}/payments/${pspReference}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ADYEN_API_KEY
        },
        body: JSON.stringify(refundRequest)
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.message || 'Refund processing failed' };
      }

      // Update payment record with refund information
      await supabase
        .from('payments')
        .update({
          refund_amount: Math.round(refundAmount * 100),
          refund_reason: reason,
          refunded_at: new Date().toISOString(),
          status: refundAmount === 0 ? 'refunded' : 'partially_refunded'
        })
        .eq('adyen_psp_reference', pspReference);

      return { success: true, refundReference: result.pspReference };

    } catch (error) {
      console.error('Error processing refund:', error);
      return { success: false, error: 'Refund processing failed' };
    }
  },

  /**
   * Get available payment methods for Philippines
   */
  async getPaymentMethods(amount: number, currency: string = 'PHP'): Promise<{ success: boolean; paymentMethods?: any[]; error?: string }> {
    try {
      const request = {
        merchantAccount: ADYEN_MERCHANT_ACCOUNT,
        countryCode: 'PH',
        amount: {
          currency,
          value: Math.round(amount * 100)
        },
        channel: 'Web'
      };

      const response = await fetch(`${ADYEN_CHECKOUT_API}/paymentMethods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ADYEN_API_KEY
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.message || 'Failed to get payment methods' };
      }

      return { success: true, paymentMethods: result.paymentMethods };

    } catch (error) {
      console.error('Error getting payment methods:', error);
      return { success: false, error: 'Failed to get payment methods' };
    }
  },

  /**
   * Private helper methods
   */
  
  private getAllowedPaymentMethods(preferredMethod: string): string[] {
    const methodMap: { [key: string]: string[] } = {
      'gcash': ['gcash', 'scheme'],
      'paymaya': ['paymaya', 'scheme'],
      'card': ['scheme'],
      'grabpay': ['grabpay_PH', 'scheme']
    };

    return methodMap[preferredMethod] || ['scheme', 'gcash', 'paymaya', 'grabpay_PH'];
  },

  private mapAdyenStatusToLocal(resultCode: string): string {
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

  private async createPaymentRecord(paymentData: {
    merchantReference: string;
    patientId: string;
    clinicId: string;
    appointmentId?: string;
    amountValue: number;
    currency: string;
    paymentMethod: string;
    status: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('payments')
        .insert([{
          merchant_reference: paymentData.merchantReference,
          patient_id: paymentData.patientId,
          clinic_id: paymentData.clinicId,
          appointment_id: paymentData.appointmentId,
          amount_value: paymentData.amountValue,
          currency: paymentData.currency,
          payment_method: paymentData.paymentMethod,
          status: paymentData.status,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
        }]);

      if (error) {
        console.error('Error creating payment record:', error);
      }
    } catch (error) {
      console.error('Error in createPaymentRecord:', error);
    }
  },

  private async updatePaymentRecord(merchantReference: string, updates: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('payments')
        .update(updates)
        .eq('merchant_reference', merchantReference);

      if (error) {
        console.error('Error updating payment record:', error);
      }
    } catch (error) {
      console.error('Error in updatePaymentRecord:', error);
    }
  }
};

// Configuration object for Adyen Web Components
export const adyenConfiguration = {
  environment: ADYEN_ENVIRONMENT,
  clientKey: ADYEN_CLIENT_KEY,
  analytics: {
    enabled: false // Set to true for production analytics
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
    }
  },
  locale: 'en_PH',
  showPayButton: true,
  amount: {
    currency: 'PHP',
    value: 0 // Will be set dynamically
  }
};
