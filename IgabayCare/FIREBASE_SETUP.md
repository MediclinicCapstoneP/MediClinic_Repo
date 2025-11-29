# Firebase Cloud Messaging (FCM) Setup Guide

This guide will help you set up Firebase Cloud Messaging for the MediClinic push notification system.

## Prerequisites

- Firebase project (create one at https://console.firebase.google.com)
- Web app configured in Firebase project
- FCM configuration details

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name (e.g., "mediclinic-web")
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Register Web App

1. In your Firebase project, click the Web icon (`</>`) to add a web app
2. Enter app nickname (e.g., "MediClinic Web")
3. Click "Register app"
4. Copy the Firebase configuration object

## Step 3: Update Firebase Configuration

Edit `src/config/firebase.ts` and replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id",
  measurementId: "your-actual-measurement-id"
};
```

## Step 4: Generate VAPID Key

1. In Firebase Console, go to Project Settings → Cloud Messaging
2. Under "Web configuration", click "Generate key pair"
3. Copy the public key (VAPID key)
4. Update the `vapidKey` in `src/config/firebase.ts`:

```typescript
export const vapidKey = "your-actual-vapid-key";
```

## Step 5: Update Service Worker

The service worker at `public/firebase-messaging-sw.js` needs to be updated with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id",
  measurementId: "your-measurement-id"
};
```

## Step 6: Backend Integration

For sending notifications from your backend, you'll need to:

1. Install Firebase Admin SDK on your server
2. Set up server-side FCM configuration
3. Create API endpoints for sending notifications

### Example Backend Setup (Node.js)

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Send notification function
async function sendNotification(targetToken, title, body, data = {}) {
  const message = {
    notification: {
      title: title,
      body: body,
      icon: '/favicon.ico'
    },
    data: data,
    token: targetToken
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}
```

## Step 7: Environment Variables

Add your Firebase configuration to your environment:

```bash
# .env.local
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

## Step 8: Test the Implementation

1. Start your development server
2. Navigate to `/push-notification-test` (development only)
3. Test the following:
   - Request notification permission
   - Initialize FCM token
   - Send test notifications
   - Check notification display

## Step 9: Production Deployment

For production deployment:

1. Ensure your service worker is properly deployed
2. Test notifications in HTTPS (required for FCM)
3. Monitor Firebase console for delivery statistics
4. Set up proper error handling and retry logic

## Common Issues and Solutions

### "Push notifications are not supported"
- Ensure you're using HTTPS or localhost
- Check browser compatibility (Chrome, Firefox, Safari latest versions)

### "Notification permission denied"
- Users must manually grant permission
- Provide clear UI explaining the benefits
- Handle graceful fallbacks

### "Failed to get FCM token"
- Check Firebase configuration values
- Ensure VAPID key is correctly set
- Verify service worker registration

### "Notifications not showing in background"
- Ensure service worker is properly registered
- Check browser background sync permissions
- Verify Firebase project settings

## Features Implemented

✅ **Frontend Components:**
- Firebase configuration service
- FCM token management
- Push notification service
- Notification context provider
- Enhanced notification dropdown
- Permission handling
- Background message handling

✅ **UI Components:**
- Push notification dropdown with real-time updates
- Notification permission requests
- Test interface for development
- Unread count badges
- Notification history management

✅ **Backend Integration Ready:**
- Token storage and management
- API endpoints structure
- Server-side notification sending
- User-specific notifications

## Next Steps

1. Complete Firebase configuration with your actual project details
2. Implement backend API endpoints for sending notifications
3. Add notification triggers for specific events (appointments, messages, etc.)
4. Test across different browsers and devices
5. Monitor and optimize notification delivery rates

## Security Considerations

- Store Firebase config securely
- Validate notification requests on backend
- Implement rate limiting for notification sending
- Handle user preferences and opt-outs
- Secure VAPID key management

## Support

For issues with Firebase setup:
- [Firebase Documentation](https://firebase.google.com/docs)
- [FCM Web Guide](https://firebase.google.com/docs/cloud-messaging/web/client)
- [Firebase Console](https://console.firebase.google.com)

For MediClinic-specific implementation:
- Check the test page at `/push-notification-test`
- Review browser console for error messages
- Ensure all configuration values are correctly set
