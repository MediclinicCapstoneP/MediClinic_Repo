import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  createSupabaseClient,
  updatePaymentRecord,
  validateHmacSignature,
  mapAdyenStatusToLocal,
  createAdyenClient,
  handleOptions,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/adyen-utils.ts';

interface WebhookNotification {
  live: string;
  notificationItems: Array<{
    NotificationRequestItem: {
      additionalData?: Record<string, any>;
      amount?: {
        currency: string;
        value: number;
      };
      eventCode: string;
      eventDate: string;
      merchantAccountCode: string;
      merchantReference: string;
      pspReference: string;
      reason?: string;
      success: string;
    }
  }>;
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
    // Get raw request body for HMAC validation
    const rawBody = await req.text();
    const signature = req.headers.get('authorization') || req.headers.get('x-adyen-hmac-signature') || '';

    if (!signature) {
      console.error('Missing HMAC signature');
      return createErrorResponse('Missing HMAC signature', 401);
    }

    // Initialize clients
    const { config } = createAdyenClient();
    const supabase = createSupabaseClient();

    // Validate HMAC signature
    const isValidSignature = await validateHmacSignature(rawBody, signature, config.hmacKey);
    
    if (!isValidSignature) {
      console.error('Invalid HMAC signature');
      return createErrorResponse('Invalid HMAC signature', 401);
    }

    // Parse webhook payload
    const webhookData: WebhookNotification = JSON.parse(rawBody);
    
    if (!webhookData.notificationItems || webhookData.notificationItems.length === 0) {
      return createErrorResponse('Invalid webhook payload');
    }

    // Process each notification item
    const results = [];
    
    for (const item of webhookData.notificationItems) {
      const notification = item.NotificationRequestItem;
      
      console.log('Processing webhook notification:', {
        eventCode: notification.eventCode,
        pspReference: notification.pspReference,
        merchantReference: notification.merchantReference,
        success: notification.success
      });

      try {
        // Determine the status based on event code and success
        let status = 'pending';
        
        switch (notification.eventCode) {
          case 'AUTHORISATION':
            status = notification.success === 'true' ? 'authorized' : 'refused';
            break;
          case 'PENDING':
            status = 'pending';
            break;
          case 'CANCEL_OR_REFUND':
          case 'REFUND':
          case 'REFUND_WITH_DATA':
            status = 'refunded';
            break;
          case 'CANCELLATION':
          case 'TECHNICAL_CANCEL':
            status = 'cancelled';
            break;
          case 'REFUND_FAILED':
            status = 'refund_failed';
            break;
          case 'CAPTURE':
            status = notification.success === 'true' ? 'captured' : 'capture_failed';
            break;
          case 'CAPTURE_FAILED':
            status = 'capture_failed';
            break;
          case 'CHARGEBACK':
          case 'SECOND_CHARGEBACK':
            status = 'chargeback';
            break;
          case 'CHARGEBACK_REVERSED':
            status = 'chargeback_reversed';
            break;
          case 'MANUAL_REVIEW_ACCEPT':
            status = 'authorized';
            break;
          case 'MANUAL_REVIEW_REJECT':
            status = 'refused';
            break;
          case 'NOTIFICATION_OF_FRAUD':
            status = 'fraud_notification';
            break;
          default:
            status = mapAdyenStatusToLocal(notification.eventCode);
        }

        // Prepare update data
        const updateData: any = {
          adyen_psp_reference: notification.pspReference,
          status: status,
          updated_at: new Date().toISOString()
        };

        // Add additional data based on event type
        if (notification.eventCode === 'AUTHORISATION') {
          updateData.payment_date = notification.eventDate;
          if (notification.success === 'true') {
            updateData.confirmation_date = notification.eventDate;
          } else {
            updateData.failure_reason = notification.reason || 'Payment refused';
          }
        }

        if (notification.amount) {
          updateData.confirmed_amount = notification.amount.value;
          updateData.confirmed_currency = notification.amount.currency;
        }

        if (notification.reason) {
          updateData.failure_reason = notification.reason;
        }

        // Update payment record
        await updatePaymentRecord(supabase, notification.merchantReference, updateData);
        
        results.push({
          pspReference: notification.pspReference,
          merchantReference: notification.merchantReference,
          eventCode: notification.eventCode,
          status: 'processed'
        });

      } catch (error) {
        console.error('Error processing notification item:', error);
        results.push({
          pspReference: notification.pspReference,
          merchantReference: notification.merchantReference,
          eventCode: notification.eventCode,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Log webhook processing result
    console.log('Webhook processing completed:', {
      totalItems: webhookData.notificationItems.length,
      results: results
    });

    // Return acknowledgment (Adyen expects [accepted] response)
    return new Response('[accepted]', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        ...Object.fromEntries(
          Object.entries({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          })
        )
      }
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Still return [accepted] to prevent Adyen from retrying
    // Log the error for investigation
    return new Response('[accepted]', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
});

console.log('Adyen Webhooks function is running on port 8000');
