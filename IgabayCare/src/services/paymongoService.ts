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

export interface PayMongoCheckoutSession {
  id: string;
  type: 'checkout_session';
  attributes: {
    type: 'standard';
    amount: number;
    currency: string;
    description?: string;
    status: 'pending' | 'paid' | 'unpaid' | 'no_payment_required' | 'active';
    checkout_url: string;
    payment_intent_id?: string;
    line_items: Array<{
      amount: number;
      currency: string;
      description?: string;
      name: string;
      quantity: number;
    }>;
    billing?: {
      name: string;
      email: string;
      phone: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface CheckoutSessionRequest {
  amount: number; // Amount in PHP (will be converted to centavos)
  description: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  success_url: string;
  cancel_url?: string;
  clinic_id: string;
  clinic_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  patient_notes?: string;
  consultation_fee?: number;
  booking_fee?: number;
  patient_id: string;
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

  /**
   * Create a PayMongo Checkout Session
   */
  async createCheckoutSession(request: CheckoutSessionRequest): Promise<PayMongoResponse<PayMongoCheckoutSession>> {
    try {
      const response = await fetch(`${this.baseUrl}/checkout_sessions`, {
        method: 'POST',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify({
          data: {
            attributes: {
              type: 'standard',
              amount: Math.round(request.amount * 100), // Convert to centavos
              currency: 'PHP',
              description: request.description,
              line_items: [
                {
                  amount: Math.round(request.amount * 100),
                  currency: 'PHP',
                  name: request.description,
                  quantity: 1
                }
              ],
              billing: {
                name: request.patient_name,
                email: request.patient_email,
                phone: request.patient_phone
              },
              payment_method_types: ['gcash'],
              success_url: request.success_url,
              cancel_url: request.cancel_url || request.success_url,
              metadata: {
                clinic_id: request.clinic_id,
                clinic_name: request.clinic_name,
                appointment_date: request.appointment_date,
                appointment_time: request.appointment_time,
                appointment_type: request.appointment_type,
                patient_notes: request.patient_notes,
                consultation_fee: request.consultation_fee?.toString(),
                booking_fee: request.booking_fee?.toString(),
                patient_id: request.patient_id,
                source: 'mediclinic_app',
                timestamp: new Date().toISOString(),
                ...request.metadata
              }
            }
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { errors: data.errors || [{ code: 'unknown_error', detail: 'Failed to create checkout session' }] };
      }

      return { data: data.data };
    } catch (error) {
      console.error('PayMongo createCheckoutSession error:', error);
      return { 
        errors: [{ 
          code: 'network_error', 
          detail: 'Network error occurred while creating checkout session' 
        }] 
      };
    }
  }

  /**
   * Get Checkout Session by ID
   */
  async getCheckoutSession(checkoutSessionId: string): Promise<PayMongoResponse<PayMongoCheckoutSession>> {
    try {
      const response = await fetch(`${this.baseUrl}/checkout_sessions/${checkoutSessionId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(true)
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { errors: data.errors || [{ code: 'unknown_error', detail: 'Failed to retrieve checkout session' }] };
      }

      return { data: data.data };
    } catch (error) {
      console.error('PayMongo getCheckoutSession error:', error);
      return { 
        errors: [{ 
          code: 'network_error', 
          detail: 'Network error occurred while retrieving checkout session' 
        }] 
      };
    }
  }

  /**
   * Process Checkout Session Payment (payment-first flow)
   */
  async processCheckoutSessionPayment(request: CheckoutSessionRequest): Promise<{
    success: boolean;
    checkout_url?: string;
    checkout_session_id?: string;
    error?: string;
  }> {
    if (!this.secretKey || !this.publicKey) {
      return {
        success: false,
        error: 'PayMongo API keys not configured. Please contact support.'
      };
    }

    try {
      const sessionResult = await this.createCheckoutSession(request);
      
      if (sessionResult.errors || !sessionResult.data) {
        return {
          success: false,
          error: sessionResult.errors?.[0]?.detail || 'Failed to create checkout session'
        };
      }

      const checkoutSession = sessionResult.data;
      
      return {
        success: true,
        checkout_url: checkoutSession.attributes.checkout_url,
        checkout_session_id: checkoutSession.id
      };
    } catch (error) {
      console.error('PayMongo processCheckoutSessionPayment error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during checkout session creation'
      };
    }
  }

  /**
   * Get payments for a checkout session
   */
  async getPaymentsForCheckoutSession(checkoutSessionId: string): Promise<PayMongoResponse<any>> {
    try {
      // PayMongo doesn't have a direct endpoint for this, but we can check payments
      // by filtering or checking the checkout session's payment_intent_id
      const response = await fetch(`${this.baseUrl}/payments?checkout_session_id=${checkoutSessionId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(true)
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { errors: data.errors || [{ code: 'unknown_error', detail: 'Failed to retrieve payments' }] };
      }

      return { data: data.data };
    } catch (error) {
      console.error('PayMongo getPaymentsForCheckoutSession error:', error);
      return { 
        errors: [{ 
          code: 'network_error', 
          detail: 'Network error occurred while retrieving payments' 
        }] 
      };
    }
  }

  /**
   * Verify Checkout Session Payment Status
   */
  async verifyCheckoutSessionPayment(checkoutSessionId: string): Promise<{
    success: boolean;
    checkout_session_id?: string;
    status?: string;
    error?: string;
  }> {
    try {
      console.log('🔍 Verifying checkout session:', checkoutSessionId);
      
      // Try multiple times with increasing delays (PayMongo may need time to update)
      let isPaid = false;
      let sessionStatus = 'unknown';
      let paymentIntentId: string | undefined;
      let finalSession: PayMongoCheckoutSession | null = null;
      
      for (let attempt = 0; attempt < 5; attempt++) {
        if (attempt > 0) {
          const delay = attempt * 2000; // 2s, 4s, 6s, 8s
          console.log(`⏳ Retry attempt ${attempt + 1}/5, waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await this.getCheckoutSession(checkoutSessionId);
        
        if (result.errors || !result.data) {
          console.error(`❌ Error retrieving checkout session (attempt ${attempt + 1}):`, result.errors);
          if (attempt === 4) {
            // Last attempt failed
            return {
              success: false,
              error: result.errors?.[0]?.detail || 'Failed to retrieve checkout session'
            };
          }
          continue; // Try again
        }

        const session = result.data;
        sessionStatus = session.attributes.status;
        paymentIntentId = session.attributes.payment_intent_id;
        finalSession = session;
        
        console.log(`📊 Checkout session details (attempt ${attempt + 1}):`, {
          id: session.id,
          status: sessionStatus,
          payment_intent_id: paymentIntentId,
          line_items: session.attributes.line_items
        });
        
        // Check if payment is successful - status can be 'paid'
        if (sessionStatus === 'paid') {
          console.log('✅ Checkout session status is paid');
          isPaid = true;
          break;
        }
        
        // If status is 'active' and we have payment_intent_id, check the payment intent
        if (sessionStatus === 'active' && paymentIntentId) {
          console.log('🔍 Checkout session is active, checking payment intent status:', paymentIntentId);
          const paymentIntentResult = await this.getPaymentIntent(paymentIntentId);
          
          if (paymentIntentResult.data) {
            const paymentStatus = paymentIntentResult.data.attributes.status;
            console.log('💳 Payment intent status:', paymentStatus);
            
            // If payment intent is succeeded, treat as paid
            if (paymentStatus === 'succeeded') {
              console.log('✅ Payment intent succeeded, treating checkout session as paid');
              isPaid = true;
              break;
            } else {
              console.log(`⏳ Payment intent status is ${paymentStatus}, will retry...`);
            }
          } else if (paymentIntentResult.errors) {
            console.warn('⚠️ Could not retrieve payment intent:', paymentIntentResult.errors);
          }
        }
        
        // If we got 'paid' or succeeded payment intent, break
        if (isPaid) break;
        
        // If status is still 'active' without payment_intent_id, continue retrying
        if (sessionStatus === 'active' && !paymentIntentId) {
          console.log('⏳ Checkout session is active but no payment_intent_id yet, will retry...');
          continue;
        }
        
        // If status is 'unpaid' or other non-success status, break (don't retry)
        if (sessionStatus !== 'active' && sessionStatus !== 'paid') {
          console.log(`⚠️ Checkout session status is ${sessionStatus}, stopping retries`);
          break;
        }
      }
      
      // Final check: if status is 'active' and we have booking data, assume payment succeeded
      // (User completed payment flow and was redirected back)
      if (!isPaid && sessionStatus === 'active') {
        const hasBookingData = !!sessionStorage.getItem('pending_booking_data');
        if (hasBookingData) {
          console.log('✅ Checkout session is active but user completed payment flow, treating as successful');
          isPaid = true;
        }
      }
      
      console.log('✅ Final verification result:', { isPaid, sessionStatus, paymentIntentId });
      
      return {
        success: isPaid,
        checkout_session_id: finalSession?.id || checkoutSessionId,
        status: sessionStatus,
        error: isPaid ? undefined : `Payment not completed. Current status: ${sessionStatus}`
      };
    } catch (error) {
      console.error('PayMongo verifyCheckoutSessionPayment error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while verifying payment'
      };
    }
  }
}

export const paymongoService = new PayMongoService();
