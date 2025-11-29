// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration - should match your config in firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyB9dCHjEG9hs66EhrajUIYQjfz9od5QMI0",
  authDomain: "mediclinic-web.firebaseapp.com",
  projectId: "mediclinic-web",
  storageBucket: "mediclinic-web.firebasestorage.app",
  messagingSenderId: "1065611441288",
  appId: "1:1065611441288:web:ce98e82a4e8167ad599b3d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title || 'MediClinic Notification';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new notification',
    icon: payload.notification.icon || '/favicon.ico',
    image: payload.notification.image,
    badge: '/favicon.ico',
    tag: payload.data?.tag || 'mediclinic',
    requireInteraction: payload.data?.requireInteraction || false,
    actions: payload.data?.actions || [],
    data: payload.data || {},
    click_action: payload.data?.actionUrl || '/'
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);
  
  event.notification.close();
  
  // Handle different notification types
  const notificationData = event.notification.data || {};
  const action = event.action;
  
  if (action) {
    // Handle specific action clicks
    handleNotificationAction(action, notificationData);
  } else {
    // Handle default notification click
    handleNotificationClick(notificationData);
  }
});

// Handle notification clicks
function handleNotificationClick(data) {
  const actionUrl = data.actionUrl || '/';
  
  // Focus or open the window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === actionUrl && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(actionUrl);
        }
      })
  );
}

// Handle notification action clicks
function handleNotificationAction(action, data) {
  console.log(`[firebase-messaging-sw.js] Action clicked: ${action}`, data);
  
  // Handle different actions based on type
  switch (action) {
    case 'view':
      handleNotificationClick(data);
      break;
    case 'dismiss':
      // Just close the notification (already done)
      break;
    case 'reply':
      // Handle reply action if needed
      console.log('Reply action not implemented yet');
      break;
    default:
      console.log(`Unknown action: ${action}`);
  }
}

// Handle push events (for additional push functionality)
self.addEventListener('push', function(event) {
  console.log('[firebase-messaging-sw.js] Push event received:', event);
  
  // This is handled by Firebase messaging, but you can add custom logic here if needed
  if (event.data) {
    const data = event.data.json();
    console.log('Push data:', data);
  }
});

// Handle sync events (for offline functionality)
self.addEventListener('sync', function(event) {
  console.log('[firebase-messaging-sw.js] Sync event received:', event);
  
  // Handle background sync if needed
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Performing background sync...');
  return Promise.resolve();
}
