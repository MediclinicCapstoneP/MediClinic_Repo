import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
// Note: Using fetch API instead of Adyen API library for Edge Functions compatibility

// Types
export interface AdyenConfig {
  apiKey: string;
  merchantAccount: string;
  environment: 'test' | 'live';
  hmacKey: string;
}

export interface PaymentSessionRequest {
  patientId: string;
  clinicId: string;
  appointmentId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: 'gcash' | 'paymaya' | 'card' | 'grabpay';
  returnUrl: string;
  reference?: string;
}

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Initialize Supabase client
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Initialize Adyen configuration for fetch API
export function createAdyenClient(): { config: AdyenConfig; baseUrl: string } {
  const config: AdyenConfig = {
    apiKey: Deno.env.get('ADYEN_API_KEY')!,
    merchantAccount: Deno.env.get('ADYEN_MERCHANT_ACCOUNT') || 'IgabayAtiCare',
    environment: (Deno.env.get('ADYEN_ENVIRONMENT') as 'test' | 'live') || 'test',
    hmacKey: Deno.env.get('ADYEN_HMAC_KEY')!,
  };

  const baseUrl = config.environment === 'live' 
    ? 'https://checkout-live.adyen.com/v71'
    : 'https://checkout-test.adyen.com/v71';
  
  return { config, baseUrl };
}

// Helper function to make Adyen API calls
export async function adyenFetch(endpoint: string, data: any, apiKey: string): Promise<any> {
  const { config, baseUrl } = createAdyenClient();
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Adyen API Error: ${errorData.message || response.statusText}`);
  }

  return response.json();
}

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Validate HMAC signature for webhooks
export async function validateHmacSignature(
  payload: string,
  signature: string,
  hmacKey: string
): Promise<boolean> {
  try {
    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.replace('sha256=', '');
    
    // Create HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(hmacKey);
    const payloadData = encoder.encode(payload);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureArrayBuffer = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
    const signatureArray = new Uint8Array(signatureArrayBuffer);
    
    // Convert to hex
    const computedSignature = Array.from(signatureArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return computedSignature === cleanSignature;
  } catch (error) {
    console.error('HMAC validation error:', error);
    return false;
  }
}

// Get allowed payment methods based on preference
export function getAllowedPaymentMethods(preferredMethod?: string): string[] {
  const methodMap: { [key: string]: string[] } = {
    'gcash': ['gcash', 'scheme'],
    'paymaya': ['paymaya', 'scheme'],
    'card': ['scheme'],
    'grabpay': ['grabpay_PH', 'scheme']
  };

  if (preferredMethod && methodMap[preferredMethod]) {
    return methodMap[preferredMethod];
  }
  
  // Default: include all Philippine payment methods
  return ['scheme', 'gcash', 'paymaya', 'grabpay_PH'];
}

// Map Adyen status to local status
export function mapAdyenStatusToLocal(resultCode: string): string {
  const statusMap: { [key: string]: string } = {
    'Authorised': 'authorized',
    'Refused': 'refused',
    'Cancelled': 'cancelled',
    'Error': 'error',
    'Pending': 'pending',
    'Received': 'pending'
  };

  return statusMap[resultCode] || 'pending';
}

// Create payment record in database
export async function createPaymentRecord(
  supabase: ReturnType<typeof createSupabaseClient>,
  paymentData: {
    merchantReference: string;
    patientId: string;
    clinicId: string;
    appointmentId?: string;
    amountValue: number;
    currency: string;
    paymentMethod: string;
    status: string;
  }
): Promise<void> {
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
      throw error;
    }
  } catch (error) {
    console.error('Error in createPaymentRecord:', error);
    throw error;
  }
}

// Update payment record
export async function updatePaymentRecord(
  supabase: ReturnType<typeof createSupabaseClient>,
  merchantReference: string,
  updates: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('payments')
      .update(updates)
      .eq('merchant_reference', merchantReference);

    if (error) {
      console.error('Error updating payment record:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updatePaymentRecord:', error);
    throw error;
  }
}

// Generate unique merchant reference
export function generateMerchantReference(prefix: string = 'IGC'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

// Error response helper
export function createErrorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Success response helper
export function createSuccessResponse<T>(data: T, message?: string): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Handle OPTIONS request for CORS
export function handleOptions(): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
