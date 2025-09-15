# IgabayCare Notification System

## Overview

The IgabayCare notification system is a comprehensive, real-time notification infrastructure designed to handle various types of notifications for patients, clinics, and doctors. It provides instant updates, customizable preferences, and robust testing capabilities.

## Features

- ✅ **Real-time Notifications**: Instant updates using Supabase real-time subscriptions
- ✅ **Multi-type Support**: Appointment, review, system, medical, and payment notifications
- ✅ **Priority System**: Low, normal, high, and urgent priority levels
- ✅ **User Preferences**: Customizable notification settings per user
- ✅ **Browser Notifications**: Native browser notification support
- ✅ **Audio Alerts**: Sound notifications with customizable tones
- ✅ **Vibration Support**: Mobile device vibration alerts
- ✅ **Quiet Hours**: Configurable quiet periods
- ✅ **Testing Tools**: Comprehensive testing and validation framework
- ✅ **Error Handling**: Robust error handling and graceful degradation

## Architecture

### Core Components

1. **NotificationService** (`src/services/notificationService.ts`)
   - CRUD operations for notifications
   - Database integration with Supabase
   - Notification preferences management

2. **RealTimeNotificationService** (`src/services/realTimeNotificationService.ts`)
   - Real-time subscription management
   - Browser notification handling
   - Audio and vibration support
   - Permission management

3. **useNotifications Hook** (`src/hooks/useNotifications.ts`)
   - React hook for notification state management
   - Real-time updates integration
   - Loading states and error handling

4. **NotificationDropdown** (`src/components/patient/NotificationDropdown.tsx`)
   - Main notification UI component
   - Real-time notification display
   - Mark as read/dismiss functionality

5. **NotificationPreferencesPanel** (`src/components/patient/NotificationPreferencesPanel.tsx`)
   - User preference management UI
   - Channel preferences (email, SMS, push, in-app)
   - Quiet hours configuration

### Type Definitions

**Notification Types** (`src/types/notifications.ts`):
- `appointment`: Appointment-related notifications
- `review`: Review and feedback notifications
- `system`: System announcements and updates
- `medical`: Medical records and health information
- `payment`: Payment and billing notifications

**Priority Levels**:
- `low`: Non-urgent notifications
- `normal`: Standard notifications (default)
- `high`: Important notifications
- `urgent`: Critical notifications requiring immediate attention

## Database Schema

```sql
-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('patient', 'clinic', 'doctor')),
  type TEXT NOT NULL CHECK (type IN ('appointment', 'review', 'system', 'medical', 'payment')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  action_text TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE
);

-- Notification preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  user_type TEXT NOT NULL,
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage Examples

### Basic Notification Creation

```typescript
import { NotificationService } from '../services/notificationService';

// Create a notification
const result = await NotificationService.createNotification({
  user_id: 'user-123',
  user_type: 'patient',
  type: 'appointment',
  title: 'Appointment Reminder',
  message: 'You have an appointment tomorrow at 2:00 PM',
  priority: 'high',
  action_url: '/appointments/123',
  action_text: 'View Appointment'
});
```

### Using the Notifications Hook

```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent({ userId }) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isRealTimeConnected,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh
  } = useNotifications(userId, {
    realTime: true,
    playSound: true,
    showBrowserNotification: true,
    vibrate: true
  });

  return (
    <div>
      <h3>Notifications ({unreadCount} unread)</h3>
      {notifications.map(notification => (
        <div key={notification.id}>
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
          <button onClick={() => markAsRead(notification.id)}>
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Notification Preferences

```typescript
import { NotificationService } from '../services/notificationService';

// Get user preferences
const preferences = await NotificationService.getNotificationPreferences(userId);

// Update preferences
const updatedPreferences = await NotificationService.updateNotificationPreferences(userId, {
  email_enabled: true,
  sms_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  preferences: {
    appointment: { email: true, sms: true, push: true, in_app: true },
    system: { email: false, sms: false, push: true, in_app: true }
  }
});
```

## Testing and Validation

### Test Components

1. **NotificationTestPanel** (`src/components/debug/NotificationTestPanel.tsx`)
   - Interactive testing interface
   - Send test notifications
   - Monitor real-time updates
   - System feature testing

2. **NotificationTestPage** (`src/pages/debug/NotificationTestPage.tsx`)
   - Complete testing page with user configuration
   - Testing guides and troubleshooting

3. **NotificationValidator** (`src/utils/notificationValidator.ts`)
   - Automated validation tests
   - Service availability checks
   - CRUD operation testing
   - Error handling validation

### Running Tests

```typescript
import NotificationValidator from '../utils/notificationValidator';

// Full validation
const validator = new NotificationValidator('test-user-id', 'patient');
const results = await validator.runFullValidation();

console.log('Validation passed:', results.passed);
console.log('Duration:', results.duration + 'ms');
console.log('Results:', results.results);

// Quick validation
const quickResults = await validator.runQuickValidation();
```

### Testing Checklist

- [ ] Service availability and method existence
- [ ] Notification CRUD operations
- [ ] Real-time subscription functionality
- [ ] Type definitions and constants
- [ ] Error handling for invalid data
- [ ] Browser notification permissions
- [ ] Audio and vibration support
- [ ] Cross-tab synchronization
- [ ] Preference management
- [ ] Quiet hours functionality

## Integration Guide

### 1. Add to Navigation

```typescript
import { NotificationDropdown } from '../components/patient/NotificationDropdown';

// In your navigation component
<NotificationDropdown userId={currentUser.id} />
```

### 2. Add Preferences to Settings

```typescript
import { NotificationPreferencesPanel } from '../components/patient/NotificationPreferencesPanel';

// In your settings page
<NotificationPreferencesPanel
  userId={currentUser.id}
  userType="patient"
/>
```

### 3. Initialize Real-time Service

```typescript
import RealTimeNotificationService from '../services/realTimeNotificationService';

// In your app initialization
useEffect(() => {
  if (user?.id) {
    RealTimeNotificationService.requestPermission();
  }
}, [user]);
```

## Configuration

### Environment Variables

```env
# Supabase configuration (required for real-time)
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Custom audio files
REACT_APP_NOTIFICATION_SOUND_URL=/sounds/notification.mp3
```

### Customization Options

```typescript
// Custom notification sounds
const customOptions = {
  soundUrl: '/custom-notification.mp3',
  vibrationPattern: [200, 100, 200],
  defaultIcon: '/notification-icon.png'
};

RealTimeNotificationService.setOptions(customOptions);
```

## Performance Considerations

1. **Connection Management**: Real-time connections are managed per user and automatically cleaned up
2. **Memory Usage**: Notifications are limited to recent items with automatic cleanup
3. **Network Optimization**: Only essential data is transmitted in real-time updates
4. **Browser Limits**: Browser notification quotas are respected and managed

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|---------|------|
| Real-time | ✅ | ✅ | ✅ | ✅ |
| Browser Notifications | ✅ | ✅ | ✅ | ✅ |
| Audio Alerts | ✅ | ✅ | ⚠️* | ✅ |
| Vibration | ✅ | ✅ | ❌ | ✅ |

*Safari requires user interaction before playing audio

## Troubleshooting

### Common Issues

1. **Real-time not working**
   - Check Supabase configuration
   - Verify user permissions
   - Check network connectivity

2. **Browser notifications not showing**
   - Ensure permission is granted
   - Check browser notification settings
   - Verify the notification format

3. **Audio not playing**
   - Check browser autoplay policies
   - Ensure user interaction has occurred
   - Verify audio file accessibility

### Debug Tools

Use the NotificationTestPanel to diagnose issues:

```typescript
// Access at /debug/notifications
<NotificationTestPanel userId="test-user" userType="patient" />
```

## Security Considerations

1. **User Isolation**: Notifications are strictly filtered by user ID
2. **Permission Checks**: Real-time subscriptions verify user access
3. **Data Validation**: All inputs are validated and sanitized
4. **Rate Limiting**: Notification creation is rate-limited to prevent spam

## Future Enhancements

- [ ] Push notification integration (FCM/APNS)
- [ ] Email notification templates
- [ ] SMS integration
- [ ] Notification analytics and tracking
- [ ] Advanced filtering and search
- [ ] Notification scheduling
- [ ] Multi-language support
- [ ] Rich media notifications

## API Reference

### NotificationService

#### Methods

- `createNotification(data)` - Create a new notification
- `getNotifications(userId, options?)` - Fetch user notifications
- `markAsRead(notificationId)` - Mark notification as read
- `markAllAsRead(userId)` - Mark all notifications as read
- `deleteNotification(notificationId)` - Delete a notification
- `getNotificationPreferences(userId)` - Get user preferences
- `updateNotificationPreferences(userId, preferences)` - Update preferences

### RealTimeNotificationService

#### Methods

- `subscribe(userId, callbacks)` - Subscribe to real-time updates
- `unsubscribe(userId)` - Unsubscribe from updates
- `requestPermission()` - Request browser notification permission
- `isSupported()` - Check feature support
- `playSound(soundUrl?)` - Play notification sound
- `vibrate(pattern?)` - Trigger device vibration

### useNotifications Hook

#### Returns

- `notifications` - Array of notifications
- `unreadCount` - Count of unread notifications
- `loading` - Loading state
- `error` - Error message if any
- `isRealTimeConnected` - Real-time connection status
- `markAsRead(id)` - Mark notification as read
- `markAllAsRead()` - Mark all as read
- `dismiss(id)` - Dismiss notification
- `refresh()` - Refresh notifications
- `testNotification()` - Send test notification

## Support

For issues or questions regarding the notification system, please:

1. Check the troubleshooting guide above
2. Use the NotificationTestPanel for debugging
3. Review the browser console for error messages
4. Contact the development team with validation results

---

*Last updated: December 2024*