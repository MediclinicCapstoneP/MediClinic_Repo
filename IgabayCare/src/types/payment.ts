// ===================================================================
// PAYMENT SYSTEM TYPE DEFINITIONS
// ===================================================================

export type PaymentMethodType = 'gcash' | 'paymaya' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'cash';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export type PaymentMethodStatus = 'active' | 'inactive' | 'pending_verification';

// ===================================================================
// CLINIC PAYMENT METHODS
// ===================================================================
export interface ClinicPaymentMethod {
  id: string;
  clinic_id: string;
  method_type: PaymentMethodType;
  is_enabled: boolean;
  
  // Method-specific details
  account_number?: string;
  account_name?: string;
  bank_name?: string;
  branch_code?: string;
  qr_code_url?: string;
  
  // Configuration
  minimum_amount: number;
  maximum_amount?: number;
  processing_fee_percentage: number;
  processing_fee_fixed: number;
  
  // Instructions
  payment_instructions?: string;
  notes?: string;
  
  // Status
  status: PaymentMethodStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateClinicPaymentMethodData {
  clinic_id: string;
  method_type: PaymentMethodType;
  is_enabled?: boolean;
  account_number?: string;
  account_name?: string;
  bank_name?: string;
  branch_code?: string;
  qr_code_url?: string;
  minimum_amount?: number;
  maximum_amount?: number;
  processing_fee_percentage?: number;
  processing_fee_fixed?: number;
  payment_instructions?: string;
  notes?: string;
  status?: PaymentMethodStatus;
}

export interface UpdateClinicPaymentMethodData extends Partial<CreateClinicPaymentMethodData> {
  id: string;
}

// ===================================================================
// PAYMENT TRANSACTIONS
// ===================================================================
export interface PaymentTransaction {
  id: string;
  appointment_id?: string;
  patient_id: string;
  clinic_id: string;
  clinic_payment_method_id?: string;
  
  // Transaction details
  transaction_number: string;
  payment_method: PaymentMethodType;
  
  // Amount breakdown
  consultation_fee: number;
  booking_fee: number;
  processing_fee: number;
  total_amount: number;
  
  // Status
  status: PaymentStatus;
  
  // External references
  external_transaction_id?: string;
  external_reference_number?: string;
  
  // Dates
  payment_date?: string;
  confirmation_date?: string;
  
  // Payer info
  payer_name?: string;
  payer_phone?: string;
  payer_email?: string;
  
  // Additional
  payment_proof_url?: string;
  notes?: string;
  failure_reason?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentTransactionData {
  appointment_id?: string;
  patient_id: string;
  clinic_id: string;
  clinic_payment_method_id?: string;
  payment_method: PaymentMethodType;
  consultation_fee: number;
  booking_fee: number;
  processing_fee: number;
  total_amount: number;
  payer_name?: string;
  payer_phone?: string;
  payer_email?: string;
  notes?: string;
}

export interface UpdatePaymentTransactionData extends Partial<CreatePaymentTransactionData> {
  id: string;
  status?: PaymentStatus;
  external_transaction_id?: string;
  external_reference_number?: string;
  payment_date?: string;
  confirmation_date?: string;
  payment_proof_url?: string;
  failure_reason?: string;
}

// ===================================================================
// PATIENT PAYMENT METHODS
// ===================================================================
export interface PatientPaymentMethod {
  id: string;
  patient_id: string;
  method_type: PaymentMethodType;
  account_number: string;
  account_name?: string;
  
  // Card-specific
  card_last_four?: string;
  card_expiry_month?: number;
  card_expiry_year?: number;
  card_brand?: string;
  
  // Preferences
  is_default: boolean;
  is_verified: boolean;
  nickname?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CreatePatientPaymentMethodData {
  patient_id: string;
  method_type: PaymentMethodType;
  account_number: string;
  account_name?: string;
  card_last_four?: string;
  card_expiry_month?: number;
  card_expiry_year?: number;
  card_brand?: string;
  is_default?: boolean;
  nickname?: string;
}

// ===================================================================
// PAYMENT FEES CONFIGURATION
// ===================================================================
export interface PaymentFeesConfig {
  id: string;
  payment_method: PaymentMethodType;
  platform_fee_percentage: number;
  platform_fee_fixed: number;
  gateway_fee_percentage: number;
  gateway_fee_fixed: number;
  minimum_transaction_amount: number;
  maximum_transaction_amount: number;
  is_active: boolean;
  effective_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ===================================================================
// PAYMENT PROCESSING
// ===================================================================
export interface PaymentRequest {
  appointment_id?: string;
  patient_id: string;
  clinic_id: string;
  payment_method: PaymentMethodType;
  clinic_payment_method_id?: string;
  amount: number;
  consultation_fee: number;
  booking_fee: number;
  payer_name: string;
  payer_phone: string;
  payer_email: string;
  notes?: string;
}

export interface PaymentResponse {
  success: boolean;
  transaction_id?: string;
  transaction_number?: string;
  external_transaction_id?: string;
  payment_url?: string; // For redirect-based payments
  qr_code_data?: string; // For QR code payments
  instructions?: string;
  error?: string;
  total_amount?: number;
  processing_fee?: number;
}

export interface PaymentVerificationRequest {
  transaction_id: string;
  external_transaction_id?: string;
  external_reference_number?: string;
  payment_proof_url?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  status: PaymentStatus;
  error?: string;
  verified_amount?: number;
  verification_date?: string;
}

// ===================================================================
// PAYMENT METHOD DISPLAY
// ===================================================================
export interface PaymentMethodOption {
  type: PaymentMethodType;
  name: string;
  icon: string;
  description: string;
  is_available: boolean;
  minimum_amount?: number;
  maximum_amount?: number;
  processing_fee_percentage?: number;
  processing_fee_fixed?: number;
  instructions?: string;
}

// ===================================================================
// FEE CALCULATION
// ===================================================================
export interface FeeCalculation {
  base_amount: number;
  gateway_fee: number;
  processing_fee: number;
  total_amount: number;
  fee_breakdown: {
    gateway_fee_percentage: number;
    gateway_fee_fixed: number;
    processing_fee_percentage: number;
    processing_fee_fixed: number;
  };
}

// ===================================================================
// PAYMENT SERVICE RESPONSES
// ===================================================================
export interface PaymentServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ===================================================================
// GCASH/PAYMAYA SPECIFIC INTERFACES
// ===================================================================
export interface GCashPaymentRequest {
  amount: number;
  description: string;
  reference_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  callback_url?: string;
  success_url?: string;
  failure_url?: string;
}

export interface PayMayaPaymentRequest extends GCashPaymentRequest {
  // PayMaya uses same structure as GCash for most fields
}

export interface GCashPaymentResponse {
  payment_id: string;
  payment_url: string;
  qr_code_url?: string;
  reference_number: string;
  status: string;
  expiry_date: string;
}

// ===================================================================
// BANK TRANSFER INTERFACES
// ===================================================================
export interface BankTransferDetails {
  bank_name: string;
  account_number: string;
  account_name: string;
  branch_code?: string;
  reference_number: string;
  amount: number;
  instructions: string;
}

// ===================================================================
// CREDIT/DEBIT CARD INTERFACES
// ===================================================================
export interface CardPaymentRequest {
  amount: number;
  currency: string;
  card_number: string;
  expiry_month: number;
  expiry_year: number;
  cvv: string;
  cardholder_name: string;
  billing_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface CardPaymentResponse {
  payment_id: string;
  status: string;
  authorization_code?: string;
  reference_number: string;
  last_four_digits: string;
  card_brand: string;
}