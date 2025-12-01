# Supabase Edge Functions Webhook Setup

## 🎯 Solution: Use Supabase Edge Functions (No ngrok required!)

Supabase Edge Functions provide a public URL that PayMongo can reach, no local setup needed.

## 📋 Setup Steps

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link to your project
```bash
supabase link --project-ref ovcafionidgcipmloius
```

### Step 4: Deploy the webhook function
```bash
supabase functions deploy paymongo-webhook
```

### Step 5: Get your webhook URL
After deployment, Supabase will give you a URL like:
```
https://ovcafionidgcipmloius.supabase.co/functions/v1/paymongo-webhook
```

### Step 6: Configure PayMongo Webhook
1. Go to your PayMongo dashboard
2. Navigate to Webhooks section
3. Add new webhook with URL: `https://ovcafionidgcipmloius.supabase.co/functions/v1/paymongo-webhook`
4. Subscribe to events: `payment.created`, `payment.updated`, `payment.paid`
5. Create webhook secret (optional but recommended)

## 🔧 Environment Variables for Edge Function

Add these to your Supabase project settings (Dashboard → Settings → Edge Functions):

```bash
SUPABASE_URL=https://ovcafionidgcipmloius.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 🎯 Benefits of This Solution

✅ **No local setup required** - Works immediately
✅ **Public URL** - PayMongo can reach it
✅ **Serverless** - No server management
✅ **Secure** - Uses Supabase authentication
✅ **Scalable** - Handles multiple webhook events
✅ **Logs** - Built-in logging in Supabase dashboard

## 🚀 Quick Commands

```bash
# Deploy webhook
supabase functions deploy paymongo-webhook

# Check function logs
supabase functions logs paymongo-webhook

# Test webhook (optional)
curl -X POST https://ovcafionidgcipmloius.supabase.co/functions/v1/paymongo-webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"test","data":{"id":"test"}}'
```

## 📊 Webhook Events Handled

- ✅ `payment.paid` - Updates appointment to 'paid' status
- ✅ `payment.updated` - Updates appointment payment status
- ✅ `payment.created` - Logs payment creation

## 🔍 Testing

1. Deploy the function
2. Update PayMongo webhook URL
3. Try a payment - check Supabase function logs
4. Appointment should automatically update to 'paid' status

## ⚠️ Important Notes

- Edge Functions use Deno runtime (not Node.js)
- Function automatically handles CORS
- Built-in error handling and logging
- No need to keep your local server running
