import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PaymentSessionRequest {
  patientId: string;
  clinicId: string;
  appointmentId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: 'gcash' | 'paymaya' | 'card' | 'grabpay';
  returnUrl: string;
  reference?: string;
}

function createErrorResponse(message: string, status: number = 400): Response {
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

function createSuccessResponse<T>(data: T, message?: string): Response {
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

function handleOptions(): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

function generateMerchantReference(prefix: string = 'IGC'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

function getAllowedPaymentMethods(preferredMethod?: string): string[] {
  const methodMap: { [key: string]: string[] } = {
    'gcash': ['gcash'],
    'paymaya': ['paymaya'],
    'card': ['scheme'],
    'grabpay': ['grabpay_PH']
  };

  if (preferredMethod && methodMap[preferredMethod]) {
    return methodMap[preferredMethod];
  }
  
  // Default: include all Philippine payment methods
  return ['gcash', 'paymaya', 'scheme', 'grabpay_PH'];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    console.log('=== Adyen Sessions Function Started ===');
    
    // Check environment variables
    const apiKey = Deno.env.get('ADYEN_API_KEY');
    const merchantAccount = Deno.env.get('ADYEN_MERCHANT_ACCOUNT');
    const environment = Deno.env.get('ADYEN_ENVIRONMENT') || 'test';
    
    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      merchantAccount,
      environment
    });
    
    if (!apiKey || !merchantAccount) {
      console.error('Missing Adyen configuration:', { apiKey: !!apiKey, merchantAccount: !!merchantAccount });
      return createErrorResponse('Adyen configuration missing');
    }

    // Parse request body
    let requestBody: PaymentSessionRequest;
    try {
      requestBody = await req.json();
      console.log('Request body parsed:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return createErrorResponse('Invalid JSON in request body');
    }
    
    // Validate required fields
    if (!requestBody.patientId || !requestBody.clinicId || !requestBody.amount || !requestBody.returnUrl) {
      console.error('Missing required fields:', requestBody);
      return createErrorResponse('Missing required fields: patientId, clinicId, amount, returnUrl');
    }

    // Convert amount to cents (Adyen uses minor units)
    const amountValue = Math.round(requestBody.amount * 100);
    
    // Generate unique merchant reference
    const merchantReference = requestBody.reference || generateMerchantReference();
    
    console.log('Processing payment session:', { 
      amount: amountValue, 
      merchantReference,
      paymentMethod: requestBody.paymentMethod 
    });
    
    // Prepare session request for Adyen
    const sessionRequest = {
      merchantAccount: merchantAccount,
      amount: {
        currency: requestBody.currency || 'PHP',
        value: amountValue
      },
      reference: merchantReference,
      returnUrl: requestBody.returnUrl,
      countryCode: 'PH',
      shopperLocale: 'en_PH',
      channel: 'Web',
      allowedPaymentMethods: getAllowedPaymentMethods(requestBody.paymentMethod)
    };

    console.log('Adyen session request:', JSON.stringify(sessionRequest, null, 2));

    // Determine Adyen API URL based on environment
    const baseUrl = environment === 'live' 
      ? 'https://checkout-live.adyen.com/v71'
      : 'https://checkout-test.adyen.com/v71';

    // Call Adyen Sessions API
    console.log('Calling Adyen API:', `${baseUrl}/sessions`);
    const response = await fetch(`${baseUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(sessionRequest),
    });

    console.log('Adyen API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Adyen API Error:', errorData);
      return createErrorResponse(`Adyen API Error: ${errorData.message || response.statusText}`, response.status);
    }

    const sessionResponse = await response.json();
    console.log('Adyen session response:', sessionResponse);

    if (!sessionResponse.id || !sessionResponse.sessionData) {
      console.error('Invalid session response - missing id or sessionData');
      return createErrorResponse('Invalid session response from Adyen');
    }

    // Return session data for frontend
    const responseData = {
      sessionId: sessionResponse.id,
      sessionData: sessionResponse.sessionData,
      amount: sessionResponse.amount,
      merchantAccount: sessionResponse.merchantAccount,
      reference: merchantReference,
      returnUrl: sessionResponse.returnUrl
    };

    console.log('Successfully created payment session:', responseData.sessionId);
    return createSuccessResponse(responseData, 'Payment session created successfully');

  } catch (error) {
    console.error('=== Error in payment session creation ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // More specific error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return createErrorResponse('Network error: Could not connect to Adyen API', 503);
    }
    
    if (error.message && error.message.includes('Adyen')) {
      return createErrorResponse(`Adyen API Error: ${error.message}`, 400);
    }
    
    return createErrorResponse(`Internal server error: ${error.message}`, 500);
  }
});

console.log('Adyen Sessions function is ready');
