# Adyen GCash Integration Setup Guide

This guide walks you through setting up GCash payments via Adyen for your IgabayCare application.

## 🎯 What's Been Implemented

- ✅ **Secure Backend Endpoints**: Supabase Edge Functions for all Adyen API calls
- ✅ **Frontend Components**: React components for GCash payments using Adyen Web SDK
- ✅ **Webhook Handling**: HMAC-validated webhook processing for payment updates
- ✅ **Environment Security**: Proper separation of client-side and server-side credentials
- ✅ **Database Integration**: Automatic payment record creation and updates

## 📁 Project Structure

```
├── supabase/functions/
│   ├── _shared/
│   │   └── adyen-utils.ts          # Shared utilities and HMAC validation
│   ├── adyen-sessions/             # Create payment sessions
│   ├── adyen-payments/             # Process payments
│   ├── adyen-payment-details/      # Handle 3DS and additional details
│   └── adyen-webhooks/             # Webhook processing with HMAC validation
├── src/
│   ├── services/
│   │   └── adyenPaymentService.ts  # Refactored client service
│   └── components/payment/
│       ├── GCashPayment.tsx        # GCash payment component
│       └── PaymentExample.tsx      # Example usage
└── .env                            # Environment configuration
```

## 🔧 Setup Instructions

### 1. Adyen Account Setup

1. **Create Adyen Account**
   - Sign up at [Adyen.com](https://www.adyen.com/)
   - Complete merchant verification for Philippines market

2. **Enable GCash Payment Method**
   - Go to Customer Area → Configuration → Payment Methods
   - Enable "GCash" for Philippines (PH)
   - Configure routing and pricing if needed

3. **Get Your Credentials**
   ```bash
   # From Customer Area → Developers → API Credentials
   Client Key: test_XXXXXXXXXX (safe for frontend)
   API Key: AQE...XXXX (server-side only!)
   Merchant Account: YourMerchantAccount
   HMAC Key: [Generate in webhook settings]
   ```

4. **Configure Webhooks**
   - Go to Customer Area → Developers → Webhooks
   - Create new webhook endpoint: `https://your-project.supabase.co/functions/v1/adyen-webhooks`
   - Enable these key events:
     - `AUTHORISATION` (payment success/failure)
     - `PENDING` (payment pending)
     - `CANCELLATION` (payment cancelled)
     - `REFUND` (refund processed)
     - `CAPTURE` (payment captured)
     - `CHARGEBACK` (dispute initiated)
     - `MANUAL_REVIEW_ACCEPT/REJECT` (manual review results)
   - Generate and save HMAC key

5. **Set Allowed Origins**
   - Customer Area → Developers → API Credentials → Client settings
   - Add your domain(s): `https://yourdomain.com`

### 2. Environment Configuration

Update your `.env` file:

```bash
# Supabase (existing)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Adyen (Client-side - safe to expose)
VITE_ADYEN_ENVIRONMENT=test                    # or 'live' for production
VITE_ADYEN_CLIENT_KEY=test_your_client_key_here
VITE_ADYEN_MERCHANT_ACCOUNT=YourMerchantAccount

# Adyen (Server-only - NEVER add VITE_ prefix)
ADYEN_API_KEY=your_server_side_api_key_here
ADYEN_HMAC_KEY=your_hmac_key_for_webhooks_here

# API Configuration
VITE_API_BASE_URL=https://your-project-id.supabase.co/functions/v1
```

### 3. Deploy Supabase Edge Functions

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login and Link Project**:
   ```bash
   supabase login
   supabase link --project-ref your-project-id
   ```

3. **Set Environment Variables** in Supabase:
   ```bash
   # Set server-only variables in Supabase dashboard
   supabase secrets set ADYEN_API_KEY=your_api_key_here
   supabase secrets set ADYEN_HMAC_KEY=your_hmac_key_here
   supabase secrets set ADYEN_MERCHANT_ACCOUNT=YourMerchantAccount
   supabase secrets set ADYEN_ENVIRONMENT=test
   ```

4. **Deploy Functions**:
   ```bash
   supabase functions deploy adyen-sessions
   supabase functions deploy adyen-payments
   supabase functions deploy adyen-payment-details
   supabase functions deploy adyen-webhooks
   ```

### 4. Database Setup

Ensure your `payments` table exists with these columns:

```sql
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_reference TEXT UNIQUE NOT NULL,
    patient_id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    appointment_id UUID,
    amount_value INTEGER NOT NULL,
    currency TEXT DEFAULT 'PHP',
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL,
    adyen_psp_reference TEXT,
    adyen_result_code TEXT,
    adyen_response JSONB,
    payment_date TIMESTAMPTZ,
    confirmation_date TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_payments_merchant_reference ON payments(merchant_reference);
CREATE INDEX idx_payments_patient_id ON payments(patient_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_psp_reference ON payments(adyen_psp_reference);
```

### 5. Frontend Integration

Use the `GCashPayment` component in your React app:

```tsx
import GCashPayment from './components/payment/GCashPayment';

function PaymentPage() {
  const handlePaymentSuccess = (result) => {
    console.log('Payment successful:', result);
    // Redirect to success page or update UI
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    // Show error message to user
  };

  return (
    <GCashPayment
      patientId="patient-123"
      clinicId="clinic-456"
      appointmentId="appointment-789"
      amount={500.00}
      currency="PHP"
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentError={handlePaymentError}
      onPaymentCancel={() => console.log('Payment cancelled')}
    />
  );
}
```

## 🧪 Testing

### 1. Test Environment

- Use Adyen test environment (`VITE_ADYEN_ENVIRONMENT=test`)
- Use test credentials from Adyen Customer Area
- GCash test cards available in Adyen documentation

### 2. Test the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the payment example**:
   ```bash
   # Add this route to your React Router
   /payment/example
   ```

3. **Test Payment Flow**:
   - Click "Pay with GCash"
   - Complete payment in test environment
   - Check database for payment record
   - Verify webhook delivery in Supabase logs

### 3. Test Webhooks Locally

For local webhook testing, use ngrok:

```bash
# Expose local Supabase functions
npx supabase functions serve
ngrok http 54321

# Update webhook URL in Adyen to:
# https://your-ngrok-url.ngrok.io/functions/v1/adyen-webhooks
```

## 🔒 Security Checklist

- ✅ API keys are server-side only (no VITE_ prefix)
- ✅ HMAC signature validation for webhooks
- ✅ CORS properly configured
- ✅ Environment variables separated (client vs server)
- ✅ Supabase RLS policies in place
- ✅ No sensitive data logged in frontend

## 🚀 Going Live

### 1. Switch to Live Environment

1. **Update Environment**:
   ```bash
   VITE_ADYEN_ENVIRONMENT=live
   # Update all credentials to live versions
   ```

2. **Configure Live Webhooks**:
   - Update webhook URL in Adyen Customer Area
   - Test webhook delivery with live credentials

3. **Enable Live Payment Methods**:
   - Activate GCash in live Customer Area
   - Configure routing and fees

### 2. Monitoring and Logging

- Monitor Supabase function logs
- Set up Adyen webhook monitoring
- Implement payment status polling for edge cases
- Add proper error logging and alerting

## 🐛 Troubleshooting

### Common Issues

1. **"Missing API Key" Error**
   - Check environment variables in Supabase secrets
   - Verify function deployment

2. **HMAC Validation Failed**
   - Ensure correct HMAC key in Supabase secrets
   - Check webhook payload format

3. **GCash Component Not Loading**
   - Verify client key and environment
   - Check browser console for CSP issues
   - Ensure domain is in Adyen allowed origins

4. **Database Errors**
   - Verify table schema matches expected structure
   - Check Supabase RLS policies
   - Ensure foreign key relationships

### Debug Steps

1. **Check Function Logs**:
   ```bash
   supabase functions logs adyen-sessions
   ```

2. **Test API Endpoints**:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/adyen-sessions \
     -H "Content-Type: application/json" \
     -d '{"patientId":"test","clinicId":"test","amount":100,"returnUrl":"https://example.com"}'
   ```

3. **Verify Webhook Delivery**:
   - Check Adyen Customer Area webhook logs
   - Review Supabase function logs
   - Test webhook endpoint manually

## 📞 Support

- **Adyen Documentation**: [docs.adyen.com](https://docs.adyen.com/)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **GCash Integration Guide**: [docs.adyen.com/payment-methods/gcash](https://docs.adyen.com/payment-methods/gcash)

## 🔄 Next Steps

1. **Add More Payment Methods**: PayMaya, GrabPay, cards
2. **Implement Refunds**: Add refund endpoint and UI
3. **Add Payment Status Tracking**: Real-time status updates
4. **Implement Retry Logic**: Handle failed payments gracefully
5. **Add Analytics**: Payment success rates, conversion tracking

---

**⚠️ Important Security Note**: Always keep your API keys secure and never commit them to version control. Use Supabase secrets for server-side variables.
