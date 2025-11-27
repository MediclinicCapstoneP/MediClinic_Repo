# Adyen Webhook Events Configuration

## 🎯 Recommended Events to Enable

When configuring your webhook in Adyen Customer Area, enable these events for complete payment tracking:

### ✅ **Essential Events** (Must enable)
```
AUTHORISATION          # ⭐ Payment authorized/refused
PENDING               # ⭐ Payment pending (common with GCash)
CANCELLATION          # ⭐ Payment cancelled
REFUND                # ⭐ Refund processed
```

### 🔍 **Recommended Events** (Good to have)
```
CAPTURE               # Payment captured (for manual capture)
CAPTURE_FAILED        # Capture attempt failed
REFUND_FAILED         # Refund attempt failed
REFUND_WITH_DATA      # Refund with additional data
TECHNICAL_CANCEL      # Technical cancellation
```

### 🛡️ **Risk Management Events** (For fraud protection)
```
MANUAL_REVIEW_ACCEPT  # Manual review approved
MANUAL_REVIEW_REJECT  # Manual review rejected
NOTIFICATION_OF_FRAUD # Fraud notification
CHARGEBACK           # Chargeback initiated
CHARGEBACK_REVERSED  # Chargeback reversed
SECOND_CHARGEBACK    # Second chargeback
```

### 📊 **Optional Events** (For advanced features)
```
CANCEL_OR_REFUND     # Cancel or refund operation
ORDER_OPENED         # Order opened
ORDER_CLOSED         # Order completed
REPORT_AVAILABLE     # Settlement report available
```

## 🚀 Quick Setup in Adyen Customer Area

1. **Go to**: Customer Area → Developers → Webhooks
2. **Click**: "Add Webhook"
3. **URL**: `https://ovcafionidgcipmloius.supabase.co/functions/v1/adyen-webhooks`
4. **Method**: POST
5. **Enable Events**: Select the events from the lists above
6. **Generate HMAC Key**: Save this key for your Supabase secrets
7. **Save & Test**

## 🔧 Status Mapping in Your System

Our webhook handler maps Adyen events to your local payment statuses:

| Adyen Event | Your Status | Description |
|-------------|-------------|-------------|
| `AUTHORISATION` (success=true) | `authorized` | Payment successful |
| `AUTHORISATION` (success=false) | `refused` | Payment declined |
| `PENDING` | `pending` | Payment processing |
| `CANCELLATION` | `cancelled` | Payment cancelled |
| `TECHNICAL_CANCEL` | `cancelled` | Technical cancellation |
| `REFUND` | `refunded` | Money refunded |
| `REFUND_WITH_DATA` | `refunded` | Refund with extra data |
| `REFUND_FAILED` | `refund_failed` | Refund attempt failed |
| `CAPTURE` (success=true) | `captured` | Payment captured |
| `CAPTURE_FAILED` | `capture_failed` | Capture failed |
| `CHARGEBACK` | `chargeback` | Dispute opened |
| `CHARGEBACK_REVERSED` | `chargeback_reversed` | Dispute resolved |
| `MANUAL_REVIEW_ACCEPT` | `authorized` | Manual review approved |
| `MANUAL_REVIEW_REJECT` | `refused` | Manual review rejected |
| `NOTIFICATION_OF_FRAUD` | `fraud_notification` | Fraud detected |

## 💡 Pro Tips

- **Start Minimal**: Enable just `AUTHORISATION`, `PENDING`, `CANCELLATION`, `REFUND` initially
- **Add Gradually**: Enable more events as you need advanced features
- **Test Events**: Use Adyen's webhook tester to verify each event type
- **Monitor Logs**: Check Supabase function logs to see which events you're receiving
- **Handle Unknown Events**: Our webhook handler gracefully handles any unrecognized events

## 🧪 Testing Your Webhook

After configuration, test with Adyen's webhook tester:
1. Go to Customer Area → Developers → Webhooks
2. Click on your webhook
3. Use "Test webhook" feature
4. Check Supabase logs: `supabase functions logs adyen-webhooks`

Your webhook should respond with `[accepted]` and update your database accordingly!
