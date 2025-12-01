# PayMongo Webhook Setup Guide

## 🎯 Problem
PayMongo webhooks need a publicly accessible URL, but localhost isn't reachable from external servers.

## 🔧 Solution Options

### Option 1: ngrok (Recommended for Development)
**Steps:**
1. Install ngrok: `npm install -g ngrok` or download from https://ngrok.com/
2. Start your dev server: `npm run dev` (usually on port 5173)
3. In a NEW terminal, run: `ngrok http 5173`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Update your PayMongo webhook to use: `https://abc123.ngrok.io/api/paymongo/webhook`

**PayMongo Webhook Configuration:**
- **URL**: `https://your-ngrok-url.ngrok.io/api/paymongo/webhook`
- **Events**: `payment.created`, `payment.updated`, `payment.paid`
- **Secret**: Create a webhook secret and add to your .env

### Option 2: Supabase Edge Functions (Production Ready)
**Steps:**
1. Create webhook handler in Supabase Edge Functions
2. Use your Supabase project URL as webhook endpoint
3. Configure PayMongo to call: `https://your-project.supabase.co/functions/v1/paymongo-webhook`

### Option 3: Temporary Testing (No Webhook)
For immediate testing without webhooks:
1. Use the enhanced polling I added earlier
2. Manually check payment status
3. This works but is less reliable than webhooks

## 🚀 Quick ngrok Setup Commands

```bash
# 1. Start your app
npm run dev

# 2. In another terminal, start ngrok
ngrok http 5173

# 3. Update PayMongo webhook URL
# Copy ngrok URL and add: /api/paymongo/webhook
```

## 📋 PayMongo Webhook Events to Subscribe:
- ✅ `payment.created` - Payment initiated
- ✅ `payment.updated` - Payment status changed  
- ✅ `payment.paid` - Payment completed successfully

## 🔐 Webhook Security
Add webhook secret to your .env:
```bash
VITE_PAYMONGO_WEBHOOK_SECRET=your_webhook_secret_here
```

## ⚠️ Important Notes
- ngrok URLs change each time you restart ngrok
- For production, use Supabase Edge Functions or a real server
- Test webhooks in PayMongo dashboard after setup
