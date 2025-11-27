# PayMongo GCash Integration Setup Guide

This guide explains how to set up PayMongo GCash payments in the MediClinic application.

## Overview

The MediClinic application now supports GCash payments through PayMongo's Payment Intent API. This integration allows patients to pay for medical consultations securely using their GCash wallets.

## Features

- **Secure GCash Payments**: Integration with PayMongo's Payment Intent workflow
- **Real-time Payment Status**: Automatic payment verification and status updates
- **User-friendly Interface**: Streamlined payment flow with clear instructions
- **Error Handling**: Comprehensive error handling and user feedback
- **Payment Tracking**: Transaction IDs and payment confirmations

## Setup Instructions

### 1. PayMongo Account Setup

1. **Create PayMongo Account**:
   - Visit [PayMongo Dashboard](https://dashboard.paymongo.com)
   - Sign up for a developer account
   - Complete account verification

2. **Get API Keys**:
   - Navigate to Developers > API Keys
   - Copy your **Public Key** (starts with `pk_test_` for test mode)
   - Copy your **Secret Key** (starts with `sk_test_` for test mode)

### 2. Environment Configuration

1. **Update Environment Variables**:
   ```bash
   # Add to your .env file
   VITE_PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
   VITE_PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
   ```

2. **Environment File Structure**:
   ```
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   
   # PayMongo Configuration
   VITE_PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
   VITE_PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
   ```

### 3. Application Configuration

The following components have been created/updated:

- **PayMongo Service** (`src/services/paymongoService.ts`): Core PayMongo API integration
- **GCash Payment Component** (`src/components/patient/PayMongoGCashPayment.tsx`): Payment interface
- **Payment Return Handler** (`src/pages/patient/PaymentReturn.tsx`): Payment confirmation page
- **Updated PatientHome** (`src/pages/patient/PatientHome.tsx`): Integrated GCash payment flow

## Payment Flow

### 1. Patient Initiates Payment
- Patient selects appointment date/time
- Clicks "Pay with GCash" button
- Enters payment information (name, email, phone)

### 2. PayMongo Processing
- Creates Payment Intent with PayMongo
- Creates GCash Payment Method
- Attaches Payment Method to Intent
- Generates GCash authorization URL

### 3. GCash Authorization
- Patient redirected to GCash app/website
- Completes payment authorization
- Returns to application

### 4. Payment Confirmation
- Application verifies payment status
- Updates appointment status
- Shows confirmation to patient

## API Endpoints Used

### PayMongo API Endpoints:
- `POST /v1/payment_intents` - Create payment intent
- `POST /v1/payment_methods` - Create GCash payment method
- `POST /v1/payment_intents/{id}/attach` - Attach payment method
- `GET /v1/payment_intents/{id}` - Retrieve payment status

## Testing

### Test Mode Configuration
PayMongo provides test mode for development:

1. **Test API Keys**: Use keys starting with `pk_test_` and `sk_test_`
2. **Test GCash Flow**: PayMongo provides test GCash simulation
3. **Test Amounts**: Use any amount for testing (will not charge real money)

### Test Scenarios
- **Successful Payment**: Complete GCash flow normally
- **Failed Payment**: Cancel during GCash authorization
- **Network Issues**: Test with poor connectivity
- **Invalid Data**: Test with invalid phone/email formats

## Security Considerations

1. **API Key Security**:
   - Never expose secret keys in client-side code
   - Use environment variables for all keys
   - Rotate keys regularly in production

2. **Data Validation**:
   - Validate all payment data before processing
   - Sanitize user inputs
   - Verify payment status server-side

3. **Error Handling**:
   - Don't expose sensitive error details to users
   - Log errors securely for debugging
   - Provide user-friendly error messages

## Production Deployment

### 1. Switch to Live Mode
- Replace test API keys with live keys
- Update PayMongo account to live mode
- Test thoroughly in staging environment

### 2. Webhook Configuration (Optional)
For real-time payment notifications:
```javascript
// Webhook endpoint to handle PayMongo events
POST /api/webhooks/paymongo
```

### 3. Monitoring
- Monitor payment success rates
- Track failed payments for investigation
- Set up alerts for payment system issues

## Pricing

PayMongo GCash transaction fees:
- **GCash**: 2.5% per transaction
- **No setup fees**: Pay only per transaction
- **No monthly fees**: Usage-based pricing

## Troubleshooting

### Common Issues

1. **"API keys not configured"**:
   - Ensure environment variables are set correctly
   - Restart development server after adding keys

2. **"Payment intent creation failed"**:
   - Check API key validity
   - Verify PayMongo account status
   - Check network connectivity

3. **"GCash authorization failed"**:
   - Verify phone number format (09XXXXXXXXX)
   - Check GCash account balance (in test mode, any amount works)
   - Ensure proper return URL configuration

4. **"Payment verification failed"**:
   - Check payment intent ID in session storage
   - Verify webhook configuration (if using webhooks)
   - Check PayMongo dashboard for payment status

### Debug Mode
Enable debug logging by adding to console:
```javascript
// In browser console
localStorage.setItem('paymongo_debug', 'true');
```

## Support

- **PayMongo Documentation**: https://developers.paymongo.com
- **PayMongo Support**: support@paymongo.com
- **MediClinic Issues**: Create GitHub issue in repository

## Files Modified/Created

### New Files:
- `src/services/paymongoService.ts` - PayMongo API service
- `src/components/patient/PayMongoGCashPayment.tsx` - GCash payment component
- `src/pages/patient/PaymentReturn.tsx` - Payment return handler

### Modified Files:
- `src/pages/patient/PatientHome.tsx` - Added GCash payment integration
- `src/core/interfaces/IUIComponents.ts` - Updated onClick interface
- `.env.example` - Added PayMongo environment variables

## Next Steps

1. **Add Route for Payment Return**: Add route for `/patient/payment-return` in your router
2. **Test Integration**: Test the complete payment flow with test credentials
3. **Production Setup**: Configure live PayMongo keys for production deployment
4. **Monitoring**: Set up payment monitoring and analytics
