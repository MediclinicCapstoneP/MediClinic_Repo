import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  createAdyenClient,
  handleOptions,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/adyen-utils.ts';

interface PaymentDetailsRequest {
  details: any;
  paymentData?: any;
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
    const requestBody: PaymentDetailsRequest = await req.json();
    
    if (!requestBody.details) {
      return createErrorResponse('Missing required field: details');
    }

    // Initialize Adyen client
    const { client } = createAdyenClient();

    // Prepare details request
    const detailsRequest = {
      details: requestBody.details,
      paymentData: requestBody.paymentData,
    };

    // Call Adyen Payments/details API
    const checkout = client.checkout;
    const detailsResponse = await checkout.paymentsDetails(detailsRequest);

    return createSuccessResponse(detailsResponse, 'Payment details processed successfully');

  } catch (error) {
    console.error('Error processing payment details:', error);
    
    // Handle Adyen API errors
    if (error.message && error.message.includes('Adyen')) {
      return createErrorResponse(`Adyen API Error: ${error.message}`, 400);
    }
    
    return createErrorResponse('Payment details processing failed', 500);
  }
});

console.log('Adyen Payment Details function is running on port 8000');
