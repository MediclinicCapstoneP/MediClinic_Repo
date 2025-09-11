import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  createAdyenClient,
  createSupabaseClient,
  updatePaymentRecord,
  mapAdyenStatusToLocal,
  handleOptions,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/adyen-utils.ts';

interface PaymentRequest {
  paymentData: any;
  stateData?: any;
  merchantReference?: string;
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
    // Parse request body
    const requestBody: PaymentRequest = await req.json();
    
    if (!requestBody.paymentData) {
      return createErrorResponse('Missing required field: paymentData');
    }

    // Initialize clients
    const { client, config } = createAdyenClient();
    const supabase = createSupabaseClient();

    // Prepare payment request
    const paymentRequest = {
      merchantAccount: config.merchantAccount,
      ...requestBody.paymentData,
      ...(requestBody.stateData || {}),
      additionalData: {
        allow3DS2: 'true',
        ...requestBody.paymentData.additionalData
      }
    };

    // Call Adyen Payments API
    const checkout = client.checkout;
    const paymentResponse = await checkout.payments(paymentRequest);

    // Update payment record if we have merchant reference and PSP reference
    if (paymentResponse.pspReference && requestBody.merchantReference) {
      await updatePaymentRecord(supabase, requestBody.merchantReference, {
        adyen_psp_reference: paymentResponse.pspReference,
        adyen_result_code: paymentResponse.resultCode,
        adyen_response: paymentResponse,
        status: mapAdyenStatusToLocal(paymentResponse.resultCode)
      });
    }

    // Prepare response
    const responseData = {
      success: paymentResponse.resultCode === 'Authorised',
      paymentId: paymentResponse.pspReference,
      pspReference: paymentResponse.pspReference,
      resultCode: paymentResponse.resultCode,
      action: paymentResponse.action,
      redirectUrl: paymentResponse.redirect?.url,
      merchantReference: requestBody.merchantReference
    };

    return createSuccessResponse(responseData, 'Payment processed successfully');

  } catch (error) {
    console.error('Error processing payment:', error);
    
    // Handle Adyen API errors
    if (error.message && error.message.includes('Adyen')) {
      return createErrorResponse(`Adyen API Error: ${error.message}`, 400);
    }
    
    return createErrorResponse('Payment processing failed', 500);
  }
});

console.log('Adyen Payments function is running on port 8000');
