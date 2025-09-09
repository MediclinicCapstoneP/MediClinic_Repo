import { supabase } from '../../../supabaseClient';

/**
 * Adyen Payment Service
 * 
 * Handles payment processing using Adyen's Payment API
 * Supports multiple payment methods including cards, digital wallets, and local payment methods
 */

export interface AdyenPaymentRequest {
  amount: {
    currency: string;
    value: number; // Amount in minor units (e.g., cents)
  };
  reference: string;
  paymentMethod: {
    type: string;
    [key: string]: any;
  };
  returnUrl: string;
  merchantAccount: string;
  shopperReference?: string;
  shopperEmail?: string;
  shopperName?: {
    firstName: string;
    lastName: string;
  };
  billingAddress?: {
    street: string;
    houseNumberOrName: string;
    city: string;
    postalCode: string;
    stateOrProvince: string;
    country: string;
  };
  metadata?: Record<string, string>;
}

export interface AdyenPaymentResponse {
  pspReference: string;
  resultCode: string;
  action?: {
    type: string;
    url?: string;
    method?: string;
    paymentData?: string;
    paymentMethodType?: string;
  };
  additionalData?: Record<string, string>;
  refusalReason?: string;
  refusalReasonCode?: string;
}

export interface AdyenPaymentDetails {
  details: Record<string, string>;
  paymentData?: string;
}

export interface AdyenRefundRequest {
  merchantAccount: string;
  amount: {
    currency: string;
    value: number;
  };
  reference: string;
  originalReference: string;
}

export interface AdyenWebhookEvent {
  live: string;
  notificationItems: Array<{
    NotificationRequestItem: {
      amount: {
        currency: string;
        value: number;
      };
      eventCode: string;
      eventDate: string;
      merchantAccountCode: string;
      merchantReference: string;
      originalReference?: string;
      pspReference: string;
      reason?: string;
      success: string;
      additionalData?: Record<string, string>;
    };
  }>;
}

class AdyenService {
  private apiKey: string;
  private merchantAccount: string;
  private environment: 'test' | 'live';
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_ADYEN_API_KEY || '';
    this.merchantAccount = import.meta.env.VITE_ADYEN_MERCHANT_ACCOUNT || '';
    this.environment = import.meta.env.VITE_ADYEN_ENVIRONMENT === 'live' ? 'live' : 'test';
    this.baseUrl = this.environment === 'live' 
      ? 'https://checkout-live.adyen.com/v71'
      : 'https://checkout-test.adyen.com/v71';
  }

  /**
   * Create a payment session
   */
  async createPaymentSession(request: Partial<AdyenPaymentRequest>): Promise<{
    success: boolean;
    sessionData?: any;
    error?: string;
  }> {
    try {
      const sessionRequest = {
        merchantAccount: this.merchantAccount,
        amount: request.amount,
        reference: request.reference,
        returnUrl: request.returnUrl,
        countryCode: 'PH', // Philippines
        shopperLocale: 'en-PH',
        channel: 'Web',
        ...request
      };

      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(sessionRequest)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Adyen session creation failed:', data);
        return {
          success: false,
          error: data.message || 'Failed to create payment session'
        };
      }

      return {
        success: true,
        sessionData: data
      };
    } catch (error) {
      console.error('Adyen session creation error:', error);
      return {
        success: false,
        error: `Session creation failed: ${error}`
      };
    }
  }

  /**
   * Make a payment
   */
  async makePayment(request: AdyenPaymentRequest): Promise<{
    success: boolean;
    payment?: AdyenPaymentResponse;
    error?: string;
  }> {
    try {
      const paymentRequest = {
        ...request,
        merchantAccount: this.merchantAccount
      };

      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(paymentRequest)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Adyen payment failed:', data);
        return {
          success: false,
          error: data.message || 'Payment failed'
        };
      }

      return {
        success: true,
        payment: data
      };
    } catch (error) {
      console.error('Adyen payment error:', error);
      return {
        success: false,
        error: `Payment failed: ${error}`
      };
    }
  }

  /**
   * Submit additional payment details (for 3D Secure, etc.)
   */
  async submitPaymentDetails(details: AdyenPaymentDetails): Promise<{
    success: boolean;
    payment?: AdyenPaymentResponse;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(details)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Adyen payment details submission failed:', data);
        return {
          success: false,
          error: data.message || 'Payment details submission failed'
        };
      }

      return {
        success: true,
        payment: data
      };
    } catch (error) {
      console.error('Adyen payment details error:', error);
      return {
        success: false,
        error: `Payment details submission failed: ${error}`
      };
    }
  }

  /**
   * Get payment methods available for the merchant
   */
  async getPaymentMethods(amount: { currency: string; value: number }, countryCode: string = 'PH'): Promise<{
    success: boolean;
    paymentMethods?: any;
    error?: string;
  }> {
    try {
      const request = {
        merchantAccount: this.merchantAccount,
        amount,
        countryCode,
        shopperLocale: 'en-PH',
        channel: 'Web'
      };

      const response = await fetch(`${this.baseUrl}/paymentMethods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Adyen payment methods fetch failed:', data);
        return {
          success: false,
          error: data.message || 'Failed to fetch payment methods'
        };
      }

      return {
        success: true,
        paymentMethods: data
      };
    } catch (error) {
      console.error('Adyen payment methods error:', error);
      return {
        success: false,
        error: `Failed to fetch payment methods: ${error}`
      };
    }
  }

  /**
   * Capture a payment
   */
  async capturePayment(pspReference: string, amount: { currency: string; value: number }): Promise<{
    success: boolean;
    capture?: any;
    error?: string;
  }> {
    try {
      const request = {
        merchantAccount: this.merchantAccount,
        amount,
        reference: `capture-${Date.now()}`
      };

      const response = await fetch(`${this.baseUrl}/payments/${pspReference}/captures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Adyen capture failed:', data);
        return {
          success: false,
          error: data.message || 'Capture failed'
        };
      }

      return {
        success: true,
        capture: data
      };
    } catch (error) {
      console.error('Adyen capture error:', error);
      return {
        success: false,
        error: `Capture failed: ${error}`
      };
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(request: AdyenRefundRequest): Promise<{
    success: boolean;
    refund?: any;
    error?: string;
  }> {
    try {
      const refundRequest = {
        ...request,
        merchantAccount: this.merchantAccount
      };

      const response = await fetch(`${this.baseUrl}/payments/${request.originalReference}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(refundRequest)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Adyen refund failed:', data);
        return {
          success: false,
          error: data.message || 'Refund failed'
        };
      }

      return {
        success: true,
        refund: data
      };
    } catch (error) {
      console.error('Adyen refund error:', error);
      return {
        success: false,
        error: `Refund failed: ${error}`
      };
    }
  }

  /**
   * Cancel or reverse a payment
   */
  async cancelPayment(pspReference: string): Promise<{
    success: boolean;
    cancellation?: any;
    error?: string;
  }> {
    try {
      const request = {
        merchantAccount: this.merchantAccount,
        reference: `cancel-${Date.now()}`
      };

      const response = await fetch(`${this.baseUrl}/payments/${pspReference}/cancels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Adyen cancellation failed:', data);
        return {
          success: false,
          error: data.message || 'Cancellation failed'
        };
      }

      return {
        success: true,
        cancellation: data
      };
    } catch (error) {
      console.error('Adyen cancellation error:', error);
      return {
        success: false,
        error: `Cancellation failed: ${error}`
      };
    }
  }

  /**
   * Verify webhook notification
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const hmacKey = import.meta.env.VITE_ADYEN_HMAC_KEY || '';
      
      if (!hmacKey) {
        console.error('HMAC key not configured');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', hmacKey)
        .update(payload)
        .digest('base64');

      return signature === expectedSignature;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process webhook notification
   */
  async processWebhookNotification(event: AdyenWebhookEvent): Promise<{
    success: boolean;
    processed: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let processed = 0;

    try {
      for (const item of event.notificationItems) {
        const notification = item.NotificationRequestItem;
        
        try {
          // Update transaction status in database
          const { error: updateError } = await supabase
            .from('transactions')
            .update({
              status: this.mapAdyenEventToStatus(notification.eventCode, notification.success === 'true'),
              external_payment_id: notification.pspReference,
              payment_provider_response: notification,
              updated_at: new Date().toISOString()
            })
            .eq('external_reference', notification.merchantReference);

          if (updateError) {
            errors.push(`Failed to update transaction ${notification.merchantReference}: ${updateError.message}`);
          } else {
            processed++;
          }
        } catch (error) {
          errors.push(`Error processing notification ${notification.pspReference}: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        processed,
        errors
      };
    } catch (error) {
      return {
        success: false,
        processed,
        errors: [`Webhook processing failed: ${error}`]
      };
    }
  }

  /**
   * Map Adyen event codes to transaction statuses
   */
  private mapAdyenEventToStatus(eventCode: string, success: boolean): string {
    if (!success) {
      return 'failed';
    }

    switch (eventCode) {
      case 'AUTHORISATION':
        return 'completed';
      case 'CAPTURE':
        return 'captured';
      case 'REFUND':
        return 'refunded';
      case 'CANCELLATION':
      case 'CANCEL_OR_REFUND':
        return 'cancelled';
      case 'CHARGEBACK':
        return 'disputed';
      default:
        return 'processing';
    }
  }

  /**
   * Get payment status
   */
  getPaymentStatus(resultCode: string): 'success' | 'pending' | 'failed' | 'cancelled' {
    switch (resultCode) {
      case 'Authorised':
      case 'Received':
        return 'success';
      case 'Pending':
      case 'ChallengeShopper':
      case 'IdentifyShopper':
      case 'RedirectShopper':
        return 'pending';
      case 'Refused':
      case 'Error':
        return 'failed';
      case 'Cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Format amount for Adyen (convert to minor units)
   */
  formatAmount(amount: number, currency: string = 'PHP'): number {
    // Most currencies use 2 decimal places (cents)
    // Some currencies like JPY use 0 decimal places
    const minorUnits = currency === 'JPY' ? 1 : 100;
    return Math.round(amount * minorUnits);
  }

  /**
   * Format amount from Adyen (convert from minor units)
   */
  parseAmount(amount: number, currency: string = 'PHP'): number {
    const minorUnits = currency === 'JPY' ? 1 : 100;
    return amount / minorUnits;
  }
}

// Export singleton instance
export const adyenService = new AdyenService();
export default adyenService;
