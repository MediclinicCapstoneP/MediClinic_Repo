/**
 * PayMongo Webhook Handler
 * Handles payment status updates from PayMongo
 */

import { Request, Response } from 'express';
import crypto from 'crypto';

// PayMongo webhook event types
interface PayMongoWebhookEvent {
  id: string;
  type: 'payment.created' | 'payment.updated' | 'payment.paid';
  data: {
    id: string;
    attributes: {
      amount: number;
      currency: string;
      status: string;
      payment_method: {
        id: string;
        type: string;
      };
      metadata?: Record<string, any>;
      created_at: string;
      updated_at: string;
    };
  };
}

/**
 * Verify PayMongo webhook signature
 */
export function verifyPayMongoWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Handle PayMongo webhook events
 */
export async function handlePayMongoWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const signature = req.headers['paymongo-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    // Verify webhook signature (if secret is configured)
    const webhookSecret = process.env.VITE_PAYMONGO_WEBHOOK_SECRET;
    if (webhookSecret && !verifyPayMongoWebhook(payload, signature, webhookSecret)) {
      console.error('❌ Invalid webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const event: PayMongoWebhookEvent = req.body;
    console.log('🔔 Received PayMongo webhook event:', event.type, event.data.id);

    // Handle different event types
    switch (event.type) {
      case 'payment.created':
        await handlePaymentCreated(event);
        break;
        
      case 'payment.updated':
        await handlePaymentUpdated(event);
        break;
        
      case 'payment.paid':
        await handlePaymentPaid(event);
        break;
        
      default:
        console.log('ℹ️ Unhandled webhook event type:', event.type);
    }

    // Always return 200 to PayMongo (even if we don't handle the event)
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

/**
 * Handle payment.created event
 */
async function handlePaymentCreated(event: PayMongoWebhookEvent): Promise<void> {
  const payment = event.data;
  const appointmentId = payment.attributes.metadata?.appointment_id;
  
  console.log('💳 Payment created:', {
    paymentId: payment.id,
    amount: payment.attributes.amount / 100,
    status: payment.attributes.status,
    appointmentId
  });
  
  // You can update appointment status to 'payment_pending' here
  if (appointmentId) {
    // TODO: Update appointment in database
    console.log(`📅 Updating appointment ${appointmentId} to payment_pending`);
  }
}

/**
 * Handle payment.updated event
 */
async function handlePaymentUpdated(event: PayMongoWebhookEvent): Promise<void> {
  const payment = event.data;
  const appointmentId = payment.attributes.metadata?.appointment_id;
  
  console.log('🔄 Payment updated:', {
    paymentId: payment.id,
    status: payment.attributes.status,
    appointmentId
  });
  
  // Update appointment based on payment status
  if (appointmentId) {
    switch (payment.attributes.status) {
      case 'awaiting_payment_method':
        console.log(`⏳ Appointment ${appointmentId}: Awaiting payment method`);
        break;
      case 'processing':
        console.log(`⚡ Appointment ${appointmentId}: Payment processing`);
        break;
      case 'failed':
        console.log(`❌ Appointment ${appointmentId}: Payment failed`);
        // TODO: Update appointment payment_status to 'failed'
        break;
    }
  }
}

/**
 * Handle payment.paid event (SUCCESS!)
 */
async function handlePaymentPaid(event: PayMongoWebhookEvent): Promise<void> {
  const payment = event.data;
  const appointmentId = payment.attributes.metadata?.appointment_id;
  const paymentIntentId = payment.id;
  
  console.log('✅ PAYMENT SUCCESSFUL:', {
    paymentId: payment.id,
    amount: payment.attributes.amount / 100,
    appointmentId,
    paymentIntentId
  });
  
  // This is the success case - update appointment to paid
  if (appointmentId) {
    // TODO: Update appointment in database
    // - Set payment_status = 'paid'
    // - Set payment_intent_id = paymentIntentId
    // - Send confirmation notifications
    console.log(`🎉 Appointment ${appointmentId} payment confirmed!`);
    
    // Send success notification (if you have notification service)
    // await sendPaymentConfirmationNotification(appointmentId);
  }
}

/**
 * Simple webhook handler for development (without Express)
 */
export function createSimpleWebhookHandler() {
  // This can be used with Vite's server or any Node.js server
  return async (request: Request, response: Response) => {
    await handlePayMongoWebhook(request, response);
  };
}
