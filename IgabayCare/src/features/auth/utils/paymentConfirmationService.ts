import { supabase } from '../../../supabaseClient';
import { enhancedNotificationService } from './enhancedNotificationService';
import { adyenService } from './adyenService';

/**
 * Payment Confirmation Service
 * 
 * Handles payment verification, transaction updates, and related business logic
 * Integrates with Adyen API for payment verification and refund processing
 */

interface PaymentConfirmationData {
  transactionId: string;
  externalPaymentId: string;
  paymentMethod: string;
  paymentProvider: string;
  status: 'completed' | 'failed';
  failureReason?: string;
  paymentProofUrl?: string;
}

interface PaymentVerificationData {
  appointmentId: string;
  paymentIntentId: string;
  paymentMethodId?: string;
  amount: number;
}

export const paymentConfirmationService = {
  /**
   * Confirm payment and update appointment status
   */
  async confirmPayment(data: PaymentConfirmationData): Promise<{
    success: boolean;
    appointment?: any;
    transaction?: any;
    error?: string;
  }> {
    try {
      console.log('💳 Confirming payment:', data.transactionId);

      // Get transaction details
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          *,
          appointment:appointments(
            id,
            patient_id,
            clinic_id,
            appointment_date,
            appointment_time,
            status,
            clinic:clinics(name)
          )
        `)
        .eq('id', data.transactionId)
        .single();

      if (transactionError) {
        console.error('❌ Error fetching transaction:', transactionError);
        return { success: false, error: 'Transaction not found' };
      }

      const now = new Date().toISOString();

      if (data.status === 'completed') {
        // Update transaction as completed
        const { error: updateTransactionError } = await supabase
          .from('transactions')
          .update({
            status: 'completed',
            external_payment_id: data.externalPaymentId,
            payment_method: data.paymentMethod,
            payment_provider: data.paymentProvider,
            payment_date: now,
            confirmation_date: now,
            payment_proof_url: data.paymentProofUrl,
            updated_at: now
          })
          .eq('id', data.transactionId);

        if (updateTransactionError) {
          console.error('❌ Error updating transaction:', updateTransactionError);
          return { success: false, error: updateTransactionError.message };
        }

        // Update appointment status and payment info
        const { data: updatedAppointment, error: appointmentError } = await supabase
          .from('appointments')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            payment_id: data.externalPaymentId,
            updated_at: now
          })
          .eq('id', transaction.appointment.id)
          .select()
          .single();

        if (appointmentError) {
          console.error('❌ Error updating appointment:', appointmentError);
          return { success: false, error: appointmentError.message };
        }

        // Create payment confirmation notification
        await enhancedNotificationService.createPaymentConfirmationNotification(
          transaction.appointment.patient_id,
          transaction.appointment.id,
          data.transactionId,
          transaction.total_amount,
          data.paymentMethod,
          true // Send email
        );

        // Create appointment reminders
        const appointmentDateTime = `${transaction.appointment.appointment_date}T${transaction.appointment.appointment_time}`;
        await enhancedNotificationService.createAppointmentReminders({
          appointmentId: transaction.appointment.id,
          patientId: transaction.appointment.patient_id,
          appointmentDateTime,
          clinicName: transaction.appointment.clinic.name
        });

        console.log('✅ Payment confirmed and appointment updated');
        return { 
          success: true, 
          appointment: updatedAppointment, 
          transaction: { ...transaction, status: 'completed' }
        };

      } else {
        // Payment failed
        const { error: updateTransactionError } = await supabase
          .from('transactions')
          .update({
            status: 'failed',
            external_payment_id: data.externalPaymentId,
            payment_method: data.paymentMethod,
            payment_provider: data.paymentProvider,
            failure_reason: data.failureReason,
            updated_at: now
          })
          .eq('id', data.transactionId);

        if (updateTransactionError) {
          console.error('❌ Error updating failed transaction:', updateTransactionError);
          return { success: false, error: updateTransactionError.message };
        }

        // Update appointment payment status
        const { error: appointmentError } = await supabase
          .from('appointments')
          .update({
            payment_status: 'failed',
            updated_at: now
          })
          .eq('id', transaction.appointment.id);

        if (appointmentError) {
          console.error('❌ Error updating appointment payment status:', appointmentError);
        }

        // Create payment failure notification
        await enhancedNotificationService.createPaymentFailureNotification(
          transaction.appointment.patient_id,
          transaction.appointment.id,
          data.transactionId,
          transaction.total_amount,
          data.failureReason || 'Payment processing failed',
          true // Send email
        );

        console.log('❌ Payment failed, notifications sent');
        return { 
          success: false, 
          error: `Payment failed: ${data.failureReason || 'Unknown error'}`,
          transaction: { ...transaction, status: 'failed' }
        };
      }
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      return { success: false, error: 'Failed to confirm payment' };
    }
  },

  /**
   * Verify PayMongo payment status
   */
  async verifyPayMongoPayment(data: PaymentVerificationData): Promise<{
    success: boolean;
    paymentStatus?: string;
    error?: string;
  }> {
    try {
      console.log('🔍 Verifying PayMongo payment:', data.paymentIntentId);

      // This would integrate with PayMongo API to verify payment status
      // For now, we'll simulate the verification process
      
      const paymongoSecretKey = import.meta.env.VITE_PAYMONGO_SECRET_KEY;
      if (!paymongoSecretKey) {
        console.error('❌ PayMongo secret key not configured');
        return { success: false, error: 'Payment verification not configured' };
      }

      try {
        const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${data.paymentIntentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(paymongoSecretKey + ':')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`PayMongo API error: ${response.status}`);
        }

        const result = await response.json();
        const paymentIntent = result.data;

        console.log('✅ PayMongo payment verified:', paymentIntent.attributes.status);
        return { 
          success: true, 
          paymentStatus: paymentIntent.attributes.status 
        };

      } catch (apiError) {
        console.error('❌ PayMongo API error:', apiError);
        // Fallback to database check
        return this.checkDatabasePaymentStatus(data.appointmentId);
      }
    } catch (error) {
      console.error('❌ Error verifying PayMongo payment:', error);
      return { success: false, error: 'Failed to verify payment' };
    }
  },

  /**
   * Verify Adyen payment and update transaction
   */
  async verifyAdyenPayment(pspReference: string): Promise<{
    success: boolean;
    paymentData?: any;
    error?: string;
  }> {
    try {
      // For Adyen, we typically rely on webhooks for payment confirmation
      // This method can be used for additional verification if needed
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('external_payment_id', pspReference)
        .single();

      if (error) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      return {
        success: true,
        paymentData: transaction
      };
    } catch (error) {
      console.error('Adyen verification error:', error);
      return {
        success: false,
        error: `Payment verification failed: ${error}`
      };
    }
  },

  /**
   * Check payment status from database
   */
  async checkDatabasePaymentStatus(appointmentId: string): Promise<{
    success: boolean;
    paymentStatus?: string;
    error?: string;
  }> {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select('payment_status, payment_id')
        .eq('id', appointmentId)
        .single();

      if (error) {
        console.error('❌ Error checking appointment payment status:', error);
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        paymentStatus: appointment.payment_status 
      };
    } catch (error) {
      console.error('❌ Error checking database payment status:', error);
      return { success: false, error: 'Failed to check payment status' };
    }
  },

  /**
   * Process refund for cancelled appointment
   */
  async processRefund(appointmentId: string, reason: string): Promise<{
    success: boolean;
    refund?: any;
    error?: string;
  }> {
    try {
      console.log('💰 Processing refund for appointment:', appointmentId);

      // Get appointment and transaction details
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          transactions(*)
        `)
        .eq('id', appointmentId)
        .single();

      if (appointmentError) {
        console.error('❌ Error fetching appointment for refund:', appointmentError);
        return { success: false, error: 'Appointment not found' };
      }

      const transaction = appointment.transactions?.[0];
      if (!transaction || transaction.status !== 'completed') {
        return { success: false, error: 'No completed payment found for this appointment' };
      }

      // Process refund with payment provider
      let refundResult;
      if (transaction.payment_provider === 'adyen') {
        refundResult = await this.processAdyenRefund(
          transaction.external_payment_id,
          transaction.total_amount,
          transaction.currency || 'PHP',
          reason
        );
      } else if (transaction.payment_provider === 'paymongo') {
        // Legacy PayMongo support if needed
        return {
          success: false,
          error: 'PayMongo refunds not supported in current version'
        };
      } else {
        return {
          success: false,
          error: 'Unsupported payment provider for refunds'
        };
      }

      if (!refundResult.success) {
        return {
          success: false,
          error: refundResult.error
        };
      }

      // Create refund transaction record
      const { data: refundTransaction, error: refundError } = await supabase
        .from('transactions')
        .insert([{
          appointment_id: appointmentId,
          patient_id: appointment.patient_id,
          clinic_id: appointment.clinic_id,
          consultation_fee: -transaction.consultation_fee,
          booking_fee: -transaction.booking_fee,
          processing_fee: -transaction.processing_fee,
          total_amount: -transaction.total_amount,
          payment_method: transaction.payment_method,
          payment_provider: transaction.payment_provider,
          status: 'completed',
          notes: `Refund for cancelled appointment. Reason: ${reason}`,
          payment_date: new Date().toISOString(),
          confirmation_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (refundError) {
        console.error('❌ Error creating refund transaction:', refundError);
        return { success: false, error: refundError.message };
      }

      // Update original transaction status
      await supabase
        .from('transactions')
        .update({ status: 'refunded' })
        .eq('id', transaction.id);

      // Update appointment payment status
      await supabase
        .from('appointments')
        .update({ 
          payment_status: 'refunded',
          status: 'cancelled'
        })
        .eq('id', appointmentId);

      // Create refund notification
      await enhancedNotificationService.createNotification({
        userId: appointment.patient_id,
        userType: 'patient',
        title: 'Refund Processed',
        message: `Your refund of ₱${transaction.total_amount.toFixed(2)} has been processed for your cancelled appointment. The amount will be credited back to your payment method within 3-5 business days.`,
        type: 'refund_confirmation',
        notificationType: 'payment_confirmed',
        appointmentId,
        transactionId: refundTransaction.id,
        sendEmail: true
      });

      console.log('✅ Refund processed successfully');
      return { success: true, refund: refundTransaction };
    } catch (error) {
      console.error('❌ Error processing refund:', error);
      return { success: false, error: 'Failed to process refund' };
    }
  },

  /**
   * Process Adyen refund
   */
  async processAdyenRefund(originalReference: string, amount: number, currency: string, _reason: string): Promise<{
    success: boolean;
    refundData?: any;
    error?: string;
  }> {
    try {
      const refundResult = await adyenService.refundPayment({
        merchantAccount: process.env.VITE_ADYEN_MERCHANT_ACCOUNT || '',
        amount: {
          currency,
          value: adyenService.formatAmount(amount, currency)
        },
        reference: `refund-${Date.now()}`,
        originalReference
      });

      if (!refundResult.success) {
        return {
          success: false,
          error: refundResult.error || 'Refund failed'
        };
      }

      return {
        success: true,
        refundData: refundResult.refund
      };
    } catch (error) {
      console.error('Adyen refund error:', error);
      return {
        success: false,
        error: `Refund processing failed: ${error}`
      };
    }
  },

  /**
   * Get payment history for a patient
   */
  async getPatientPaymentHistory(patientId: string): Promise<{
    success: boolean;
    payments?: any[];
    error?: string;
  }> {
    try {
      const { data: payments, error } = await supabase
        .from('transactions')
        .select(`
          *,
          appointment:appointments(
            appointment_date,
            appointment_time,
            appointment_type,
            clinic:clinics(name)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching payment history:', error);
        return { success: false, error: error.message };
      }

      return { success: true, payments: payments || [] };
    } catch (error) {
      console.error('❌ Error fetching payment history:', error);
      return { success: false, error: 'Failed to fetch payment history' };
    }
  },

  /**
   * Get clinic revenue summary
   */
  async getClinicRevenue(clinicId: string, startDate?: string, endDate?: string): Promise<{
    success: boolean;
    revenue?: {
      total: number;
      completed: number;
      pending: number;
      refunded: number;
      transactionCount: number;
    };
    error?: string;
  }> {
    try {
      let query = supabase
        .from('transactions')
        .select('total_amount, status')
        .eq('clinic_id', clinicId);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: transactions, error } = await query;

      if (error) {
        console.error('❌ Error fetching clinic revenue:', error);
        return { success: false, error: error.message };
      }

      const revenue = {
        total: 0,
        completed: 0,
        pending: 0,
        refunded: 0,
        transactionCount: transactions?.length || 0
      };

      transactions?.forEach(transaction => {
        const amount = transaction.total_amount;
        revenue.total += amount;

        switch (transaction.status) {
          case 'completed':
            revenue.completed += amount;
            break;
          case 'pending':
            revenue.pending += amount;
            break;
          case 'refunded':
            revenue.refunded += amount;
            break;
        }
      });

      return { success: true, revenue };
    } catch (error) {
      console.error('❌ Error calculating clinic revenue:', error);
      return { success: false, error: 'Failed to calculate revenue' };
    }
  }
};
