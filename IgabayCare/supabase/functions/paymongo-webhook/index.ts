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
  type: 'payment.created' | 'payment.updated' | 'payment.paid' | 'checkout_session.completed';
  data: {
    id: string;
    attributes: {
      amount: number;
      currency: string;
      status: string;
      payment_method?: {
        id: string;
        type: string;
      };
      metadata?: Record<string, any>;
      created_at: string;
      updated_at: string;
      line_items?: Array<{
        amount: number;
        currency: string;
        description?: string;
        name: string;
        quantity: number;
      }>;
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
        
      case 'checkout_session.completed':
        await handleCheckoutSessionCompleted(event, supabase)
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

/**
 * Handle checkout_session.completed event - Payment-first booking flow
 * NOTE: This is a backup mechanism. Client-side (PaymentReturn.tsx) should create bookings first.
 * This webhook only creates if client-side failed and status is definitely 'paid'.
 */
async function handleCheckoutSessionCompleted(event: PayMongoWebhookEvent, supabase: any) {
  const checkoutSession = event.data
  const metadata = checkoutSession.attributes.metadata
  const sessionStatus = checkoutSession.attributes.status
  
  console.log('✅ CHECKOUT SESSION COMPLETED:', {
    checkoutSessionId: checkoutSession.id,
    status: sessionStatus,
    metadata
  })

  // Only proceed if status is 'paid' - don't create bookings for 'active' status
  // Client-side will handle 'active' status
  if (sessionStatus !== 'paid') {
    console.log(`⚠️ Checkout session status is '${sessionStatus}', not 'paid'. Skipping webhook booking creation. Client-side will handle it.`);
    return;
  }

  // Extract booking details from metadata
  const patientId = metadata?.patient_id
  const clinicId = metadata?.clinic_id
  const appointmentDate = metadata?.appointment_date
  const appointmentTime = metadata?.appointment_time
  const appointmentType = metadata?.appointment_type
  const patientNotes = metadata?.patient_notes
  const consultationFee = parseFloat(metadata?.consultation_fee || '0')
  const bookingFee = parseFloat(metadata?.booking_fee || '0')
  const lineItems = checkoutSession.attributes.line_items || []
  const totalAmount = lineItems.reduce((sum: number, item: any) => sum + (item?.amount || 0), 0) / 100 || 0 // Convert from centavos

  if (patientId && clinicId && appointmentDate && appointmentTime) {
    // Check if appointment already exists for this checkout session to prevent duplicates
    // Check by payment_intent_id (checkout session ID) AND by unique combination of patient, clinic, date, time
    const { data: existingAppointment, error: checkError } = await supabase
      .from('appointments')
      .select('id')
      .eq('payment_intent_id', checkoutSession.id)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error checking for existing appointment:', checkError)
      return
    }

    if (existingAppointment) {
      console.log('⚠️ Appointment already exists for this checkout session, skipping webhook creation:', existingAppointment.id)
      return
    }
    
    // Also check for duplicate by patient, clinic, date, and time (in case payment_intent_id differs)
    const { data: duplicateAppointment } = await supabase
      .from('appointments')
      .select('id')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .eq('appointment_date', appointmentDate)
      .eq('appointment_time', appointmentTime)
      .eq('status', 'confirmed')
      .maybeSingle()
    
    if (duplicateAppointment) {
      console.log('⚠️ Duplicate appointment found by patient/clinic/date/time, skipping webhook creation:', duplicateAppointment.id)
      // Update the existing appointment with payment info if it doesn't have it
      const { data: existingAppt } = await supabase
        .from('appointments')
        .select('payment_intent_id')
        .eq('id', duplicateAppointment.id)
        .maybeSingle()
      
      if (existingAppt && !existingAppt.payment_intent_id) {
        await supabase
          .from('appointments')
          .update({
            payment_intent_id: checkoutSession.id,
            payment_status: 'paid',
            payment_method: 'paymongo_checkout'
          })
          .eq('id', duplicateAppointment.id)
      }
      return
    }

    // Fetch patient name
    let patientName = 'Patient'
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('first_name, last_name')
      .eq('id', patientId)
      .single()

    if (!patientError && patientData) {
      patientName = `${patientData.first_name} ${patientData.last_name}`
    } else {
      console.warn('⚠️ Could not fetch patient name for webhook booking:', patientError?.message)
    }

    // Create the appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([{
        patient_id: patientId,
        clinic_id: clinicId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        appointment_type: appointmentType,
        patient_notes: patientNotes,
        status: 'confirmed', // Set as confirmed since payment is completed
        payment_method: 'paymongo_checkout',
        payment_status: 'paid',
        payment_intent_id: checkoutSession.id, // Use checkout session ID as payment_intent_id
        total_amount: totalAmount,
        consultation_fee: consultationFee,
        booking_fee: bookingFee,
        patient_name: patientName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating appointment via webhook:', error)
    } else {
      console.log(`🎉 Appointment ${appointment.id} created via webhook for checkout session ${checkoutSession.id}!`)
      // Optionally, send notifications here if not handled client-side
    }
  } else {
    console.error('❌ Missing required metadata for appointment creation from checkout session:', metadata)
  }
}
