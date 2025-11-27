import { supabase } from '../supabaseClient';
import {
  ClinicPaymentMethod,
  CreateClinicPaymentMethodData,
  UpdateClinicPaymentMethodData,
  PaymentTransaction,
  CreatePaymentTransactionData,
  UpdatePaymentTransactionData,
  PatientPaymentMethod,
  CreatePatientPaymentMethodData,
  PaymentFeesConfig,
  PaymentMethodType,
  PaymentServiceResponse,
  PaymentRequest,
  PaymentResponse,
  PaymentVerificationRequest,
  PaymentVerificationResponse,
  FeeCalculation,
  PaymentMethodOption
} from '../types/payment';

// ===================================================================
// CLINIC PAYMENT METHODS SERVICE
// ===================================================================
export class ClinicPaymentMethodService {
  
  /**
   * Get all payment methods for a clinic
   */
  static async getClinicPaymentMethods(clinicId: string): Promise<PaymentServiceResponse<ClinicPaymentMethod[]>> {
    try {
      const { data, error } = await supabase
        .from('clinic_payment_methods')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clinic payment methods:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getClinicPaymentMethods:', error);
      return { success: false, error: 'Failed to fetch payment methods' };
    }
  }

  /**
   * Get enabled payment methods for a clinic (for patient view)
   */
  static async getEnabledPaymentMethods(clinicId: string): Promise<PaymentServiceResponse<ClinicPaymentMethod[]>> {
    try {
      const { data, error } = await supabase
        .from('clinic_payment_methods')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_enabled', true)
        .eq('status', 'active')
        .order('method_type');

      if (error) {
        console.error('Error fetching enabled payment methods:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getEnabledPaymentMethods:', error);
      return { success: false, error: 'Failed to fetch payment methods' };
    }
  }

  /**
   * Create a new payment method for a clinic
   */
  static async createPaymentMethod(data: CreateClinicPaymentMethodData): Promise<PaymentServiceResponse<ClinicPaymentMethod>> {
    try {
      const { data: result, error } = await supabase
        .from('clinic_payment_methods')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Error creating payment method:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in createPaymentMethod:', error);
      return { success: false, error: 'Failed to create payment method' };
    }
  }

  /**
   * Update a payment method
   */
  static async updatePaymentMethod(data: UpdateClinicPaymentMethodData): Promise<PaymentServiceResponse<ClinicPaymentMethod>> {
    try {
      const { id, ...updateData } = data;
      
      const { data: result, error } = await supabase
        .from('clinic_payment_methods')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating payment method:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in updatePaymentMethod:', error);
      return { success: false, error: 'Failed to update payment method' };
    }
  }

  /**
   * Delete a payment method
   */
  static async deletePaymentMethod(id: string): Promise<PaymentServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('clinic_payment_methods')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting payment method:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: true };
    } catch (error) {
      console.error('Error in deletePaymentMethod:', error);
      return { success: false, error: 'Failed to delete payment method' };
    }
  }
}

// ===================================================================
// PAYMENT TRANSACTION SERVICE
// ===================================================================
export class PaymentTransactionService {

  /**
   * Create a new payment transaction
   */
  static async createTransaction(data: CreatePaymentTransactionData): Promise<PaymentServiceResponse<PaymentTransaction>> {
    try {
      // Generate transaction number using database function
      const { data: transactionNumber, error: numberError } = await supabase
        .rpc('generate_transaction_number');

      if (numberError) {
        console.error('Error generating transaction number:', numberError);
        return { success: false, error: 'Failed to generate transaction number' };
      }

      const transactionData = {
        ...data,
        transaction_number: transactionNumber,
        status: 'pending' as const
      };

      const { data: result, error } = await supabase
        .from('payment_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        console.error('Error creating transaction:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in createTransaction:', error);
      return { success: false, error: 'Failed to create transaction' };
    }
  }

  /**
   * Update transaction status
   */
  static async updateTransaction(data: UpdatePaymentTransactionData): Promise<PaymentServiceResponse<PaymentTransaction>> {
    try {
      const { id, ...updateData } = data;
      
      const { data: result, error } = await supabase
        .from('payment_transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating transaction:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in updateTransaction:', error);
      return { success: false, error: 'Failed to update transaction' };
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransaction(id: string): Promise<PaymentServiceResponse<PaymentTransaction>> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching transaction:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getTransaction:', error);
      return { success: false, error: 'Failed to fetch transaction' };
    }
  }

  /**
   * Get transactions for a patient
   */
  static async getPatientTransactions(patientId: string): Promise<PaymentServiceResponse<PaymentTransaction[]>> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching patient transactions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getPatientTransactions:', error);
      return { success: false, error: 'Failed to fetch transactions' };
    }
  }

  /**
   * Get transactions for a clinic
   */
  static async getClinicTransactions(clinicId: string): Promise<PaymentServiceResponse<PaymentTransaction[]>> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clinic transactions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getClinicTransactions:', error);
      return { success: false, error: 'Failed to fetch transactions' };
    }
  }
}

// ===================================================================
// PAYMENT FEES SERVICE
// ===================================================================
export class PaymentFeesService {

  /**
   * Get all payment fees configuration
   */
  static async getPaymentFees(): Promise<PaymentServiceResponse<PaymentFeesConfig[]>> {
    try {
      const { data, error } = await supabase
        .from('payment_fees_config')
        .select('*')
        .eq('is_active', true)
        .order('payment_method');

      if (error) {
        console.error('Error fetching payment fees:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getPaymentFees:', error);
      return { success: false, error: 'Failed to fetch payment fees' };
    }
  }

  /**
   * Calculate fees for a payment
   */
  static async calculateFees(paymentMethod: PaymentMethodType, amount: number): Promise<PaymentServiceResponse<FeeCalculation>> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_payment_fees', {
          p_payment_method: paymentMethod,
          p_amount: amount
        });

      if (error) {
        console.error('Error calculating fees:', error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'No fee configuration found' };
      }

      const result = data[0];
      
      // Get fee configuration for breakdown
      const { data: config } = await supabase
        .from('payment_fees_config')
        .select('*')
        .eq('payment_method', paymentMethod)
        .eq('is_active', true)
        .single();

      const feeCalculation: FeeCalculation = {
        base_amount: amount,
        gateway_fee: result.gateway_fee || 0,
        processing_fee: 0, // This would come from clinic settings
        total_amount: result.total_with_fees || amount,
        fee_breakdown: {
          gateway_fee_percentage: config?.gateway_fee_percentage || 0,
          gateway_fee_fixed: config?.gateway_fee_fixed || 0,
          processing_fee_percentage: 0,
          processing_fee_fixed: 0
        }
      };

      return { success: true, data: feeCalculation };
    } catch (error) {
      console.error('Error in calculateFees:', error);
      return { success: false, error: 'Failed to calculate fees' };
    }
  }
}

// ===================================================================
// PAYMENT PROCESSING SERVICE
// ===================================================================
export class PaymentProcessingService {

  /**
   * Process a payment request
   */
  static async processPayment(request: PaymentRequest): Promise<PaymentServiceResponse<PaymentResponse>> {
    try {
      // Calculate fees
      const feesResult = await PaymentFeesService.calculateFees(request.payment_method, request.amount);
      
      if (!feesResult.success || !feesResult.data) {
        return { success: false, error: 'Failed to calculate fees' };
      }

      const fees = feesResult.data;

      // Create transaction record
      const transactionData: CreatePaymentTransactionData = {
        appointment_id: request.appointment_id,
        patient_id: request.patient_id,
        clinic_id: request.clinic_id,
        clinic_payment_method_id: request.clinic_payment_method_id,
        payment_method: request.payment_method,
        consultation_fee: request.consultation_fee,
        booking_fee: request.booking_fee,
        processing_fee: fees.gateway_fee,
        total_amount: fees.total_amount,
        payer_name: request.payer_name,
        payer_phone: request.payer_phone,
        payer_email: request.payer_email,
        notes: request.notes
      };

      const transactionResult = await PaymentTransactionService.createTransaction(transactionData);

      if (!transactionResult.success || !transactionResult.data) {
        return { success: false, error: 'Failed to create transaction record' };
      }

      const transaction = transactionResult.data;

      // Process payment based on method
      let paymentResponse: PaymentResponse;

      switch (request.payment_method) {
        case 'gcash':
          paymentResponse = await this.processGCashPayment(transaction, request);
          break;
        case 'paymaya':
          paymentResponse = await this.processPayMayaPayment(transaction, request);
          break;
        case 'bank_transfer':
          paymentResponse = await this.processBankTransfer(transaction, request);
          break;
        case 'credit_card':
        case 'debit_card':
          paymentResponse = await this.processCardPayment(transaction, request);
          break;
        case 'cash':
          paymentResponse = await this.processCashPayment(transaction, request);
          break;
        default:
          return { success: false, error: 'Unsupported payment method' };
      }

      // Update transaction with external reference if available
      if (paymentResponse.success && paymentResponse.external_transaction_id) {
        await PaymentTransactionService.updateTransaction({
          id: transaction.id,
          external_transaction_id: paymentResponse.external_transaction_id,
          status: 'processing'
        });
      }

      return {
        success: paymentResponse.success,
        data: {
          ...paymentResponse,
          transaction_id: transaction.id,
          transaction_number: transaction.transaction_number
        }
      };

    } catch (error) {
      console.error('Error in processPayment:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  /**
   * Process GCash payment
   */
  private static async processGCashPayment(transaction: PaymentTransaction, request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Get clinic's GCash details
      const { data: clinicMethod } = await supabase
        .from('clinic_payment_methods')
        .select('*')
        .eq('id', request.clinic_payment_method_id)
        .eq('method_type', 'gcash')
        .single();

      if (!clinicMethod) {
        return { success: false, error: 'GCash payment method not configured for this clinic' };
      }

      // For now, return manual payment instructions
      // In production, integrate with GCash API
      return {
        success: true,
        transaction_id: transaction.id,
        transaction_number: transaction.transaction_number,
        qr_code_data: clinicMethod.qr_code_url,
        instructions: `
Send ₱${transaction.total_amount} to:
GCash Number: ${clinicMethod.account_number}
Account Name: ${clinicMethod.account_name}
Reference: ${transaction.transaction_number}

${clinicMethod.payment_instructions || ''}
        `.trim(),
        total_amount: transaction.total_amount,
        processing_fee: transaction.processing_fee
      };

    } catch (error) {
      console.error('Error processing GCash payment:', error);
      return { success: false, error: 'GCash payment processing failed' };
    }
  }

  /**
   * Process PayMaya payment
   */
  private static async processPayMayaPayment(transaction: PaymentTransaction, request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const { data: clinicMethod } = await supabase
        .from('clinic_payment_methods')
        .select('*')
        .eq('id', request.clinic_payment_method_id)
        .eq('method_type', 'paymaya')
        .single();

      if (!clinicMethod) {
        return { success: false, error: 'PayMaya payment method not configured for this clinic' };
      }

      return {
        success: true,
        transaction_id: transaction.id,
        transaction_number: transaction.transaction_number,
        qr_code_data: clinicMethod.qr_code_url,
        instructions: `
Send ₱${transaction.total_amount} to:
PayMaya Number: ${clinicMethod.account_number}
Account Name: ${clinicMethod.account_name}
Reference: ${transaction.transaction_number}

${clinicMethod.payment_instructions || ''}
        `.trim(),
        total_amount: transaction.total_amount,
        processing_fee: transaction.processing_fee
      };

    } catch (error) {
      console.error('Error processing PayMaya payment:', error);
      return { success: false, error: 'PayMaya payment processing failed' };
    }
  }

  /**
   * Process bank transfer
   */
  private static async processBankTransfer(transaction: PaymentTransaction, request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const { data: clinicMethod } = await supabase
        .from('clinic_payment_methods')
        .select('*')
        .eq('id', request.clinic_payment_method_id)
        .eq('method_type', 'bank_transfer')
        .single();

      if (!clinicMethod) {
        return { success: false, error: 'Bank transfer not configured for this clinic' };
      }

      return {
        success: true,
        transaction_id: transaction.id,
        transaction_number: transaction.transaction_number,
        instructions: `
Transfer ₱${transaction.total_amount} to:
Bank: ${clinicMethod.bank_name}
Account Number: ${clinicMethod.account_number}
Account Name: ${clinicMethod.account_name}
${clinicMethod.branch_code ? `Branch Code: ${clinicMethod.branch_code}` : ''}
Reference: ${transaction.transaction_number}

${clinicMethod.payment_instructions || ''}
        `.trim(),
        total_amount: transaction.total_amount,
        processing_fee: transaction.processing_fee
      };

    } catch (error) {
      console.error('Error processing bank transfer:', error);
      return { success: false, error: 'Bank transfer processing failed' };
    }
  }

  /**
   * Process card payment
   */
  private static async processCardPayment(transaction: PaymentTransaction, request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // In production, integrate with card payment gateway (Stripe, PayPal, etc.)
      return {
        success: true,
        transaction_id: transaction.id,
        transaction_number: transaction.transaction_number,
        instructions: 'Card payment processing is not yet implemented. Please use alternative payment methods.',
        total_amount: transaction.total_amount,
        processing_fee: transaction.processing_fee
      };

    } catch (error) {
      console.error('Error processing card payment:', error);
      return { success: false, error: 'Card payment processing failed' };
    }
  }

  /**
   * Process cash payment
   */
  private static async processCashPayment(transaction: PaymentTransaction, request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Update transaction to pending cash payment
      await PaymentTransactionService.updateTransaction({
        id: transaction.id,
        status: 'pending'
      });

      return {
        success: true,
        transaction_id: transaction.id,
        transaction_number: transaction.transaction_number,
        instructions: `
Please bring ₱${transaction.total_amount} in cash to your appointment.
Reference Number: ${transaction.transaction_number}

Show this reference number at the clinic to complete your payment.
        `.trim(),
        total_amount: transaction.total_amount,
        processing_fee: transaction.processing_fee
      };

    } catch (error) {
      console.error('Error processing cash payment:', error);
      return { success: false, error: 'Cash payment processing failed' };
    }
  }

  /**
   * Verify payment completion
   */
  static async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentServiceResponse<PaymentVerificationResponse>> {
    try {
      // Get transaction
      const transactionResult = await PaymentTransactionService.getTransaction(request.transaction_id);
      
      if (!transactionResult.success || !transactionResult.data) {
        return { success: false, error: 'Transaction not found' };
      }

      const transaction = transactionResult.data;

      // Update transaction with verification details
      const updateData: UpdatePaymentTransactionData = {
        id: transaction.id,
        status: 'completed',
        confirmation_date: new Date().toISOString(),
        external_reference_number: request.external_reference_number,
        payment_proof_url: request.payment_proof_url
      };

      if (request.external_transaction_id) {
        updateData.external_transaction_id = request.external_transaction_id;
      }

      const updateResult = await PaymentTransactionService.updateTransaction(updateData);

      if (!updateResult.success) {
        return { success: false, error: 'Failed to update transaction' };
      }

      return {
        success: true,
        data: {
          success: true,
          status: 'completed',
          verified_amount: transaction.total_amount,
          verification_date: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error in verifyPayment:', error);
      return { success: false, error: 'Payment verification failed' };
    }
  }

  /**
   * Get payment method options for a clinic
   */
  static async getPaymentMethodOptions(clinicId: string): Promise<PaymentServiceResponse<PaymentMethodOption[]>> {
    try {
      const enabledMethodsResult = await ClinicPaymentMethodService.getEnabledPaymentMethods(clinicId);
      
      if (!enabledMethodsResult.success) {
        return { success: false, error: enabledMethodsResult.error };
      }

      const enabledMethods = enabledMethodsResult.data || [];
      
      const options: PaymentMethodOption[] = enabledMethods.map(method => ({
        type: method.method_type,
        name: this.getPaymentMethodName(method.method_type),
        icon: this.getPaymentMethodIcon(method.method_type),
        description: this.getPaymentMethodDescription(method.method_type),
        is_available: method.is_enabled && method.status === 'active',
        minimum_amount: method.minimum_amount,
        maximum_amount: method.maximum_amount,
        processing_fee_percentage: method.processing_fee_percentage,
        processing_fee_fixed: method.processing_fee_fixed,
        instructions: method.payment_instructions
      }));

      return { success: true, data: options };

    } catch (error) {
      console.error('Error in getPaymentMethodOptions:', error);
      return { success: false, error: 'Failed to get payment options' };
    }
  }

  private static getPaymentMethodName(type: PaymentMethodType): string {
    const names = {
      gcash: 'GCash',
      paymaya: 'PayMaya',
      bank_transfer: 'Bank Transfer',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      cash: 'Cash Payment'
    };
    return names[type] || type;
  }

  private static getPaymentMethodIcon(type: PaymentMethodType): string {
    const icons = {
      gcash: 'smartphone',
      paymaya: 'smartphone',
      bank_transfer: 'building-2',
      credit_card: 'credit-card',
      debit_card: 'credit-card',
      cash: 'banknote'
    };
    return icons[type] || 'wallet';
  }

  private static getPaymentMethodDescription(type: PaymentMethodType): string {
    const descriptions = {
      gcash: 'Pay using GCash mobile wallet',
      paymaya: 'Pay using PayMaya digital wallet',
      bank_transfer: 'Direct bank account transfer',
      credit_card: 'Pay with credit card',
      debit_card: 'Pay with debit card',
      cash: 'Pay in cash at the clinic'
    };
    return descriptions[type] || '';
  }
}