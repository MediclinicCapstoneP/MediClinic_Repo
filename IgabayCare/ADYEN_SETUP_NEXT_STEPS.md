# 🚀 Adyen Setup - Next Steps

## ✅ **What's Already Done**
- ✅ Supabase Edge Functions deployed
- ✅ Basic environment variables set
- ✅ Functions are live at: `https://ovcafionidgcipmloius.supabase.co/functions/v1/`

## 🔑 **Missing: Your Adyen Credentials**

You need to get these from your **Adyen Customer Area**:

### **1. Get API Key**
1. Go to [Adyen Customer Area](https://ca-test.adyen.com/) (test environment)
2. Navigate to **Developers → API credentials**
3. Create or select your API credential
4. Copy the **API key** (starts with `AQE...`)

### **2. Get HMAC Key for Webhooks**
1. In Customer Area, go to **Developers → Webhooks**
2. Create a new webhook or edit existing one
3. Set webhook URL to: `https://ovcafionidgcipmloius.supabase.co/functions/v1/adyen-webhooks`
4. Generate and copy the **HMAC key**

### **3. Set the Secrets in Supabase**
Run these commands with your actual values:

```bash
# Set your actual Adyen API key
npx supabase secrets set ADYEN_API_KEY=your_actual_api_key_here

# Set your actual HMAC key  
npx supabase secrets set ADYEN_HMAC_KEY=your_actual_hmac_key_here
```

### **4. Enable GCash Payment Method**
1. In Customer Area, go to **Configuration → Payment Methods**
2. Find **GCash** for Philippines (PH)
3. Enable it for your merchant account

### **5. Configure Allowed Origins (Client Key)**
1. Go to **Developers → API credentials → Client settings**
2. Add your domain: `http://localhost:5174` (for development)
3. Add your production domain when ready

## 🧪 **Test the Setup**

After setting the credentials, test your integration:

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open appointment booking modal**
3. **Click "Pay with GCash"**
4. **Check browser console** - should see Adyen components loading

## 🔍 **Troubleshooting**

### **If you get CORS errors:**
- Make sure you set the webhook URL correctly
- Check that your domain is in Adyen allowed origins

### **If payment session creation fails:**
- Verify your API key is correct
- Check that GCash is enabled for Philippines
- Make sure merchant account name matches

### **Test with these commands:**
```bash
# Test if functions are working
curl -X POST https://ovcafionidgcipmloius.supabase.co/functions/v1/adyen-sessions \
  -H "Content-Type: application/json" \
  -d '{"patientId":"test","clinicId":"test","amount":100,"returnUrl":"https://example.com"}'

# Check function logs
npx supabase functions logs adyen-sessions
```

## 📞 **Need Help?**

The functions are deployed and ready. You just need to:
1. Get your Adyen credentials
2. Set them as Supabase secrets
3. Configure webhook and payment methods in Adyen Customer Area

Once you have your credentials, run the `npx supabase secrets set` commands above, and your GCash integration will be fully functional! 🎉

---

**Next**: Get your Adyen credentials and test the payment flow!
