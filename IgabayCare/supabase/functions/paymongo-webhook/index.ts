/**
 * PayMongo Webhook Handler for Supabase Edge Functions
 * This provides a public URL that PayMongo can reach
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paymongo-signature',
}

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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔔 PayMongo webhook received:', req.method)

    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      })
    }

    // Get webhook signature
    const signature = req.headers.get('paymongo-signature')
    const payload = await req.text()
    
    console.log('📝 Webhook payload received, length:', payload.length)

    // Parse webhook event
    const event: PayMongoWebhookEvent = JSON.parse(payload)
    console.log('📊 Event type:', event.type, 'Payment ID:', event.data.id)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle different event types
    switch (event.type) {
      case 'payment.paid':
        await handlePaymentPaid(event, supabase)
        break
        
      case 'payment.updated':
        await handlePaymentUpdated(event, supabase)
        break
        
      case 'payment.created':
        await handlePaymentCreated(event, supabase)
        break
        
      default:
        console.log('ℹ️ Unhandled webhook event type:', event.type)
    }

    // Always return 200 to PayMongo
    return new Response(
      JSON.stringify({ received: true, event: event.type }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Handle payment.paid event - SUCCESS!
 */
async function handlePaymentPaid(event: PayMongoWebhookEvent, supabase: any) {
  const payment = event.data
  const appointmentId = payment.attributes.metadata?.appointment_id
  
  console.log('✅ PAYMENT SUCCESSFUL:', {
    paymentId: payment.id,
    amount: payment.attributes.amount / 100,
    appointmentId
  })
  
  if (appointmentId) {
    // Update appointment to paid status
    const { error } = await supabase
      .from('appointments')
      .update({
        payment_status: 'paid',
        payment_intent_id: payment.id,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
    
    if (error) {
      console.error('❌ Error updating appointment:', error)
    } else {
      console.log(`🎉 Appointment ${appointmentId} payment confirmed!`)
    }
  }
}

/**
 * Handle payment.updated event
 */
async function handlePaymentUpdated(event: PayMongoWebhookEvent, supabase: any) {
  const payment = event.data
  const appointmentId = payment.attributes.metadata?.appointment_id
  
  console.log('🔄 Payment updated:', {
    paymentId: payment.id,
    status: payment.attributes.status,
    appointmentId
  })
  
  if (appointmentId) {
    // Update appointment based on payment status
    let paymentStatus = 'pending'
    
    switch (payment.attributes.status) {
      case 'awaiting_payment_method':
        paymentStatus = 'pending'
        break
      case 'processing':
        paymentStatus = 'processing'
        break
      case 'failed':
        paymentStatus = 'failed'
        break
      case 'canceled':
        paymentStatus = 'cancelled'
        break
    }
    
    const { error } = await supabase
      .from('appointments')
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
    
    if (error) {
      console.error('❌ Error updating appointment status:', error)
    } else {
      console.log(`📅 Appointment ${appointmentId} status updated to: ${paymentStatus}`)
    }
  }
}

/**
 * Handle payment.created event
 */
async function handlePaymentCreated(event: PayMongoWebhookEvent, supabase: any) {
  const payment = event.data
  const appointmentId = payment.attributes.metadata?.appointment_id
  
  console.log('💳 Payment created:', {
    paymentId: payment.id,
    amount: payment.attributes.amount / 100,
    appointmentId
  })
  
  // You could update appointment to 'payment_pending' here if needed
}
