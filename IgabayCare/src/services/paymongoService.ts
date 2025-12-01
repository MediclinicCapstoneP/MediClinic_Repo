/**
 * PayMongo GCash Payment Service
 * Handles GCash payments through PayMongo Payment Intent API
 */

export interface PayMongoPaymentIntent {
  id: string;
  type: 'payment_intent';
  attributes: {
    amount: number;
    currency: string;
    description?: string;
    statement_descriptor?: string;
    status: 'awaiting_payment_method' | 'awaiting_next_action' | 'processing' | 'succeeded' | 'canceled';
    client_key: string;
    next_action?: {
      type: string;
      redirect?: {
        url: string;
        return_url: string;
      };
    };
    payment_method?: {
      id: string;
      type: string;
    };
    last_payment_error?: any;
    metadata?: Record<string, any>;
  };
}

export interface PayMongoPaymentMethod {
  id: string;
  type: 'payment_method';
  attributes: {
    type: 'gcash';
    details?: Record<string, any>;
    billing?: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

export interface PayMongoError {
  code: string;
  detail: string;
  source?: {
    pointer: string;
    attribute: string;
  };
}

export interface PayMongoResponse<T> {
  data?: T;
  errors?: PayMongoError[];
}

export interface GCashPaymentRequest {
  amount: number; // Amount in centavos (e.g., 100.00 PHP = 10000)
  description: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  return_url: string;
  appointment_id?: string;
  clinic_id: string;
  metadata?: Record<string, any>;
}

export interface GCashPaymentResult {
  success: boolean;
  payment_intent_id?: string;
  client_key?: string;
  redirect_url?: string;
  status?: string;
  error?: string;
  next_action?: any;
}

class PayMongoService {
  private readonly baseUrl = 'https://api.paymongo.com/v1';
  private readonly secretKey: string;
  private readonly publicKey: string;

  constructor() {
    this.secretKey = import.meta.env.VITE_PAYMONGO_SECRET_KEY || '';
    this.publicKey = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY || '';
    
    if (!this.secretKey || !this.publicKey) {
      console.error('PayMongo API keys not configured. Please set VITE_PAYMONGO_SECRET_KEY and VITE_PAYMONGO_PUBLIC_KEY in your .env file');
      console.warn('Payment functionality will not work without proper API keys');
    }
  }

  private getAuthHeaders(useSecretKey = true): HeadersInit {
    const key = useSecretKey ? this.secretKey : this.publicKey;
    
    if (!key) {
      console.error('❌ PayMongo API key not configured:', {
        useSecretKey,
        hasSecretKey: !!this.secretKey,
        hasPublicKey: !!this.publicKey
      });
    }
    
    return {
      'Authorization': `Basic ${btoa(key)}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Create a Payment Intent for GCash payment
   */
  async createPaymentIntent(request: GCashPaymentRequest): Promise<PayMongoResponse<PayMongoPaymentIntent>> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents`, {
        method: 'POST',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify({
          data: {
            attributes: {
              amount: Math.round(request.amount * 100), // Convert to centavos
              payment_method_allowed: ['gcash'],
              payment_method_options: {
                gcash: {
                  redirect: {
                    success: request.return_url,
                    failed: request.return_url
                  }
                }
              },
              currency: 'PHP',
              description: request.description,
              statement_descriptor: 'MediClinic',
              metadata: {
                appointment_id: request.appointment_id,
                clinic_id: request.clinic_id,
                patient_name: request.patient_name,
                patient_email: request.patient_email,
                patient_phone: request.patient_phone,
                ...request.metadata
              }
            }
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { errors: data.errors || [{ code: 'unknown_error', detail: 'Failed to create payment intent' }] };
      }

      return { data: data.data };
    } catch (error) {
      console.error('PayMongo createPaymentIntent error:', error);
      return { 
        errors: [{ 
          code: 'network_error', 
          detail: 'Network error occurred while creating payment intent' 
        }] 
      };
    }
  }

  /**
   * Create a GCash Payment Method
   */
  async createGCashPaymentMethod(
    billing: { name: string; email: string; phone: string }
  ): Promise<PayMongoResponse<PayMongoPaymentMethod>> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_methods`, {
        method: 'POST',
        headers: this.getAuthHeaders(false), // Use public key for payment method creation
        body: JSON.stringify({
          data: {
            attributes: {
              type: 'gcash',
              billing: {
                name: billing.name,
                email: billing.email,
                phone: billing.phone
              }
            }
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { errors: data.errors || [{ code: 'unknown_error', detail: 'Failed to create payment method' }] };
      }

      return { data: data.data };
    } catch (error) {
      console.error('PayMongo createGCashPaymentMethod error:', error);
      return { 
        errors: [{ 
          code: 'network_error', 
          detail: 'Network error occurred while creating payment method' 
        }] 
      };
    }
  }

  /**
   * Attach Payment Method to Payment Intent
   */
  async attachPaymentIntent(
    paymentIntentId: string, 
    paymentMethodId: string,
    returnUrl: string
  ): Promise<PayMongoResponse<PayMongoPaymentIntent>> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}/attach`, {
        method: 'POST',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentMethodId,
              return_url: returnUrl
            }
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { errors: data.errors || [{ code: 'unknown_error', detail: 'Failed to attach payment intent' }] };
      }

      return { data: data.data };
    } catch (error) {
      console.error('PayMongo attachPaymentIntent error:', error);
      return { 
        errors: [{ 
          code: 'network_error', 
          detail: 'Network error occurred while attaching payment intent' 
        }] 
      };
    }
  }

  /**
   * Retrieve Payment Intent status
   */
  async getPaymentIntent(paymentIntentId: string): Promise<PayMongoResponse<PayMongoPaymentIntent>> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(true)
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { errors: data.errors || [{ code: 'unknown_error', detail: 'Failed to retrieve payment intent' }] };
      }

      return { data: data.data };
    } catch (error) {
      console.error('PayMongo getPaymentIntent error:', error);
      return { 
        errors: [{ 
          code: 'network_error', 
          detail: 'Network error occurred while retrieving payment intent' 
        }] 
      };
    }
  }

  /**
   * Process GCash payment (complete workflow)
   */
  async processGCashPayment(request: GCashPaymentRequest): Promise<GCashPaymentResult> {
    // Check if API keys are configured
    if (!this.secretKey || !this.publicKey) {
      return {
        success: false,
        error: 'PayMongo API keys not configured. Please contact support.'
      };
    }

    try {
      // Step 1: Create Payment Intent
      const intentResult = await this.createPaymentIntent(request);
      if (intentResult.errors || !intentResult.data) {
        return {
          success: false,
          error: intentResult.errors?.[0]?.detail || 'Failed to create payment intent'
        };
      }

      const paymentIntent = intentResult.data;

      // Step 2: Create GCash Payment Method
      const methodResult = await this.createGCashPaymentMethod({
        name: request.patient_name,
        email: request.patient_email,
        phone: request.patient_phone
      });

      if (methodResult.errors || !methodResult.data) {
        return {
          success: false,
          error: methodResult.errors?.[0]?.detail || 'Failed to create payment method'
        };
      }

      const paymentMethod = methodResult.data;

      // Step 3: Attach Payment Method to Payment Intent
      const attachResult = await this.attachPaymentIntent(
        paymentIntent.id,
        paymentMethod.id,
        request.return_url
      );

      if (attachResult.errors || !attachResult.data) {
        return {
          success: false,
          error: attachResult.errors?.[0]?.detail || 'Failed to attach payment method'
        };
      }

      const finalIntent = attachResult.data;

      // Return result with redirect URL for GCash authorization
      return {
        success: true,
        payment_intent_id: finalIntent.id,
        client_key: finalIntent.attributes.client_key,
        status: finalIntent.attributes.status,
        redirect_url: finalIntent.attributes.next_action?.redirect?.url,
        next_action: finalIntent.attributes.next_action
      };

    } catch (error) {
      console.error('PayMongo processGCashPayment error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during payment processing'
      };
    }
  }

  /**
   * Handle payment return/callback
   */
  async handlePaymentReturn(paymentIntentId: string): Promise<GCashPaymentResult> {
    console.log('🔍 Checking payment status for intent:', paymentIntentId);
    
    const result = await this.getPaymentIntent(paymentIntentId);
    
    if (result.errors || !result.data) {
      console.error('❌ Error retrieving payment intent:', result.errors);
      return {
        success: false,
        error: result.errors?.[0]?.detail || 'Failed to retrieve payment status'
      };
    }

    const paymentIntent = result.data;
    const status = paymentIntent.attributes.status;
    const isSuccessful = status === 'succeeded';
    
    console.log('📊 Payment status:', {
      id: paymentIntent.id,
      status: status,
      isSuccessful: isSuccessful,
      amount: paymentIntent.attributes.amount / 100, // Convert from centavos
      currency: paymentIntent.attributes.currency
    });

    return {
      success: isSuccessful,
      payment_intent_id: paymentIntent.id,
      status: status,
      error: isSuccessful ? undefined : `Payment not completed. Current status: ${status}`
    };
  }
}

export const paymongoService = new PayMongoService();
