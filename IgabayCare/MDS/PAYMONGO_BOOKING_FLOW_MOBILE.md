# PayMongo Checkout Session - Patient Booking Flow for Mobile

## 📋 Overview

This guide explains how PayMongo checkout sessions work in the patient appointment booking flow, specifically for mobile app implementation. The system uses a **payment-first** approach where payment is processed before the appointment is confirmed.

---

## 🔄 Complete Payment & Booking Flow

### **Phase 1: Patient Initiates Booking**

#### Step 1.1: User Selects Appointment Details

**Mobile App Actions:**
1. Patient opens clinic booking screen
2. Patient selects:
   - Appointment date (from calendar)
   - Appointment time (from available slots)
   - Appointment type (consultation, follow-up, emergency, etc.)
   - Additional services (optional)
   - Patient notes (optional)

**Data Collected:**
```typescript
{
  clinic_id: string,
  appointment_date: string,        // Format: "YYYY-MM-DD"
  appointment_time: string,        // Format: "HH:MM:SS" or "HH:MM"
  appointment_type: string,
  patient_notes?: string,
  selected_services?: string[]
}
```

#### Step 1.2: Calculate Appointment Cost

**Mobile Implementation:**
```typescript
// Calculate total cost
const consultationFee = 500;  // PHP (from clinic settings or default)
const bookingFee = 50;         // PHP (fixed)
const totalAmount = consultationFee + bookingFee;

// Cost structure
{
  consultation_fee: 500,
  booking_fee: 50,
  total_amount: 550
}
```

**Note:** Fee amounts may come from:
- Clinic settings (consultation fee)
- System default (booking fee)
- Appointment type pricing

---

### **Phase 2: Create PayMongo Checkout Session**

#### Step 2.1: Prepare Checkout Session Request

**API Endpoint:**
```
POST /api/payments/checkout-session
OR
Direct call to PayMongo API: POST https://api.paymongo.com/v1/checkout_sessions
```

**Request Body:**
```typescript
interface CheckoutSessionRequest {
  amount: number;                    // Total in PHP (will be converted to centavos)
  description: string;               // "Appointment booking at {clinic_name}"
  patient_name: string;              // Full name
  patient_email: string;             // Patient email
  patient_phone: string;             // Phone number
  success_url: string;               // REQUIRED: Public HTTPS URL for mobile
  cancel_url?: string;               // Optional: Defaults to success_url
  clinic_id: string;
  clinic_name: string;
  appointment_date: string;          // "YYYY-MM-DD"
  appointment_time: string;          // "HH:MM"
  appointment_type: string;
  patient_notes?: string;
  consultation_fee?: number;
  booking_fee?: number;
  patient_id: string;
  metadata?: Record<string, any>;    // Additional custom data
}
```

**Example Request:**
```json
{
  "amount": 550,
  "description": "Appointment booking at ABC Medical Clinic",
  "patient_name": "Juan dela Cruz",
  "patient_email": "juan@example.com",
  "patient_phone": "+639123456789",
  "success_url": "https://yourdomain.com/patient/payment-return",
  "cancel_url": "https://yourdomain.com/patient/payment-return",
  "clinic_id": "uuid",
  "clinic_name": "ABC Medical Clinic",
  "appointment_date": "2024-02-15",
  "appointment_time": "14:30",
  "appointment_type": "consultation",
  "patient_notes": "Follow-up for previous consultation",
  "consultation_fee": 500,
  "booking_fee": 50,
  "patient_id": "uuid",
  "metadata": {
    "selected_services": "Consultation,Lab Test"
  }
}
```

#### Step 2.2: PayMongo API Request

**HTTP Request:**
```http
POST https://api.paymongo.com/v1/checkout_sessions
Authorization: Basic {base64(secret_key:)}
Content-Type: application/json

{
  "data": {
    "attributes": {
      "type": "standard",
      "amount": 55000,              // Amount in centavos (PHP * 100)
      "currency": "PHP",
      "description": "Appointment booking at ABC Medical Clinic",
      "line_items": [
        {
          "amount": 55000,
          "currency": "PHP",
          "name": "Appointment booking at ABC Medical Clinic",
          "quantity": 1
        }
      ],
      "billing": {
        "name": "Juan dela Cruz",
        "email": "juan@example.com",
        "phone": "+639123456789"
      },
      "payment_method_types": ["gcash"],
      "success_url": "https://yourdomain.com/patient/payment-return",
      "cancel_url": "https://yourdomain.com/patient/payment-return",
      "metadata": {
        "clinic_id": "uuid",
        "clinic_name": "ABC Medical Clinic",
        "appointment_date": "2024-02-15",
        "appointment_time": "14:30",
        "appointment_type": "consultation",
        "patient_notes": "Follow-up for previous consultation",
        "consultation_fee": "500",
        "booking_fee": "50",
        "patient_id": "uuid",
        "selected_services": "Consultation,Lab Test",
        "source": "mediclinic_app",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    }
  }
}
```

**Important Notes:**
- ✅ Amount must be in **centavos** (multiply PHP amount by 100)
- ✅ `success_url` must be **publicly accessible HTTPS URL**
- ✅ `cancel_url` defaults to `success_url` if not provided
- ✅ Metadata is stored as strings (numbers must be converted)

#### Step 2.3: PayMongo Response

**Success Response:**
```json
{
  "data": {
    "id": "cs_test_xxxxxxxxxxxxx",
    "type": "checkout_session",
    "attributes": {
      "type": "standard",
      "amount": 55000,
      "currency": "PHP",
      "description": "Appointment booking at ABC Medical Clinic",
      "status": "pending",
      "checkout_url": "https://payments.paymongo.com/checkout/cs_test_xxxxxxxxxxxxx",
      "payment_intent_id": null,
      "line_items": [...],
      "billing": {...},
      "metadata": {...}
    }
  }
}
```

**Key Fields:**
- `id`: Checkout session ID (starts with `cs_`) - **SAVE THIS**
- `attributes.checkout_url`: URL to redirect user for payment
- `attributes.status`: Initial status is `pending`

#### Step 2.4: Store Booking Data Locally

**Mobile App Actions:**
```typescript
// Store booking data in local storage/session
const bookingData = {
  patient_id: patientId,
  clinic_id: clinic.id,
  appointment_date: dateStr,           // "YYYY-MM-DD"
  appointment_time: selectedTime,      // "HH:MM:SS"
  appointment_type: appointmentType,
  patient_notes: composedNotes,
  consultation_fee: cost.consultation_fee,
  booking_fee: cost.booking_fee,
  total_amount: cost.total_amount,
  selected_services: selectedServices
};

// Store in mobile app storage
await AsyncStorage.setItem('pending_booking_data', JSON.stringify(bookingData));
await AsyncStorage.setItem('checkout_session_id', checkoutSessionId);

// Or use mobile session storage equivalent
sessionStorage.setItem('pending_booking_data', JSON.stringify(bookingData));
sessionStorage.setItem('checkout_session_id', checkoutSessionId);
```

---

### **Phase 3: Redirect to PayMongo Payment**

#### Step 3.1: Open PayMongo Checkout URL

**Mobile Implementation:**
```typescript
// For React Native / Mobile Web
import { Linking } from 'react-native';

// Open PayMongo checkout URL in browser/webview
const checkoutUrl = checkoutSession.attributes.checkout_url;
await Linking.openURL(checkoutUrl);

// OR use WebView component
<WebView 
  source={{ uri: checkoutUrl }}
  onNavigationStateChange={(navState) => {
    // Monitor navigation to detect return
    if (navState.url.includes('payment-return')) {
      handlePaymentReturn(navState.url);
    }
  }}
/>
```

**Important:**
- PayMongo checkout URL is **external** - user leaves your app temporarily
- Mobile app should handle deep linking back after payment

---

### **Phase 4: User Completes Payment**

#### Step 4.1: Payment Process

**User Actions:**
1. User sees PayMongo checkout page
2. User selects GCash as payment method
3. User is redirected to GCash app/website
4. User authorizes payment in GCash
5. Payment is processed

**PayMongo Updates:**
- Checkout session status changes from `pending` → `paid`
- `payment_intent_id` is populated (if applicable)

---

### **Phase 5: Payment Return & Verification**

#### Step 5.1: PayMongo Redirects User

**Return URL Format:**
```
https://yourdomain.com/patient/payment-return?checkout_session_id=cs_test_xxxxxxxxxxxxx
```

**Important for Mobile:**
- ✅ URL must be publicly accessible (not `api.paymongo.com`)
- ✅ Must use HTTPS
- ✅ Should handle deep linking back to mobile app

**Mobile Deep Link Handling:**
```typescript
// Configure deep link scheme in mobile app
// iOS: Info.plist
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>igabaycare</string>
    </array>
  </dict>
</array>

// Android: AndroidManifest.xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="igabaycare" />
</intent-filter>

// PayMongo success URL for mobile:
success_url: "igabaycare://payment-return?checkout_session_id={CHECKOUT_SESSION_ID}"

// OR use universal link / app link:
success_url: "https://yourdomain.com/app/payment-return?checkout_session_id={CHECKOUT_SESSION_ID}"
```

#### Step 5.2: Retrieve Checkout Session ID

**Mobile Implementation:**
```typescript
// From URL parameters
const urlParams = new URLSearchParams(returnUrl.split('?')[1]);
const checkoutSessionId = urlParams.get('checkout_session_id');

// Fallback to stored value
if (!checkoutSessionId) {
  checkoutSessionId = await AsyncStorage.getItem('checkout_session_id');
}

// Validate format (should start with 'cs_')
if (!checkoutSessionId || !checkoutSessionId.startsWith('cs_')) {
  // Handle error
  throw new Error('Invalid checkout session ID');
}
```

#### Step 5.3: Verify Payment Status

**API Endpoint:**
```
GET /api/payments/checkout-session/{checkoutSessionId}/verify
OR
Direct: GET https://api.paymongo.com/v1/checkout_sessions/{checkoutSessionId}
```

**Request:**
```http
GET https://api.paymongo.com/v1/checkout_sessions/cs_test_xxxxxxxxxxxxx
Authorization: Basic {base64(secret_key:)}
```

**Response (Success):**
```json
{
  "data": {
    "id": "cs_test_xxxxxxxxxxxxx",
    "type": "checkout_session",
    "attributes": {
      "status": "paid",              // ✅ Payment successful
      "amount": 55000,
      "currency": "PHP",
      "checkout_url": "...",
      "payment_intent_id": "pi_xxxxx",
      "metadata": {
        "clinic_id": "uuid",
        "appointment_date": "2024-02-15",
        ...
      }
    }
  }
}
```

**Payment Status Values:**
- `pending`: Payment not yet completed
- `paid`: ✅ Payment successful
- `unpaid`: Payment failed or expired
- `active`: Session is active (may need to check payment_intent)

**Retry Logic (Important):**
```typescript
// PayMongo may need time to update status
// Implement retry with delays:

async function verifyPayment(checkoutSessionId: string, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await getCheckoutSession(checkoutSessionId);
    
    if (result.attributes.status === 'paid') {
      return { success: true, status: 'paid' };
    }
    
    // Wait before retry (2s, 4s, 6s delays)
    if (attempt < maxRetries - 1) {
      await delay((attempt + 1) * 2000);
    }
  }
  
  return { success: false, error: 'Payment verification timeout' };
}
```

---

### **Phase 6: Create Appointment After Payment**

#### Step 6.1: Check for Duplicate Booking

**Database Query:**
```sql
-- Table: appointments

-- Check by payment_intent_id (checkout session ID)
SELECT id 
FROM appointments 
WHERE payment_intent_id = {checkoutSessionId}
LIMIT 1;

-- If not found, check by unique combination
SELECT id 
FROM appointments 
WHERE patient_id = {patientId}
  AND clinic_id = {clinicId}
  AND appointment_date = {appointmentDate}
  AND appointment_time = {appointmentTime}
  AND status IN ('confirmed', 'scheduled')
LIMIT 1;
```

#### Step 6.2: Retrieve Stored Booking Data

**Mobile Implementation:**
```typescript
// Retrieve from local storage
const bookingDataStr = await AsyncStorage.getItem('pending_booking_data');
if (!bookingDataStr) {
  throw new Error('Booking data not found');
}

const bookingData = JSON.parse(bookingDataStr);
```

#### Step 6.3: Create Appointment Record

**API Endpoint:**
```
POST /api/appointments
```

**Request Body:**
```typescript
{
  patient_id: bookingData.patient_id,
  clinic_id: bookingData.clinic_id,
  appointment_date: bookingData.appointment_date,    // "YYYY-MM-DD"
  appointment_time: bookingData.appointment_time,    // "HH:MM:SS"
  appointment_type: bookingData.appointment_type,
  patient_notes: bookingData.patient_notes,
  status: 'confirmed',                                // ✅ Confirmed after payment
  payment_method: 'gcash',
  payment_status: 'paid',                             // ✅ Paid
  payment_intent_id: checkoutSessionId,               // Use checkout session ID
  total_amount: bookingData.total_amount,
  consultation_fee: bookingData.consultation_fee,
  booking_fee: bookingData.booking_fee
}
```

**Database Insert:**
```sql
-- Table: appointments
INSERT INTO appointments (
  patient_id,
  clinic_id,
  appointment_date,
  appointment_time,
  appointment_type,
  status,
  patient_notes,
  payment_method,
  payment_status,
  payment_intent_id,        -- Stores checkout_session_id
  total_amount,
  consultation_fee,
  booking_fee,
  created_at,
  updated_at
) VALUES (
  {patient_id},
  {clinic_id},
  {appointment_date}::date,
  {appointment_time}::time,
  {appointment_type},
  'confirmed',
  {patient_notes},
  'gcash',
  'paid',
  {checkoutSessionId},       -- Link to payment
  {total_amount},
  {consultation_fee},
  {booking_fee},
  NOW(),
  NOW()
)
RETURNING *;
```

#### Step 6.4: Send Confirmation Notification

**After appointment creation:**
```typescript
// Notification service sends:
// - Email confirmation
// - Push notification (if enabled)
// - SMS reminder (if configured)
```

#### Step 6.5: Clean Up Local Storage

**Mobile Implementation:**
```typescript
// Clear stored booking data
await AsyncStorage.removeItem('pending_booking_data');
await AsyncStorage.removeItem('checkout_session_id');
```

---

## 🗄️ Database Tables Used

### **Primary Table: `appointments`**

```sql
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id),
  clinic_id uuid REFERENCES clinics(id),
  doctor_id uuid,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  appointment_type text,
  status text DEFAULT 'scheduled',
  patient_notes text,
  
  -- Payment fields (critical for booking flow)
  payment_method text,
  payment_status text,              -- 'pending' | 'paid' | 'refunded'
  payment_intent_id text,           -- Stores checkout_session_id from PayMongo
  total_amount decimal(10,2),
  consultation_fee decimal(10,2),
  booking_fee decimal(10,2),
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for payment lookup
CREATE INDEX idx_appointments_payment_intent_id ON appointments(payment_intent_id);
```

---

## 📱 Mobile-Specific Implementation Guide

### **1. Success/Cancel URLs for Mobile**

**Option A: Deep Link URL Scheme**
```
Success URL: igabaycare://payment-return?checkout_session_id={CHECKOUT_SESSION_ID}
Cancel URL: igabaycare://payment-cancel?checkout_session_id={CHECKOUT_SESSION_ID}
```

**Option B: Universal Link / App Link**
```
Success URL: https://yourdomain.com/app/payment-return?checkout_session_id={CHECKOUT_SESSION_ID}
Cancel URL: https://yourdomain.com/app/payment-cancel?checkout_session_id={CHECKOUT_SESSION_ID}
```

**Option C: Web Page with Deep Link Redirect**
```
Success URL: https://yourdomain.com/patient/payment-return?checkout_session_id={CHECKOUT_SESSION_ID}

This page:
1. Receives checkout_session_id from PayMongo
2. Verifies payment
3. Creates appointment
4. Redirects to mobile app via deep link:
   igabaycare://appointment-success?appointment_id={id}
```

**Recommended Approach:**
- Use **Option C** for maximum compatibility
- Web page handles payment verification and booking creation
- Deep link redirects back to mobile app with success status

### **2. Mobile App Configuration**

**iOS (Info.plist):**
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.igabaycare.app</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>igabaycare</string>
    </array>
  </dict>
</array>

<!-- Universal Links -->
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:yourdomain.com</string>
</array>
```

**Android (AndroidManifest.xml):**
```xml
<!-- Deep Links -->
<activity android:name=".MainActivity">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
      android:scheme="igabaycare"
      android:host="payment-return" />
  </intent-filter>
  
  <!-- App Links -->
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
      android:scheme="https"
      android:host="yourdomain.com"
      android:pathPrefix="/app/payment-return" />
  </intent-filter>
</activity>
```

### **3. Handling Deep Link Returns**

**React Native Example:**
```typescript
import { Linking } from 'react-native';

// Listen for deep links
useEffect(() => {
  const subscription = Linking.addEventListener('url', handleDeepLink);
  
  // Check if app was opened from deep link
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink({ url });
  });
  
  return () => subscription.remove();
}, []);

function handleDeepLink(event: { url: string }) {
  const url = new URL(event.url);
  
  if (url.pathname === '/payment-return') {
    const checkoutSessionId = url.searchParams.get('checkout_session_id');
    if (checkoutSessionId) {
      verifyPaymentAndCreateBooking(checkoutSessionId);
    }
  }
}
```

---

## 🔌 Mobile API Endpoints

### **Endpoint 1: Create Checkout Session**

```
POST /api/payments/checkout-session
Content-Type: application/json
Authorization: Bearer {patient_token}

Request:
{
  "amount": 550,
  "description": "Appointment booking at Clinic Name",
  "patient_name": "Patient Name",
  "patient_email": "patient@example.com",
  "patient_phone": "+639123456789",
  "success_url": "https://yourdomain.com/patient/payment-return",
  "clinic_id": "uuid",
  "clinic_name": "Clinic Name",
  "appointment_date": "2024-02-15",
  "appointment_time": "14:30",
  "appointment_type": "consultation",
  "patient_notes": "Notes",
  "consultation_fee": 500,
  "booking_fee": 50,
  "patient_id": "uuid"
}

Response:
{
  "success": true,
  "checkout_url": "https://payments.paymongo.com/checkout/cs_xxxxx",
  "checkout_session_id": "cs_test_xxxxxxxxxxxxx"
}
```

### **Endpoint 2: Verify Checkout Session**

```
GET /api/payments/checkout-session/{checkoutSessionId}/verify
Authorization: Bearer {patient_token}

Response:
{
  "success": true,
  "checkout_session_id": "cs_test_xxxxxxxxxxxxx",
  "status": "paid",
  "amount": 55000,
  "currency": "PHP"
}
```

### **Endpoint 3: Create Appointment (After Payment)**

```
POST /api/appointments
Content-Type: application/json
Authorization: Bearer {patient_token}

Request:
{
  "patient_id": "uuid",
  "clinic_id": "uuid",
  "appointment_date": "2024-02-15",
  "appointment_time": "14:30:00",
  "appointment_type": "consultation",
  "patient_notes": "Notes",
  "status": "confirmed",
  "payment_method": "gcash",
  "payment_status": "paid",
  "payment_intent_id": "cs_test_xxxxxxxxxxxxx",
  "total_amount": 550,
  "consultation_fee": 500,
  "booking_fee": 50
}

Response:
{
  "success": true,
  "appointment": {
    "id": "uuid",
    "appointment_date": "2024-02-15",
    "appointment_time": "14:30:00",
    "status": "confirmed",
    ...
  }
}
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP FLOW                           │
└─────────────────────────────────────────────────────────────┘

1. User Selects Appointment
   ├─ Date, Time, Type
   └─ Calculate Cost (₱500 + ₱50 = ₱550)

2. Create Checkout Session
   ├─ POST /api/payments/checkout-session
   ├─ Request includes: amount, patient info, appointment details
   └─ Response: checkout_url, checkout_session_id

3. Store Booking Data Locally
   ├─ Save booking details to AsyncStorage
   └─ Save checkout_session_id

4. Redirect to PayMongo
   ├─ Open checkout_url in browser/webview
   └─ User completes GCash payment

5. PayMongo Redirects Back
   ├─ Redirect to: success_url?checkout_session_id=cs_xxx
   ├─ Mobile app receives deep link
   └─ Extract checkout_session_id

6. Verify Payment
   ├─ GET /api/payments/checkout-session/{id}/verify
   ├─ Retry logic (up to 3 times with delays)
   └─ Check status === 'paid'

7. Create Appointment
   ├─ Retrieve booking data from storage
   ├─ POST /api/appointments
   ├─ Include payment_intent_id (checkout_session_id)
   └─ Status: 'confirmed', payment_status: 'paid'

8. Clean Up & Show Success
   ├─ Remove stored booking data
   ├─ Clear checkout_session_id
   └─ Navigate to appointment confirmation screen
```

---

## ⚠️ Error Handling

### **Common Errors & Solutions**

**1. Checkout Session Creation Failed**
```typescript
// Error: API keys not configured
Solution: Verify PayMongo secret key is set in environment

// Error: Invalid success_url
Solution: Ensure URL is publicly accessible HTTPS

// Error: Amount validation failed
Solution: Check amount is positive and in valid range
```

**2. Payment Verification Failed**
```typescript
// Error: Session not found
Solution: Verify checkout_session_id format (starts with 'cs_')

// Error: Status still 'pending'
Solution: Implement retry logic with delays (2s, 4s, 6s)

// Error: Network timeout
Solution: Increase timeout, implement exponential backoff
```

**3. Appointment Creation Failed**
```typescript
// Error: Duplicate appointment
Solution: Check for existing appointment before creating

// Error: Invalid patient_id/clinic_id
Solution: Verify IDs exist and user has permission

// Error: Time slot no longer available
Solution: Re-check availability before creating appointment
```

---

## 🔐 Security Considerations

### **API Key Management**
- ✅ Use **secret key** for server-side API calls (creating sessions, verifying)
- ✅ Never expose secret key in mobile app
- ✅ Use **public key** only for client-side operations (if any)
- ✅ Store keys securely in environment variables / secure storage

### **Payment Verification**
- ✅ Always verify payment status on server before creating appointment
- ✅ Never trust client-side payment status
- ✅ Use checkout_session_id to prevent duplicate bookings
- ✅ Implement idempotency checks

### **Data Validation**
- ✅ Validate all amounts (positive, reasonable limits)
- ✅ Sanitize user input (patient notes, etc.)
- ✅ Verify appointment date/time is in future
- ✅ Check clinic availability before allowing payment

---

## 📝 Mobile Implementation Checklist

### **Pre-Payment:**
- [ ] Calculate appointment cost correctly
- [ ] Validate appointment date/time selection
- [ ] Get patient information (name, email, phone)
- [ ] Prepare checkout session request with all required fields
- [ ] Set up proper success/cancel URLs (deep links or web pages)

### **Payment Process:**
- [ ] Create checkout session via API
- [ ] Store booking data locally (AsyncStorage/SQLite)
- [ ] Store checkout_session_id locally
- [ ] Redirect to PayMongo checkout_url
- [ ] Handle browser/webview navigation

### **Payment Return:**
- [ ] Configure deep link handling
- [ ] Extract checkout_session_id from URL
- [ ] Verify payment status (with retry logic)
- [ ] Handle payment verification errors gracefully

### **Appointment Creation:**
- [ ] Retrieve stored booking data
- [ ] Check for duplicate appointments
- [ ] Create appointment with payment details
- [ ] Link appointment to payment (payment_intent_id)
- [ ] Handle appointment creation errors

### **Post-Booking:**
- [ ] Clean up local storage
- [ ] Show success confirmation
- [ ] Navigate to appointment details
- [ ] Send confirmation notification (if applicable)

---

## 🧪 Testing Guidelines

### **Test Scenarios:**

1. **Successful Payment Flow**
   - Create session → Pay → Verify → Book → Confirm

2. **Payment Cancellation**
   - Create session → Cancel → Verify no appointment created

3. **Payment Verification Retry**
   - Create session → Pay → Simulate pending status → Retry verification

4. **Duplicate Booking Prevention**
   - Verify payment → Try to create appointment twice → Second attempt fails

5. **Network Error Handling**
   - Simulate network failure at each step → Verify graceful error handling

6. **Invalid Session ID**
   - Test with malformed session ID → Verify error handling

### **Test Data:**
- Use PayMongo **test mode** keys (`sk_test_...`, `pk_test_...`)
- Use test GCash accounts provided by PayMongo
- Test with small amounts (₱1.00 minimum)

---

## 📊 Request/Response Examples

### **Full Request Flow Example:**

```typescript
// 1. Calculate Cost
const cost = {
  consultation_fee: 500,
  booking_fee: 50,
  total_amount: 550
};

// 2. Create Checkout Session Request
const checkoutRequest = {
  amount: 550,
  description: `Appointment booking at ${clinic.clinic_name}`,
  patient_name: `${patient.first_name} ${patient.last_name}`,
  patient_email: patient.email,
  patient_phone: patient.phone,
  success_url: 'https://yourdomain.com/patient/payment-return',
  clinic_id: clinic.id,
  clinic_name: clinic.clinic_name,
  appointment_date: '2024-02-15',
  appointment_time: '14:30',
  appointment_type: 'consultation',
  patient_notes: 'Follow-up consultation',
  consultation_fee: 500,
  booking_fee: 50,
  patient_id: patient.id
};

// 3. Create Session
const sessionResult = await createCheckoutSession(checkoutRequest);
// Returns: { checkout_url, checkout_session_id }

// 4. Store Data
await AsyncStorage.setItem('pending_booking_data', JSON.stringify({
  ...checkoutRequest,
  checkout_session_id: sessionResult.checkout_session_id
}));

// 5. Redirect User
await Linking.openURL(sessionResult.checkout_url);

// 6. After Return - Verify Payment
const verification = await verifyCheckoutSession(sessionResult.checkout_session_id);
// Returns: { success: true, status: 'paid' }

// 7. Create Appointment
const appointment = await createAppointment({
  ...bookingData,
  payment_intent_id: sessionResult.checkout_session_id,
  status: 'confirmed',
  payment_status: 'paid'
});
```

---

## 🎯 Key Takeaways for Mobile Developers

1. **Payment-First Approach**: Payment must succeed before appointment is created
2. **URL Requirements**: Success/cancel URLs must be publicly accessible HTTPS
3. **Deep Linking**: Configure deep links to return user to app after payment
4. **Retry Logic**: Implement retry for payment verification (PayMongo may need time)
5. **Local Storage**: Store booking data locally until payment is confirmed
6. **Error Handling**: Handle all error scenarios gracefully
7. **Security**: Never expose PayMongo secret key in mobile app
8. **Duplicate Prevention**: Check for existing appointments before creating

---

This guide provides everything mobile developers need to implement PayMongo checkout session payment in the appointment booking flow for IgabayCare mobile app.

