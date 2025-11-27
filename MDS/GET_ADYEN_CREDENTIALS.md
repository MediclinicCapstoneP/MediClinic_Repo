# 🔑 How to Get Your Adyen Credentials

## ✅ **Quick Fix Applied**
I've temporarily switched your app to use **mock Adyen service** so you can test the UI right now without real credentials.

**Try it now:**
1. Run `npm run dev`
2. Go to appointment booking  
3. Click "Pay with GCash"
4. You'll see a mock payment interface that works! 🎉

## 🚀 **To Get Real Adyen Credentials (when ready):**

### **Step 1: Create Adyen Account**
1. Go to [Adyen.com](https://www.adyen.com/)
2. Click **"Get started"** 
3. Fill out the form (business details required)
4. Wait for approval (can take 1-2 business days)

### **Step 2: Access Test Environment**
After approval:
1. Login to [Adyen Customer Area - Test](https://ca-test.adyen.com/)
2. You'll see your dashboard

### **Step 3: Get API Credentials**
1. Navigate to **Developers → API credentials**
2. Create a new **API credential** if none exists
3. Copy these values:
   - **API Key** (starts with `AQE...`) - for server
   - **Client Key** (starts with `test_...`) - for frontend
   - **Merchant Account** (your account name)

### **Step 4: Enable GCash**
1. Go to **Configuration → Payment Methods**
2. Search for **"GCash"**
3. Enable it for **Philippines (PH)**
4. Configure any settings if needed

### **Step 5: Set Up Webhook**
1. Go to **Developers → Webhooks**
2. Click **"Add webhook"**
3. Set URL: `https://ovcafionidgcipmloius.supabase.co/functions/v1/adyen-webhooks`
4. Select events: `AUTHORISATION`, `PENDING`, `CANCELLATION`, `REFUND`
5. Generate and save the **HMAC Key**

### **Step 6: Configure Client Settings**
1. In your API credential, go to **Client settings**
2. Add allowed origins:
   - `http://localhost:5174` (development)
   - Your production domain (later)

## 🔧 **Update Your App (when you have credentials):**

### **1. Set Supabase Secrets:**
```bash
npx supabase secrets set ADYEN_API_KEY=your_real_api_key_here
npx supabase secrets set ADYEN_HMAC_KEY=your_real_hmac_key_here
```

### **2. Update .env File:**
```bash
VITE_ADYEN_CLIENT_KEY=your_real_client_key_here
VITE_ADYEN_MERCHANT_ACCOUNT=YourMerchantAccount
```

### **3. Switch Back to Real Component:**
In `AppointmentBookingModal.tsx`, change:
```tsx
// FROM (development)
import GCashPayment from '../payment/GCashPaymentDev';

// TO (production)
import GCashPayment from '../payment/GCashPayment';
```

## 🧪 **Testing Right Now**

**With the mock service, you can test:**
- ✅ Appointment booking flow
- ✅ Payment UI and UX  
- ✅ Success/error handling
- ✅ Database integration (appointments get created)
- ✅ All UI components and styling

**What won't work until you get real credentials:**
- ❌ Actual money processing
- ❌ Real Adyen payment forms
- ❌ Webhook notifications from Adyen
- ❌ Real payment status updates

## 💡 **Why This Approach?**

1. **Test Immediately**: You can test your booking flow right now
2. **No Waiting**: Don't wait for Adyen approval to develop
3. **Safe Development**: No risk of accidental charges
4. **Easy Switch**: One line change when you get real credentials

## 📞 **Need Help?**

Your appointment booking with GCash payments is **working right now** with mock data! 

When you're ready for real payments:
1. Get Adyen credentials (steps above)
2. Update the secrets and environment variables  
3. Switch the import back to the real component

**Try the mock version now - your booking flow should work perfectly!** 🎉

---

**Next**: Test your appointment booking with the mock GCash payments!
