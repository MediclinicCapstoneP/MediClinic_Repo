# PayMongo GCash Payment Setup Instructions

## Quick Setup Guide

### 1. Get PayMongo API Keys

1. Sign up at [PayMongo Dashboard](https://dashboard.paymongo.com)
2. Go to Settings → API Keys
3. Create two keys:
   - **Public Key** (starts with `pk_test_` for test mode)
   - **Secret Key** (starts with `sk_test_` for test mode)

### 2. Configure Environment Variables

Add these to your `.env` file:

```bash
# PayMongo Configuration
VITE_PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
VITE_PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
```

**Important:** Never commit your `.env` file to version control!

### 3. Test Payment Flow

1. Start the development server: `npm run dev`
2. Book an appointment and select "Pay with GCash"
3. Complete the test payment flow

## Common Issues & Fixes

### Issue: "PayMongo API keys not configured"
**Fix:** Add the API keys to your `.env` file and restart the dev server.

### Issue: Payment redirect doesn't work
**Fix:** Ensure you're using HTTPS or localhost for testing.

### Issue: Payment status polling stops
**Fix:** Check browser console for errors and ensure popup blockers are disabled.

## Production Deployment

1. Switch to production keys (`pk_live_` and `sk_live_`)
2. Update your domain in PayMongo dashboard
3. Test the production flow thoroughly

## Support

- PayMongo Documentation: https://developers.paymongo.com
- Test GCash Account: Use any GCash account for testing
- Amount Limits: Test mode allows amounts from ₱1.00 to ₱10,000.00

## Current Fixes Applied

✅ **Fixed Amount Display** - Now shows correct total with processing fee disclaimer
✅ **Enhanced Payment Polling** - Added timeout protection and better error handling  
✅ **Improved Redirect Handling** - Popup fallback and proper cleanup
✅ **Better Error Messages** - Clear feedback for missing API keys and payment failures
✅ **Session Management** - Proper cleanup of payment session data
