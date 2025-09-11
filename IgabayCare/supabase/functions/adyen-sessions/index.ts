import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  createAdyenClient,
  createSupabaseClient,
  createPaymentRecord,
  generateMerchantReference,
  getAllowedPaymentMethods,
  handleOptions,
  createErrorResponse,
  createSuccessResponse,
  PaymentSessionRequest,
} from '../_shared/adyen-utils.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405);
  }

  try {
    // Parse request body
    const requestBody: PaymentSessionRequest = await req.json();
    
    // Validate required fields
    if (!requestBody.patientId || !requestBody.clinicId || !requestBody.amount || !requestBody.returnUrl) {
      return createErrorResponse('Missing required fields: patientId, clinicId, amount, returnUrl');
    }

    // Initialize clients
    const { client, config } = createAdyenClient();
    const supabase = createSupabaseClient();

    // Convert amount to cents (Adyen uses minor units)
    const amountValue = Math.round(requestBody.amount * 100);
    
    // Generate unique merchant reference
    const merchantReference = requestBody.reference || generateMerchantReference();
    
    // Prepare session request
    const sessionRequest = {
      merchantAccount: config.merchantAccount,
      amount: {
        currency: requestBody.currency || 'PHP',
        value: amountValue
      },
      reference: merchantReference,
      returnUrl: requestBody.returnUrl,
      countryCode: 'PH',
      shopperLocale: 'en_PH',
      channel: 'Web',
      allowedPaymentMethods: getAllowedPaymentMethods(requestBody.paymentMethod),
      lineItems: [{
        id: requestBody.appointmentId || 'consultation',
        description: 'Medical Consultation Fee',
        amountIncludingTax: amountValue,
        quantity: 1
      }],
      additionalData: {
        allow3DS2: 'true'
      },
      metadata: {
        patientId: requestBody.patientId,
        clinicId: requestBody.clinicId,
        appointmentId: requestBody.appointmentId || ''
      }
    };

    // Call Adyen Sessions API
    const checkout = client.checkout;
    const sessionResponse = await checkout.sessions(sessionRequest);

    if (!sessionResponse.id || !sessionResponse.sessionData) {
      console.error('Invalid session response:', sessionResponse);
      return createErrorResponse('Failed to create payment session');
    }

    // Store payment record in database
    await createPaymentRecord(supabase, {
      merchantReference,
      patientId: requestBody.patientId,
      clinicId: requestBody.clinicId,
      appointmentId: requestBody.appointmentId,
      amountValue,
      currency: requestBody.currency || 'PHP',
      paymentMethod: requestBody.paymentMethod || 'gcash',
      status: 'pending'
    });

    // Return session data for frontend
    const responseData = {
      sessionId: sessionResponse.id,
      sessionData: sessionResponse.sessionData,
      amount: sessionResponse.amount,
      merchantAccount: sessionResponse.merchantAccount,
      reference: merchantReference,
      returnUrl: sessionResponse.returnUrl
    };

    return createSuccessResponse(responseData, 'Payment session created successfully');

  } catch (error) {
    console.error('Error creating payment session:', error);
    
    // Handle Adyen API errors
    if (error.message && error.message.includes('Adyen')) {
      return createErrorResponse(`Adyen API Error: ${error.message}`, 400);
    }
    
    return createErrorResponse('Failed to create payment session', 500);
  }
});

console.log('Adyen Sessions function is running on port 8000');
