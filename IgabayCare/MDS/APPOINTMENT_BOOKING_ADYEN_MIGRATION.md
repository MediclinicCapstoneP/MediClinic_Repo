# AppointmentBookingModal: PayMongo → Adyen Migration

## ✅ Changes Made

### 1. **Updated Imports**
```tsx
// REMOVED PayMongo imports
// import { PaymentForm } from './PaymentForm';
// import { PayMongoGCashPayment } from './PayMongoGCashPayment';

// ADDED Adyen imports
import GCashPayment from '../payment/GCashPayment';
import { adyenPaymentService } from '../../services/adyenPaymentService';
```

### 2. **Removed Unused State**
```tsx
// REMOVED
// const [showPayment, setShowPayment] = useState(false);

// KEPT (updated to work with Adyen)
const [showGCashPayment, setShowGCashPayment] = useState(false);
```

### 3. **Updated Payment Handlers**
```tsx
// REMOVED old PayMongo handler
// const handlePaymentComplete = async (paymentResponse: PaymentResponse) => { ... }

// UPDATED GCash handler for Adyen
const handleGCashPaymentComplete = async (result: any) => {
  // Now uses Adyen result format (pspReference, paymentId)
  // paymentProvider changed from 'paymongo' to 'adyen'
}

// UPDATED error handler
const handleGCashPaymentError = (error: any) => {
  // Now handles Adyen error format
}

// ADDED cancel handler
const handleGCashPaymentCancel = () => {
  setShowGCashPayment(false);
}
```

### 4. **Updated Payment Modal**
```tsx
// REMOVED entire PayMongo payment modal
// {/* Payment Modal */}

// UPDATED GCash modal to use Adyen component
{/* Adyen GCash Payment Modal */}
{showGCashPayment && appointmentData && patientData && (
  <GCashPayment
    patientId={patientId}
    clinicId={clinic.id}
    appointmentId={appointmentData.appointment_id}
    amount={appointmentData.total_amount}
    currency="PHP"
    onPaymentSuccess={handleGCashPaymentComplete}
    onPaymentError={handleGCashPaymentError}
    onPaymentCancel={handleGCashPaymentCancel}
  />
)}
```

## 🔧 How It Now Works

### 1. **User Flow**
1. User selects date and time for appointment
2. User clicks "Pay with GCash (₱XXX)" button
3. `handleProceedToGCashPayment()` is called
4. GCash payment modal opens with our Adyen `GCashPayment` component
5. Component creates Adyen payment session via `/api/adyen/sessions`
6. User completes payment through Adyen's secure interface
7. Payment result handled by `handleGCashPaymentComplete()`
8. Appointment is booked with Adyen payment reference

### 2. **Data Flow**
```
AppointmentBookingModal 
  ↓ (payment button clicked)
GCashPayment Component
  ↓ (creates session)
Supabase Edge Function: adyen-sessions
  ↓ (calls Adyen API)
Adyen Payment Session
  ↓ (user completes payment)
Payment Result
  ↓ (success/error)
AppointmentBookingModal (handleGCashPaymentComplete)
  ↓ (books appointment)
appointmentManagementAPI.completeAppointmentBooking()
```

### 3. **Key Changes**
- **Payment Provider**: `'paymongo'` → `'adyen'`
- **Payment Reference**: PayMongo `payment_intent_id` → Adyen `pspReference`
- **Error Handling**: Updated to handle Adyen error format
- **Component**: PayMongo custom component → Adyen Web Components

## 🧪 Testing the Integration

### 1. **Test Page Available**
Navigate to: `/test/adyen-gcash` (if you add the route)
Or use the `PaymentExample` component directly.

### 2. **Test Data**
The component uses these test values:
- Patient ID: `patient-123`
- Clinic ID: `clinic-456` 
- Amount: ₱500.00
- Currency: PHP

### 3. **Expected Flow**
1. Click "Pay with GCash - ₱500.00"
2. Adyen payment component loads
3. Complete payment (test mode)
4. Success message with transaction reference
5. Payment webhook updates database

## 🔄 What's Still The Same

- ✅ Calendar date selection
- ✅ Time slot selection
- ✅ Appointment type selection
- ✅ Service selection
- ✅ Notes functionality
- ✅ Appointment summary
- ✅ "Book Without Payment" option
- ✅ Success/error states

## 🚀 Next Steps

### 1. **Deploy & Test**
```bash
# Deploy the webhook function
supabase functions deploy adyen-webhooks

# Set your Adyen credentials
supabase secrets set ADYEN_API_KEY=your_api_key
supabase secrets set ADYEN_HMAC_KEY=your_hmac_key
```

### 2. **Configure Adyen**
- Add webhook URL: `https://ovcafionidgcipmloius.supabase.co/functions/v1/adyen-webhooks`
- Enable GCash payment method
- Test with Adyen test environment

### 3. **Update .env File**
```bash
VITE_ADYEN_ENVIRONMENT=test
VITE_ADYEN_CLIENT_KEY=test_your_client_key_here
VITE_ADYEN_MERCHANT_ACCOUNT=YourMerchantAccount
VITE_API_BASE_URL=https://ovcafionidgcipmloius.supabase.co/functions/v1
```

## ⚠️ Important Notes

1. **Security**: The old PayMongo implementation exposed API keys to the frontend. The new Adyen implementation keeps all API keys server-side in Supabase Edge Functions.

2. **Database Schema**: The payment records now use:
   - `paymentProvider: 'adyen'`  
   - `externalPaymentId: result.pspReference`

3. **Error Handling**: Adyen errors have a different format than PayMongo errors. The handlers have been updated accordingly.

4. **Webhook Processing**: Payment status updates now come through Adyen webhooks instead of PayMongo webhooks.

Your AppointmentBookingModal is now fully migrated to use Adyen! 🎉
